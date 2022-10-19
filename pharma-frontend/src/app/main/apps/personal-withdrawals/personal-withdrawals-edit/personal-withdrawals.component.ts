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
} from '../../../../api/transaction';
import {ActivatedRoute, Router} from '@angular/router';
import {plainToInstance} from 'class-transformer';
import {User} from '../../../../auth/models';
import DateUtils from '../../../../common/utils/date';
import {FormControl, Validators} from '@angular/forms';
import {DatePeriod} from '../../../../common/utils/interfaces/date-period.interface';
import {AuthenticationService} from '../../../../auth/service';
import {SupplierType} from '../../../../api/transaction/enums/supplier-type.enum';

@Component({
    selector: 'personal-withdrawals-datatable',
    templateUrl: './personal-withdrawals.component.html',
    styleUrls: ['./personal-withdrawals.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PersonalWithdrawalsComponent implements OnInit {
    public _unsubscribeAll: Subject<any>;
    public rows = [];
    public editingValue = {};
    public editingDateValue = {};
    public basicDPdata: NgbDateStruct;
    public transactions: any = [];
    public transactionsToSubmit: TransactionEntity[] = [];
    public currentUser: User;
    public dateFormControl = [];
    public regexPattern: any;
    public period: DatePeriod;
    public contentHeader: object;
    private type = '';
    public numberFormControl: any[] = [];


    constructor(private _coreTranslationService: CoreTranslationService,
                private _authenticationService: AuthenticationService,
                private _router: Router,
                private route: ActivatedRoute) {
        this._unsubscribeAll = new Subject();
        this._coreTranslationService.translate(english, greek);
        this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.type = params.get('type');
            this.regexPattern = /^(0[1-9]|[12][0-9]|3[01])[\\-](0[1-9]|1[012])[\\-]\d{4}$/;
            this.dateFormControl[0] = new FormControl('',
                [Validators.required, Validators.pattern(this.regexPattern)]);
            this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
            this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
            this.getTransactions();
        });
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

    onOptionsSelected(value: string, rowIndex: number) {
        this.rows[rowIndex].transactionType = value;
    }

    removeRow(rowIndex: any) {
        const temp = [...this.rows];
        temp.splice(rowIndex, 1);
        this.rows = temp;
    }

    searchData(transactionType: string, paymentType: string, vat: string, data: any): any {
        for (let i = 0; i < data.length; i++) {
            const transaction = plainToInstance(TransactionEntity, data[i]);
            if (transaction.transactionType === TransactionType.getIndexOf(transactionType)
                && transaction.paymentType === PaymentType.getIndexOf(paymentType)
                && transaction.vat === VAT.getIndexOf(vat)
            ) {
                return +transaction.cost;
            }
        }
        return -1;
    }

    addNewRow(id: number | undefined, cost: number, date: string | undefined) {
        this.dateFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.numberFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.min(0)]);
        this.dateFormControl[this.rows.length].setErrors(null);
        this.numberFormControl[this.rows.length].setErrors(null);
        if (date === undefined) {
            date = DateUtils.formatDate(new Date());
        }
        if (this.type === 'cash') {
            this.rows = [...this.rows, {
                id: id,
                transactionType: TransactionType.PERSONAL_WITHDRAWALS,
                supplierType: SupplierType.NONE,
                cost: cost,
                createdAt: date,
                comment: '',
                vat: VAT.NONE,
                paymentType: PaymentType.CASH,
            }];
        } else {
            this.rows = [...this.rows, {
                id: id,
                transactionType: TransactionType.PERSONAL_WITHDRAWALS,
                supplierType: SupplierType.NONE,
                cost: cost,
                createdAt: date,
                comment: '',
                vat: VAT.NONE,
                paymentType: PaymentType.BANK,
            }];
        }

    }

    getTransactions() {
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'date': this.period.dateFrom,
                'range': 'monthly',
                'transactionType': [TransactionType.getIndexOf(TransactionType.PERSONAL_WITHDRAWALS)],
                'supplierType': SupplierType.getIndexOf(SupplierType.NONE),
                'paymentType': [this.getPaymentType()]
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
                    this.addNewRow(transaction.id, transaction.cost, DateUtils.formatDbDate(transaction.createdAt));
                    this.rows[i].paymentType = PaymentType.valueOf(transaction.paymentType);
                    this.rows[i].createdAt = DateUtils.formatDbDate(transaction.createdAt);
                }
                this.summaryColumn();
            }
        }).catch((_: any) => {
            this._authenticationService.logout();
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }

    submitTransaction(row, rowIndex) {
        if (this.dateFormControl[rowIndex].valid) {
            const tr = new TransactionEntity();
            tr.userId = this.currentUser.id;
            tr.transactionType = TransactionType.getIndexOf(row.transactionType);
            tr.paymentType = this.getPaymentType();
            tr.vat = VAT.getIndexOf(row.vat);
            tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
            tr.cost = row.cost;
            tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
            tr.comment = row.comment;
            submitTransactions(
                {'transactions': [tr]},
                {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.currentUser.token
                }
            )
                .then(r => row.id = r[0].id)
                .catch((error: any) => {
                    this._authenticationService.logout();
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
        tr.paymentType = this.getPaymentType();
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
        )
            .then()
            .catch((error: any) => {
                this._authenticationService.logout();
                this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            });
    }

    submitTransactions() {
        this.transactionsToSubmit = [];
        this.rows.forEach((row, i) => {
            const tr = new TransactionEntity();
            tr.id = this.currentUser.id;
            tr.transactionType = TransactionType.getIndexOf(row.transactionType);
            tr.paymentType = this.getPaymentType();
            tr.vat = VAT.getIndexOf(row.vat);
            tr.createdAt = row.createdAt;
            tr.cost = row.cost;
            this.transactionsToSubmit.push(tr);
        });
        console.log(this.transactionsToSubmit);
        submitTransactions(
            {'transactions': this.transactionsToSubmit},
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then(r => console.log(r));
    }

    private getPaymentType() {
        let paymentType = PaymentType.getIndexOf(PaymentType.CASH);
        if (this.type === 'bank') {
            paymentType = PaymentType.getIndexOf(PaymentType.BANK);
        }
        return paymentType;
    }
}
