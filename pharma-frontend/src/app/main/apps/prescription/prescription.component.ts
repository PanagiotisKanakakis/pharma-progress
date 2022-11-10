import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {Subject} from 'rxjs';

import {CoreTranslationService} from '@core/services/translation.service';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {TransactionEntity} from 'app/api/transaction/transaction.entity';
import {locale as english} from 'app/common/i18n/en';
import {locale as greek} from 'app/common/i18n/gr';
import {ActivatedRoute, Router} from '@angular/router';
import {plainToInstance} from 'class-transformer';
import {User} from '../../../auth/models';
import DateUtils from '../../../common/utils/date';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {AuthenticationService} from '../../../auth/service';
import {FormControl, Validators} from '@angular/forms';
import {Greek} from 'flatpickr/dist/l10n/gr';
import {CheckEntity, getChecksByCriteria, submitChecks, updateChecks} from 'app/api/checks';

@Component({
    selector: 'prescript-datatable',
    templateUrl: './prescription.component.html',
    styleUrls: ['./prescription.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PrescriptionComponent implements OnInit {
    private _unsubscribeAll: Subject<any>;
    public rows = [];
    public editingValue = {};
    public editingDateValue = {};
    public basicDPdata: NgbDateStruct;
    public dates = [];
    public currentUser: User;
    public dateFormControl = [];
    public period: DatePeriod;
    public contentHeader: object;
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
                this.getChecksByUserId();
            },
        };
        this.getChecksByUserId();
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
                this.submitPrescription(this.rows[rowIndex], rowIndex);
            } else {
                this.updatePrescription(this.rows[rowIndex]);
            }
        }
    }

    private getChecksByUserId() {
        getChecksByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'date': this.period.dateFrom,
                'range': 'monthly',
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
                    this.addNewRow(plainToInstance(CheckEntity, data[i]));
                }
            }
        }).catch((_: any) => {
            this._authenticationService.logout();
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }

    initCheck() {
        this.addNewRow(undefined);
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

    removeRow(rowIndex: any) {
        const temp = [...this.rows];
        temp.splice(rowIndex, 1);
        this.rows = temp;
    }

    addNewRow(check: CheckEntity) {
        console.log(check)
        if(check === undefined){
            this.rows = [...this.rows, {
                id: undefined,
                cost: 0,
                purchasedAt: DateUtils.formatDate(new Date()),
                expiredAt: DateUtils.formatDate(new Date()),
                comment: '',
                company: '',
            }];
        }else{
            this.rows = [...this.rows, {
                id: check.id,
                cost: check.cost,
                purchasedAt: DateUtils.formatDbDate(check.purchasedAt),
                expiredAt: DateUtils.formatDbDate(check.expiredAt),
                comment: check.comment,
                company: check.company,
            }];
        }
    }

    submitPrescription(row, rowIndex) {
        if (this.dateFormControl[rowIndex].valid) {
            const check = new CheckEntity();
            check.userId = this.currentUser.id;
            check.purchasedAt = DateUtils.toDate(row.purchasedAt);
            check.expiredAt = DateUtils.toDate(row.expiredAt);
            check.cost = row.cost;
            check.comment = row.comment;
            check.company = row.company;
            console.log(check);
            submitChecks(
                {'checks': [check]},
                {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + this.currentUser.token
                }
            )
                .then(r => row.id = r[0].id)
                .catch((_: any) => {
                    this._authenticationService.logout();
                    this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
                });
        }

    }

    onChange(event, row) {
        row.comment = event.target.value;
    }

    private updatePrescription(row: any) {
        const check = new CheckEntity();
        check.id = row.id;
        check.userId = this.currentUser.id;
        check.purchasedAt = DateUtils.toDate(row.purchasedAt);
        check.expiredAt = DateUtils.toDate(row.expiredAt);
        check.cost = row.cost;
        check.comment = row.comment;
        check.company = row.company;
        updateChecks(
            {'checks': [check]},
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
}
