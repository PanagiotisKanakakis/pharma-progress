import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {Subject} from 'rxjs';

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
import {User} from '../../../auth/models';
import {plainToInstance} from 'class-transformer';
import {Router} from '@angular/router';
import DateUtils from '../../../common/utils/date';
import {FormControl, Validators} from '@angular/forms';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {SupplierType} from '../../../api/transaction/enums/supplier-type.enum';
import {AuthenticationService} from '../../../auth/service';

@Component({
    selector: 'operating-expenses-datatable',
    templateUrl: './operating-expenses.component.html',
    styleUrls: ['./operating-expenses.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OperatingExpensesComponent implements OnInit {

    private _unsubscribeAll: Subject<any>;
    public rows = [];
    public editingValue = {};
    public editingDateValue = {};
    public basicDPdata: NgbDateStruct;
    public dates = [];
    public days = [];
    public transactions: any = [];
    public transactionsToSubmit: TransactionEntity[] = [];
    operatingExpenses = [];
    public currentUser: User;
    public dateFormControl = [];
    public regexPattern: any;
    public period: DatePeriod;
    public contentHeader: object;
    public numberFormControl: any[] = [];

    constructor(private _coreTranslationService: CoreTranslationService,
                private _authenticationService: AuthenticationService,
                private _router: Router) {
        this._unsubscribeAll = new Subject();
        this._coreTranslationService.translate(english, greek);
        this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
    }

    ngOnInit() {
        this.initContentHeader();
        this.initOperatingExpensesOptionsList();
        this.regexPattern = /^(0[1-9]|[12][0-9]|3[01])[\\-](0[1-9]|1[012])[\\-]\d{4}$/;
        this.dateFormControl[0] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
        this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
        this.getTransactions();
    }

    formatDate(date: Date) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return dd + '/' + mm + '/' + yyyy;
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

    initOperatingExpensesOptionsList() {
        Object.keys(TransactionType).forEach((s: string, index) => {
            const e = (<any>TransactionType)[s];
            if (e !== TransactionType.INCOME
                && e !== TransactionType.PERSONAL_WITHDRAWALS
                && e !== TransactionType.EXPENSE
                && e !== TransactionType.PAYMENT
                && e !== TransactionType.EOPPY
                && !e.toString().includes('function')) {
                this.operatingExpenses.push(e);
            }
        });
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

    addNewRow(transactionType: string | undefined, id: number | undefined, cost: number, date: string | undefined) {
        this.numberFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.min(0)]);
        this.dateFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.dateFormControl[this.rows.length].setErrors(null);
        this.numberFormControl[this.rows.length].setErrors(null);
        if (date === undefined) {
            date = DateUtils.formatDate(new Date());
        }
        this.rows = [...this.rows, {
            id: id,
            transactionType: transactionType,
            supplierType: SupplierType.NONE,
            cost: cost,
            createdAt: date,
            comment: '',
            vat: this.calculateVat(transactionType),
            paymentType: PaymentType.CASH,
        }];
    }

    getTransactions() {
        const transactionType = [
            TransactionType.getIndexOf(TransactionType.RENT),
            TransactionType.getIndexOf(TransactionType.INSURANCE_CONTRIBUTION),
            TransactionType.getIndexOf(TransactionType.PAYROLL),
            TransactionType.getIndexOf(TransactionType.EFKA),
            TransactionType.getIndexOf(TransactionType.ACCOUNTANT),
            TransactionType.getIndexOf(TransactionType.ELECTRICITY_BILL),
            TransactionType.getIndexOf(TransactionType.PHONE_BILL),
            TransactionType.getIndexOf(TransactionType.CONSUMABLES),
            TransactionType.getIndexOf(TransactionType.BANK_CHARGES),
            TransactionType.getIndexOf(TransactionType.WATER_SUPPLY),
            TransactionType.getIndexOf(TransactionType.TAXES),
            TransactionType.getIndexOf(TransactionType.OTHER_EXPENSES),
        ];
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'date': this.period.dateFrom,
                'range': 'monthly',
                'transactionType': transactionType,
                'supplierType': SupplierType.getIndexOf(SupplierType.NONE),
                'paymentType': [PaymentType.getIndexOf(PaymentType.CASH)]
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
                    this.addNewRow(TransactionType.valueOf(transaction.transactionType),
                        transaction.id, transaction.cost, DateUtils.formatDbDate(transaction.createdAt));
                    this.rows[i].transactionType = TransactionType.valueOf(transaction.transactionType);
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
            tr.paymentType = PaymentType.getIndexOf(row.paymentType);
            tr.vat = VAT.getIndexOf(row.vat);
            tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
            tr.cost = row.cost;
            tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
            tr.comment = row.comment;
            console.log(tr);
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
        )
            .then()
            .catch((error: any) => {
                this._authenticationService.logout();
                this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            });
    }

    private initContentHeader() {
        this.contentHeader = {
            headerTitle: 'Λειτουργικά έξοδα',
            actionButton: false,
            breadcrumb: {
                type: '',
                links: [
                    {
                        name: 'Αρχική',
                        isLink: true,
                        link: '/'
                    },
                    {
                        name: 'Λειτουργικά έξοδα',
                        isLink: false
                    }
                ]
            }
        };
    }

    private calculateVat(transactionType: string): VAT {
        if(transactionType == TransactionType.ELECTRICITY_BILL){
            return VAT.SIX;
        }else if(transactionType == TransactionType.WATER_SUPPLY){
            return VAT.THIRTEEN;
        }else if (
            transactionType == TransactionType.ACCOUNTANT ||
            transactionType == TransactionType.PHONE_BILL ||
            transactionType == TransactionType.CONSUMABLES ||
            transactionType == TransactionType.OTHER_EXPENSES){
            return VAT.TWENTYFOUR
        }else {
            return VAT.ZERO;
        }
    }
}
