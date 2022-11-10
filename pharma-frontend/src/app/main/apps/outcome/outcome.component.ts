import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {Subject} from 'rxjs';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {CoreTranslationService} from '@core/services/translation.service';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {TransactionEntity} from 'app/api/transaction/transaction.entity';
import {OutcomeService} from './outcome.service';
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
import {plainToInstance} from 'class-transformer';
import {User} from '../../../auth/models';
import {ActivatedRoute, Router} from '@angular/router';
import {FileUploader} from 'ng2-file-upload';
import DateUtils from '../../../common/utils/date';
import {TransactionCell} from '../../../common/utils/interfaces/transaction-cell';
import {SupplierType} from '../../../api/transaction/enums/supplier-type.enum';
import {AuthenticationService} from '../../../auth/service';
import {FormControl, Validators} from '@angular/forms';
import {Greek} from 'flatpickr/dist/l10n/gr';

@Component({
    selector: 'outocome-datatable',
    templateUrl: './outcome.component.html',
    styleUrls: ['./outcome.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OutcomeComponent implements OnInit {

    private _unsubscribeAll: Subject<any>;
    public selected = [];
    public basicSelectedOption = 10;
    public ColumnMode = ColumnMode;
    public editingValue = {};
    public basicDPdata: NgbDateStruct;
    public dates = [];
    public days = [];
    public transactions: any = [];
    public transactionsToSubmit: TransactionEntity[] = [];
    public rows = [];
    public currentUser: User;
    public uploader: FileUploader = new FileUploader({
        url: 'https://your-url.com',
        isHTML5: true
    });
    public supplier = '';
    public payment = '';
    info: any;
    public cells: TransactionCell[][] = [];
    public numberFormControl: any[][] = [];
    DateRangeOptions: any;

    constructor(private _datatablesService: OutcomeService,
                private _coreTranslationService: CoreTranslationService,
                private _authenticationService: AuthenticationService,
                private _router: Router,
                private route: ActivatedRoute) {
        this._unsubscribeAll = new Subject();
        this._coreTranslationService.translate(english, greek);
        this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
    }

    inlineEditingUpdateValue(event, cell, rowIndex, transaction) {
        if (this.numberFormControl[rowIndex][cell].valid) {
            this.editingValue[rowIndex + '-' + cell] = false;
            this.cells[rowIndex][cell].cost = event.target.value;
            this.summaryFooterColumn(cell);
            if (this.cells[rowIndex][cell].id !== undefined) {
                this.updateTransaction(transaction, this.cells[rowIndex][cell]);
            } else {
                this.pushTransaction(transaction, this.cells[rowIndex][cell]);
            }
        }
    }

    summaryFooterColumn(j: number) {
        let value = 0;
        for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
            value += Number(this.cells[rowIndex][j].cost);
        }
        return value;
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.supplier = params.get('supplier');
            this.payment = params.get('payment');
            this.initCalendar(DateUtils.getMonday(new Date()));
            this.initTransactions();
            this.initTableRows();
            this.initNumberFormControl();
            this.initEmptyCells();
            this.initCellValues();
            // ng2-flatpickr options
            this.DateRangeOptions = {
                weekNumbers: true,
                locale: Greek,
                altInput: true,
                altInputClass: 'form-control flat-picker bg-transparent border-0 shadow-none flatpickr-input',
                defaultDate: new Date(),
                altFormat: 'j-n-Y',
                onClose: (selectedDates: any) => {
                    this.dates = DateUtils.initSpecificWeek(
                        new NgbDate(+selectedDates[0].getUTCFullYear(), +selectedDates[0].getUTCMonth()+1, +selectedDates[0].getUTCDate()));
                    this.initEmptyCells();
                    this.initCellValues();
                },
            };



        });
    }

    onDateSelect(date: NgbDate) {
        this.dates = DateUtils.initSpecificWeek(date);
        this.initEmptyCells();
        this.initCellValues();
    }

    initCalendar(date: Date) {
        this.dates = DateUtils.initWeek(date);
    }

    private initNumberFormControl() {
        for (let i = 0; i < this.rows.length; i++) {
            this.numberFormControl[i] = [];
            for (let j = 0; j < this.dates.length; j++) {
                this.numberFormControl[i][j] = new FormControl();
                this.numberFormControl[i][j] = new FormControl('',
                    [Validators.required, Validators.min(0)]);
                this.numberFormControl[i][j].setErrors(null);
            }
        }
    }

    initTableRows() {
        this.rows = [];
        this.transactions.forEach((transaction) => {
            if (transaction.paymentType === PaymentType.CASH) {
                this.rows.push({
                    name: transaction.transactionType + ' (' + transaction.vat + '%)',
                    totalOutcome: transaction.totalOutcome,
                    transactionType: transaction.transactionType,
                    paymentType: transaction.paymentType,
                    vat: transaction.vat,
                });
            }
        });
    }

    initCellValues() {
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'date': this.dates[0].queryFormattedDate.toString(),
                'range': 'weekly',
                'transactionType': [TransactionType.getIndexOf(TransactionType.EXPENSE)],
                'paymentType': [this.getPaymentType()],
                'supplierType': this.getSupplierType(),
            },
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then((data) =>{
            console.log(data)
            if (data.length !== 0) {
                this.rows.forEach((row, i) => {
                    this.dates.forEach((date, j) => {
                        const dbTransaction = this.searchData(row.paymentType, row.vat, date.queryFormattedDate, data);
                        if (dbTransaction !== undefined) {
                            this.cells[i][j].id = dbTransaction.id;
                            this.cells[i][j].date = date;
                            this.cells[i][j].cost = +dbTransaction.cost;
                        }
                    });
                });
                this.dates.forEach((date, cell) => {
                    this.summaryFooterColumn(cell);
                });
            } else {
                this.initEmptyCells();
            }
        }).catch((error: any) => {
            this._authenticationService.logout();
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }

    initTransactions() {
        this.transactions = [];
        this.transactions.push({
            transactionType: TransactionType.EXPENSE,
            vat: VAT.ZERO,
            paymentType: PaymentType.CASH,
            cost: 0,
            totalOutcome: true
        });
        this.transactions.push({
            transactionType: TransactionType.EXPENSE,
            vat: VAT.SIX,
            paymentType: PaymentType.CASH,
            cost: 0,
            totalOutcome: true
        });
        this.transactions.push({
            transactionType: TransactionType.EXPENSE,
            vat: VAT.THIRTEEN,
            paymentType: PaymentType.CASH,
            cost: 0,
            totalOutcome: true
        });
        this.transactions.push({
            transactionType: TransactionType.EXPENSE,
            vat: VAT.TWENTYFOUR,
            paymentType: PaymentType.CASH,
            cost: 0,
            totalOutcome: true
        });
    }

    initEmptyCells() {
        for (let i = 0; i < this.rows.length; i++) {
            this.cells[i] = [];
            for (let j = 0; j < this.dates.length; j++) {
                this.cells[i][j] = new TransactionCell();
            }
        }

        this.dates.forEach((date, indexColumn) => {
            this.rows.forEach((row, indexRow) => {
                this.cells[indexRow][indexColumn].cost = 0;
                this.cells[indexRow][indexColumn].id = undefined;
                this.cells[indexRow][indexColumn].date = date.queryFormattedDate;
            });
        });

    }

    searchData(paymentType: string, vat: string, date: string, data: any): TransactionEntity {
        for (let i = 0; i < data.length; i++) {
            const transaction = plainToInstance(TransactionEntity, data[i]);
            if (transaction.vat === VAT.getIndexOf(vat)
                && transaction.paymentType === this.getPaymentType()
                && transaction.createdAt.toString().split('T')[0] === date) {
                return transaction;
            }
        }
        return undefined;
    }

    pushTransaction(transaction, transactionCell) {
        const tr = new TransactionEntity();
        tr.userId = this.currentUser.id;
        tr.transactionType = TransactionType.getIndexOf(transaction.transactionType);
        tr.paymentType = this.getPaymentType();
        tr.vat = VAT.getIndexOf(transaction.vat);
        tr.createdAt = transactionCell.date;
        tr.cost = transactionCell.cost;
        tr.supplierType = this.getSupplierType();
        tr.comment = '';
        console.log(tr);
        submitTransaction(
            tr,
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then(r => {
            transactionCell.id = r[0].id;
        }).catch((error: any) => {
            // if (error.response.status === 401) {
            this._authenticationService.logout();
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            // }
        });
    }

    updateTransaction(transaction, transactionCell) {
        const tr = new TransactionEntity();
        tr.id = transactionCell.id;
        tr.userId = this.currentUser.id;
        tr.transactionType = TransactionType.getIndexOf(transaction.transactionType);
        tr.paymentType = this.getPaymentType();
        tr.vat = VAT.getIndexOf(transaction.vat);
        tr.createdAt = transactionCell.date;
        tr.cost = transactionCell.cost;
        tr.supplierType = this.getSupplierType();
        tr.comment = '';
        updateTransaction(
            tr,
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then();
    }

    getSupplierType() {
        let supplierType = SupplierType.getIndexOf(SupplierType.OTHER);
        if (this.supplier === 'main') {
            supplierType = SupplierType.getIndexOf(SupplierType.MAIN);
        }
        return supplierType;
    }

    private getPaymentType() {
        let paymentType = PaymentType.getIndexOf(PaymentType.CASH);
        if (this.payment === 'onAccount') {
            paymentType = PaymentType.getIndexOf(PaymentType.ON_ACCOUNT);
        }
        return paymentType;
    }
}
