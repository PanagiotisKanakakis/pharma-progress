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
    submitTransaction,
    TransactionType,
    updateTransaction,
    VAT
} from '../../../api/transaction';
import {ActivatedRoute, Router} from '@angular/router';
import {plainToInstance} from 'class-transformer';
import {User} from '../../../auth/models';
import DateUtils from '../../../common/utils/date';
import {FormControl, Validators} from '@angular/forms';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {SupplierType} from '../../../api/transaction/enums/supplier-type.enum';
import {AuthenticationService} from '../../../auth/service';
import {Greek} from 'flatpickr/dist/l10n/gr';

@Component({
    selector: 'payment-datatable',
    templateUrl: './payment.component.html',
    styleUrls: ['./payment.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PaymentComponent implements OnInit {
    private _unsubscribeAll: Subject<any>;
    public rows = [];
    public editingValue = {};
    public editingDateValue = {};
    public exportCSVData;
    public basicDPdata: NgbDateStruct;
    public dates = [];
    public transactions: any = [];
    public transactionsToSubmit: TransactionEntity[] = [];
    public currentUser: User;
    public dateFormControl = [];
    public period: DatePeriod;
    public contentHeader: object;
    type = '';
    public regexPattern;
    public numberFormControl: any[] = [];
    DateRangeOptions: any;


    constructor(private _coreTranslationService: CoreTranslationService,
                private _router: Router,
                private route: ActivatedRoute,
                private _authenticationService: AuthenticationService) {
        this._unsubscribeAll = new Subject();
        this._coreTranslationService.translate(english, greek);
        this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.type = params.get('type');
            console.log(this.type)
            this.rows = [];
            this.regexPattern = /^(0[1-9]|[12][0-9]|3[01])[\\-](0[1-9]|1[012])[\\-]\d{4}$/;
            this.dateFormControl[0] = new FormControl('',
                [Validators.required, Validators.pattern(this.regexPattern)]);
            this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
            this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
            // ng2-flatpickr options
            this.DateRangeOptions = {
                weekNumbers: true,
                locale: Greek,
                altInput: true,
                altInputClass: 'form-control flat-picker bg-transparent border-0 shadow-none flatpickr-input',
                defaultDate: new Date(),
                dateFormat: 'm.y',
                altFormat: 'F Y',
                onClose: (selectedDates: any) => {
                    this.period = DateUtils.NgbDateToMonthPeriod(
                        new NgbDate(+selectedDates[0].getUTCFullYear(), +selectedDates[0].getUTCMonth()+1, +selectedDates[0].getUTCDate()));
                    this.getTransactions();
                },
            };
            this.getTransactions();
        });

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
                this.submit(this.rows[rowIndex], rowIndex);
            } else {
                this.update(this.rows[rowIndex]);
            }
        }
    }

    private getTransactions() {
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'date': this.period.dateFrom,
                'range': 'monthly',
                'transactionType': [TransactionType.getIndexOf(this.getTransactionType())],
                'supplierType': this.getSupplierType(),
                'paymentType': [
                    PaymentType.getIndexOf(PaymentType.BANK),
                    PaymentType.getIndexOf(PaymentType.CASH),
                    PaymentType.getIndexOf(PaymentType.ON_ACCOUNT)
                ]
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
                    this.addNewRow(transaction.id, transaction.cost, DateUtils.formatDbDate(transaction.createdAt), transaction.paymentType);
                    this.rows[i].createdAt = DateUtils.formatDbDate(transaction.createdAt);
                    this.rows[i].comment = transaction.comment;
                }
                this.summaryColumn();
            }
        }).catch((_: any) => {
            this._authenticationService.logout();
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }

    initTransaction() {
        this.addNewRow(undefined, 0, undefined, undefined);
    }

    parseDate(event, rowIndex: any) {
        this.editingDateValue[rowIndex] = false;
        if (DateUtils.dateInRange(this.period, DateUtils.toDate(event.target.value))) {
            this.rows[rowIndex].createdAt = event.target.value;
            this.dateFormControl[rowIndex].setErrors(null);
            if (this.rows[rowIndex].id === undefined) {
                this.submit(this.rows[rowIndex], rowIndex);
            } else {
                this.update(this.rows[rowIndex]);
            }
        } else {
            this.dateFormControl[rowIndex].setErrors({'range': true});
        }
    }

    onOptionsSelected(value: string, rowIndex: number) {
        this.rows[rowIndex].paymentType = value;
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

    summaryColumn() {
        let value = 0;
        this.rows.forEach((row) => {
            value += Number(row.cost);
        });
        return value;
    }

    addNewRow(id: number | undefined,
              cost: number,
              date: string | undefined,
              paymentType: number | undefined) {
        this.dateFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.numberFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.min(0)]);
        this.dateFormControl[this.rows.length].setErrors(null);
        this.numberFormControl[this.rows.length].setErrors(null);
        if (date === undefined) {
            date = DateUtils.formatDate(new Date());
        }
        this.rows = [...this.rows, {
            category: this.getPaymentCategory(),
            id: id,
            transactionType: this.getTransactionType(),
            supplierType: this.getSupplierName(),
            cost: cost,
            createdAt: date,
            comment: '',
            vat: VAT.NONE,
            paymentType: PaymentType.valueOf(paymentType),
        }];
        console.log(this.rows);
    }

    getSupplierType() {
        let supplierType = SupplierType.getIndexOf(SupplierType.NONE);
        if (this.type === 'main') {
            supplierType = SupplierType.getIndexOf(SupplierType.MAIN);
        }else if(this.type == 'other'){
            supplierType = SupplierType.getIndexOf(SupplierType.OTHER);
        }
        return supplierType;
    }

    getSupplierName() {
        let supplierType = SupplierType.NONE;
        if (this.type === 'main') {
            supplierType = SupplierType.MAIN;
        }else if(this.type === 'other'){
            supplierType = SupplierType.OTHER;
        }
        return supplierType;
    }

    submit(row, rowIndex) {
        if (this.dateFormControl[rowIndex].valid) {
            const tr = new TransactionEntity();
            tr.userId = this.currentUser.id;
            tr.transactionType = TransactionType.getIndexOf(row.transactionType);

            if(this.type == 'taxes'){
                tr.paymentType = PaymentType.getIndexOf(PaymentType.CASH);
            }else{
                tr.paymentType = PaymentType.getIndexOf(row.paymentType);
            }
            tr.vat = VAT.getIndexOf(row.vat);
            tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
            tr.cost = row.cost;
            tr.supplierType = this.getSupplierType();
            tr.comment = row.comment;
            console.log(tr);
            submitTransaction(
                tr,
                {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.currentUser.token
                }
            )
                .then(r => row.id = r.id)
                .catch((_: any) => {
                    this._authenticationService.logout();
                    this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
                });
        }

    }

    private update(row: any) {
        const tr = new TransactionEntity();
        tr.id = row.id;
        tr.userId = this.currentUser.id;
        tr.transactionType = TransactionType.getIndexOf(row.transactionType);
        tr.paymentType = PaymentType.getIndexOf(row.paymentType);
        tr.vat = VAT.getIndexOf(row.vat);
        tr.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
        tr.cost = row.cost;
        tr.supplierType = this.getSupplierType();
        tr.comment = row.comment;
        updateTransaction(
            tr,
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

    private getTransactionType() {
        if (this.type === 'taxes'){
            return TransactionType.TAXES;
        }
        return TransactionType.PAYMENT;
    }

    private getPaymentCategory() {
        if (this.type === 'main') {
            return SupplierType.MAIN;
        }else if(this.type === 'other'){
            return SupplierType.OTHER;
        }
        return TransactionType.TAXES;
    }

    onCommentChange(event, rowIndex) {
        this.rows[rowIndex].comment = event.target.value;
        if (this.rows[rowIndex].id === undefined) {
            this.submit(this.rows[rowIndex], rowIndex);
        } else {
            this.update(this.rows[rowIndex]);
        }
    }

    getPaymentType(row) {
        if(row.paymentType == PaymentType.CASH){
            return 'Μετρητοίς';
        }
        return PaymentType.BANK;
    }
}
