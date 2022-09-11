import {Component, OnInit, ViewEncapsulation} from '@angular/core';
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
import {User} from '../../../auth/models';
import {plainToInstance} from 'class-transformer';
import DateUtils from '../../../common/utils/date';
import {ActivatedRoute, Router} from '@angular/router';
import {TransactionCell} from '../../../common/utils/interfaces/transaction-cell';
import {SupplierType} from '../../../api/transaction/enums/supplier-type.enum';
import {AuthenticationService} from '../../../auth/service';
import {FormControl, Validators} from '@angular/forms';

@Component({
    selector: 'income-datatable',
    templateUrl: './income.component.html',
    styleUrls: ['./income.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class IncomeComponent implements OnInit {
    first_info = 'Στον πινακα συμπληρωνονται τα τιμολογια πωλησης ανα καταγηρια ΦΠΑ. Το Συνολο Ζ υπολογιζεται\n' +
        '                        αυτοματα\n' +
        '                        και προστιθεται στο συνολο εισπραξεων του επομενου πινακα. Πατωντας το κουμπι \'Ολοκληρωση\n' +
        '                        καταχωρησης\'\n' +
        '                        τα στοιχεια αποστελλονται προς καταχωρηση στο συστημα.';

    public rows = [];
    public firstTableRows = [];
    public secondTableRows = [];
    public selected = [];
    public basicSelectedOption = 10;
    public ColumnMode = ColumnMode;
    public editingValue = {};
    public exportCSVData;
    public basicDPdata: NgbDateStruct;
    public dates = [];
    public days = [];
    public transactions: any = [];
    public cells: TransactionCell[][] = [];
    public currentUser: User;
    public type = '';
    public numberFormControl: any[][] = [];

    constructor(private _coreTranslationService: CoreTranslationService,
                private _authenticationService: AuthenticationService,
                private _router: Router,
                private route: ActivatedRoute) {
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

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.type = params.get('type');
            this.initCalendar(DateUtils.getMonday(new Date()));
            this.initTransactions();
            this.initTableRows();
            this.initNumberFormControl();
            this.initEmptyCells();
            this.initCellValues();
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

    initTableRows() {
        this.rows = [];
        this.transactions.forEach((transaction) => {
            let rowName: string;
            if (transaction.paymentType !== PaymentType.NONE && transaction.vat === VAT.NONE) {
                rowName = transaction.paymentType;
                this.rows.push({
                    // type: 'header',
                    transactionType: transaction.transactionType,
                    paymentType: transaction.paymentType,
                    vat: transaction.vat,
                    name: rowName,
                    totalZ: transaction.totalZ,
                    totalIncome: transaction.totalIncome
                });
            } else {
                rowName = transaction.transactionType + ' (' + transaction.vat + '%)';
                this.rows.push({
                    // type: 'header',
                    transactionType: transaction.transactionType,
                    paymentType: transaction.paymentType,
                    vat: transaction.vat,
                    name: rowName,
                    totalZ: transaction.totalZ,
                    totalIncome: transaction.totalIncome
                });

            }
        });
        // if (this.type === 'z') {
        //     this.rows.push({
        //         type: 'footer',
        //         name: 'Σύνολο Ζ',
        //         cost: 0
        //     });
        // } else {
        //     this.rows.push({
        //         type: 'footer',
        //         name: 'Σύνολο εισπράξεων',
        //         cost: 0
        //     });
        // }
    }

    initCellValues() {
        let paymentType = [PaymentType.getIndexOf(PaymentType.NONE)];
        if (this.type === 'real') {
            paymentType = [PaymentType.getIndexOf(PaymentType.ON_ACCOUNT),
                PaymentType.getIndexOf(PaymentType.PREVIOUS_MONTHS_RECEIPTS),
                PaymentType.getIndexOf(PaymentType.POS),
                PaymentType.getIndexOf(PaymentType.CASH)];
        }
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'dateFrom': this.dates[0].queryFormattedDate.toString(),
                'dateTo': this.dates[6].queryFormattedDate,
                'transactionType': [TransactionType.getIndexOf(TransactionType.INCOME)],
                'paymentType': paymentType
            },
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then((data) => {
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
        }).catch((_: any) => {
            localStorage.removeItem('currentUser');
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
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

    private initNumberFormControl() {
        for (let i = 0; i < this.rows.length; i++) {
            this.numberFormControl[i] = [];
            for (let j = 0; j < this.dates.length; j++) {
                this.numberFormControl[i][j] = new FormControl('',
                    [Validators.required, Validators.min(0)]);
                this.numberFormControl[i][j].setErrors(null);
            }
        }
    }

    initTransactions() {
        this.transactions = [];
        if (this.type === 'z') {
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.ZERO,
                paymentType: PaymentType.NONE,
                cost: 0,
                totalZ: true,
                totalIncome: true
            });
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.SIX,
                paymentType: PaymentType.NONE,
                cost: 0,
                totalZ: true,
                totalIncome: true
            });
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.THIRTEEN,
                paymentType: PaymentType.NONE,
                cost: 0,
                totalZ: true,
                totalIncome: true
            });
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.TWENTYFOUR,
                paymentType: PaymentType.NONE,
                cost: 0,
                totalZ: true,
                totalIncome: true
            });
        } else {
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.NONE,
                paymentType: PaymentType.ON_ACCOUNT,
                cost: 0,
                totalZ: false,
                totalIncome: true
            });
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.NONE,
                paymentType: PaymentType.PREVIOUS_MONTHS_RECEIPTS,
                cost: 0,
                totalZ: false,
                totalIncome: true
            });
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.NONE,
                paymentType: PaymentType.POS,
                cost: 0,
                totalZ: false,
                totalIncome: false
            });
            this.transactions.push({
                transactionType: TransactionType.INCOME,
                vat: VAT.NONE,
                paymentType: PaymentType.CASH,
                cost: 0,
                totalZ: false,
                totalIncome: false
            });
        }
    }

    searchData(paymentType: string, vat: string, date: string, data: any): TransactionEntity {
        for (let i = 0; i < data.length; i++) {
            const transaction = plainToInstance(TransactionEntity, data[i]);
            if (transaction.vat === VAT.getIndexOf(vat)
                && transaction.paymentType === PaymentType.getIndexOf(paymentType)
                && transaction.createdAt.toString().split('T')[0] === date) {
                return transaction;
            }
        }
        return undefined;
    }

    summaryColumn() {
        let value = 0;
        this.rows.forEach((row) => {
            value += Number(row.cost);
        });
        return value;
    }

    summaryFooterColumn(j: number) {
        let value = 0;
        for (let rowIndex = 0; rowIndex < this.rows.length; rowIndex++) {
            value += Number(this.cells[rowIndex][j].cost);
        }
        return value;
    }

    pushTransaction(transaction, transactionCell) {
        const tr = new TransactionEntity();
        tr.userId = this.currentUser.id;
        tr.transactionType = TransactionType.getIndexOf(transaction.transactionType);
        tr.paymentType = PaymentType.getIndexOf(transaction.paymentType);
        tr.vat = VAT.getIndexOf(transaction.vat);
        tr.createdAt = transactionCell.date;
        tr.cost = transactionCell.cost;
        tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
        tr.comment = '';
        submitTransactions(
            {'transactions': [tr]},
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then(r => {
            transactionCell.id = r[0].id;
        }).catch((error: any) => {
            // if (error.response.status === 401) {
            localStorage.removeItem('currentUser');
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            // }
        });
    }

    updateTransaction(transaction, transactionCell) {
        const tr = new TransactionEntity();
        tr.id = transactionCell.id;
        tr.userId = this.currentUser.id;
        tr.transactionType = TransactionType.getIndexOf(transaction.transactionType);
        tr.paymentType = PaymentType.getIndexOf(transaction.paymentType);
        tr.vat = VAT.getIndexOf(transaction.vat);
        tr.createdAt = transactionCell.date;
        tr.cost = transactionCell.cost;
        tr.supplierType = SupplierType.getIndexOf(SupplierType.NONE);
        tr.comment = '';
        updateTransactions(
            {'transactions': [tr]},
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then();
    }

    getName(name) {
        return this._coreTranslationService.translate(name);
    }
}
