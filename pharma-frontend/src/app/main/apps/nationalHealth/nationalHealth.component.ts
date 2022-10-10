import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {Subject} from 'rxjs';
import {ColumnMode} from '@swimlane/ngx-datatable';

import {CoreTranslationService} from '@core/services/translation.service';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {TransactionEntity} from 'app/api/transaction/transaction.entity';
import {locale as english} from 'app/common/i18n/en';
import {locale as greek} from 'app/common/i18n/gr';
import {
    getTransactionsByCriteria,
    PaymentType,
    submitTransactions,
    TransactionType,
    updateTransactions,
    VAT
} from '../../../api/transaction';
import {ActivatedRoute, Router} from '@angular/router';
import {plainToInstance} from 'class-transformer';
import {User} from '../../../auth/models';
import DateUtils from '../../../common/utils/date';
import {FormControl, Validators} from '@angular/forms';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {SupplierType} from '../../../api/transaction/enums/supplier-type.enum';

@Component({
    selector: 'national-health-datatable',
    templateUrl: './nationalHealth.component.html',
    styleUrls: ['./nationalHealth.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NationalHealthComponent implements OnInit {
    private _unsubscribeAll: Subject<any>;
    public rows = [];
    public ColumnMode = ColumnMode;
    public editingValue = {};
    public editingDateValue = {};
    public basicDPdata: NgbDateStruct;
    public transactions: any = [];
    public transactionsToSubmit: TransactionEntity[] = [];
    public cells = [];
    public currentUser: User;
    private type = '';
    public dateFormControl = [];
    public period: DatePeriod;
    public regexPattern;
    public numberFormControl: any[] = [];

    constructor(private _coreTranslationService: CoreTranslationService,
                private _router: Router,
                private route: ActivatedRoute) {
        this._unsubscribeAll = new Subject();
        this._coreTranslationService.translate(english, greek);
        this.currentUser = plainToInstance(User, JSON.parse(localStorage.getItem('currentUser')));
    }

    ngOnInit() {
        this.regexPattern = /^(0[1-9]|[12][0-9]|3[01])[\\-](0[1-9]|1[012])[\\-]\d{4}$/;
        this.dateFormControl[0] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.route.paramMap.subscribe(params => {
            this.type = params.get('type');
            this.rows = [];
            this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
            this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
            this.getTransactions();
        });

    }

    initTransactions() {
        this.addNewRow(undefined, 0, '', '');
    }

    inlineEditingUpdateValue(event, rowIndex) {
        if (this.numberFormControl[rowIndex].valid) {
            this.editingValue[rowIndex] = false;
            this.rows[rowIndex].cost = event.target.value;
            if (this.rows[rowIndex].id === undefined) {
                this.submitTransaction(this.rows[rowIndex], rowIndex);
            } else {
                this.updateTransaction(this.rows[rowIndex]);
            }
        }
    }

    onDateSelect(date: NgbDate) {
        this.period = DateUtils.NgbDateToMonthPeriod(date);
        this.getTransactions();
    }

    addNewRow(id: number | undefined , cost: number, comment: string, date: string | undefined) {
        this.numberFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.min(0)]);
        this.dateFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.dateFormControl[this.rows.length].setErrors(null);
        this.numberFormControl[this.rows.length].setErrors(null);
        if (date === undefined) {
            date = DateUtils.formatDate(new Date());
        }
        if (this.type === 'income') {
            this.rows = [...this.rows, {
                id: id,
                transactionType: TransactionType.EOPPY,
                vat: VAT.NONE,
                paymentType: PaymentType.BANK,
                supplier: SupplierType.getIndexOf(SupplierType.NONE),
                comment: comment,
                cost: cost,
                createdAt: date,
            }];
        } else {
            this.rows = [...this.rows, {
                id: id,
                transactionType: TransactionType.EOPPY,
                vat: VAT.NONE,
                paymentType: PaymentType.ON_ACCOUNT,
                supplier: SupplierType.getIndexOf(SupplierType.NONE),
                comment: comment,
                cost: cost,
                createdAt: date,
            }];
        }
    }

    removeRow(rowIndex: any) {
        const temp = [...this.rows];
        temp.splice(rowIndex, 1);
        this.rows = temp;
    }

    summaryColumn() {
        let value = 0;
        this.rows.forEach((row) => {
            value += Number(row.cost);
        });
        return value;
    }

    parseDate(event, rowIndex: any) {
        this.editingDateValue[rowIndex] = false;
        if (DateUtils.dateInRange(this.period, DateUtils.toDate(event.target.value))) {
            this.rows[rowIndex].createdAt = event.target.value;
            this.dateFormControl[rowIndex].setErrors(null);
        } else {
            this.dateFormControl[rowIndex].setErrors({'range': true});
        }
    }

    submitTransaction(row, rowIndex) {
        if (this.dateFormControl[rowIndex].valid) {
            let transactions = []
            let tr = new TransactionEntity();
            tr.userId = this.currentUser.id;
            tr.transactionType = TransactionType.getIndexOf(row.transactionType);
            tr.paymentType = PaymentType.getIndexOf(row.paymentType);
            tr.vat = VAT.getIndexOf(row.vat);
            tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
            tr.cost = row.cost;
            tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
            tr.comment = row.comment;
            transactions.push(tr);

            /*
            * in case we have an income from EOPPY we create an extra transaction
            * for income of previous months
            * */
            if(this.type === 'income'){
                let tr = new TransactionEntity();
                tr.userId = this.currentUser.id;
                tr.transactionType = TransactionType.getIndexOf(TransactionType.INCOME);
                tr.paymentType = PaymentType.getIndexOf(PaymentType.PREVIOUS_MONTHS_RECEIPTS);
                tr.vat = VAT.getIndexOf(VAT.NONE);
                tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
                tr.cost = row.cost;
                tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
                tr.comment = row.comment;
                transactions.push(tr);
            }

            console.log(tr);
            submitTransactions(
                {'transactions': transactions},
                {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.currentUser.token
                }
            )
                .then(r => row.id = r[0].id)
                .catch((error: any) => {
                    localStorage.removeItem('currentUser');
                    this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            });
        }

    }

    onChange(event, row) {
        row.comment = event.target.value;
    }

    private updateTransaction(row: any) {
        const tr = new TransactionEntity();
        tr.id = row.id;
        tr.userId = this.currentUser.id;
        tr.transactionType = TransactionType.getIndexOf(row.transactionType);
        tr.paymentType = PaymentType.getIndexOf(row.paymentType);
        tr.vat = VAT.getIndexOf(row.vat);
        tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
        tr.cost = row.cost;
        tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
        tr.comment = row.comment;
        updateTransactions(
            {'transactions': [tr]},
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then();
    }

    private getTransactions() {
        let paymentType = PaymentType.BANK;
        if (this.type !== 'income') {
            paymentType = PaymentType.ON_ACCOUNT;
        }
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'dateFrom': this.period.dateFrom,
                'dateTo': this.period.dateTo,
                'transactionType': [TransactionType.getIndexOf(TransactionType.EOPPY)],
                'paymentType': [PaymentType.getIndexOf(paymentType)]
            },
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then((data) => {
            console.log(data);
            this.rows = [];
            if (data.length !== 0) {
                for (let i = 0; i < data.length; i++) {
                    const transaction = plainToInstance(TransactionEntity, data[i]);
                    this.addNewRow(transaction.id, transaction.cost, transaction.comment,  DateUtils.formatDbDate(transaction.createdAt));
                    this.rows[i].createdAt = DateUtils.formatDbDate(transaction.createdAt);
                }
                this.summaryColumn();
            }
        }).catch((_: any) => {
            localStorage.removeItem('currentUser');
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }
}
