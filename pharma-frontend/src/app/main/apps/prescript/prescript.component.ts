import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {Subject} from 'rxjs';
import {ColumnMode} from '@swimlane/ngx-datatable';

import {CoreTranslationService} from '@core/services/translation.service';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {TransactionEntity} from 'app/api/transaction/transaction.entity';
import {locale as english} from 'app/common/i18n/en';
import {locale as greek} from 'app/common/i18n/gr';
import {getTransactionsByCriteria, PaymentType, submitTransactions, TransactionType, VAT} from '../../../api/transaction';
import {ActivatedRoute, Router} from '@angular/router';
import {plainToInstance} from 'class-transformer';
import {User} from '../../../auth/models';
import DateUtils from '../../../common/utils/date';

@Component({
    selector: 'prescript-datatable',
    templateUrl: './prescript.component.html',
    styleUrls: ['./prescript.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PrescriptComponent implements OnInit {
    private _unsubscribeAll: Subject<any>;
    public rows = [];
    public ColumnMode = ColumnMode;
    public editingValue = {};
    public basicDPdata: NgbDateStruct;
    public transactions: any = [];
    public transactionsToSubmit: TransactionEntity[] = [];
    public cells = [];
    public currentUser: User;
    private type = '';

    constructor(private _coreTranslationService: CoreTranslationService,
                private _router: Router,
                private route: ActivatedRoute) {
        this._unsubscribeAll = new Subject();
        this._coreTranslationService.translate(english, greek);
        this.currentUser = plainToInstance(User, JSON.parse(localStorage.getItem('currentUser')));
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.type = params.get('type');
            console.log(this.type);
            this.rows = [];
            this.initTransactions();
        });
    }

    initTransactions() {
        this.addNewRow(0, '');
    }

    inlineEditingUpdateValue(event, rowIndex) {
        this.editingValue[rowIndex] = false;
        this.rows[rowIndex].cost = event.target.value;
    }

    onDateSelect(date: NgbDate) {
        let paymentType = PaymentType.CASH;
        if (this.type !== 'income') {
            paymentType = PaymentType.ON_ACCOUNT;
        }
        getTransactionsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'dateFrom': DateUtils.NgbDateToDate(date),
                'transactionType': [TransactionType.getIndexOf(TransactionType.PAYMENT)],
                'paymentType': [PaymentType.getIndexOf(paymentType)]
            },
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then((data) => {
            console.log(data);
            if (data.length !== 0) {
                for (let i = 0; i < data.length; i++) {
                    const transaction = plainToInstance(TransactionEntity, data[i]);
                    this.addNewRow(transaction.cost, DateUtils.formatDbDate(transaction.createdAt));
                }
                this.summaryColumn();
            } else {
                this.initTransactions();
            }
        }).catch((error: any) => {
            if (error.response.status === 401) {
                localStorage.removeItem('currentUser');
                this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            }
        });
    }

    addNewRow(cost: number, date: string) {
        this.rows = [...this.rows, {
            transactionType: TransactionType.EOPPY,
            vat: VAT.NONE,
            paymentType: PaymentType.CASH,
            cost: cost,
            createdAt: date,
        }];
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

    parseDate(event, rowIndex: any, type: any) {
        if (type === 'start') {
            // TODO fix date format
            this.rows[rowIndex].createdAt = event.target.value;
        } else {

        }
    }

    submitTransactions() {
        this.transactionsToSubmit = [];
        this.rows.forEach((row, i) => {
            const tr = new TransactionEntity();
            tr.id = this.currentUser.id;
            tr.transactionType = TransactionType.getIndexOf(row.transactionType);
            tr.paymentType = PaymentType.getIndexOf(row.paymentType);
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
}
