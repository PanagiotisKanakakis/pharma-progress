import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {Subject} from 'rxjs';

import {CoreTranslationService} from '@core/services/translation.service';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
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
import {getPrescriptionsByCriteria, PrescriptionEntity, submitPrescription, updatePrescription} from '../../../api/prescrptions';

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
                this.getPrescriptionsByUserId();
            },
        };
        this.getPrescriptionsByUserId();
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
            this.rows[rowIndex].amount = event.target.value;
            if (this.rows[rowIndex].id === undefined) {
                this.submit(this.rows[rowIndex], rowIndex);
            } else {
                this.update(this.rows[rowIndex]);
            }
        }
    }

    private getPrescriptionsByUserId() {
        getPrescriptionsByCriteria(
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
                    this.addNewRow(plainToInstance(PrescriptionEntity, data[i]));
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
            if (this.rows[rowIndex].id === undefined) {
                this.submit(this.rows[rowIndex], rowIndex);
            } else {
                this.update(this.rows[rowIndex]);
            }
        } else {
            this.dateFormControl[rowIndex].setErrors({'range': true});
        }
    }

    removeRow(rowIndex: any) {
        const temp = [...this.rows];
        temp.splice(rowIndex, 1);
        this.rows = temp;
    }

    addNewRow(prescription: PrescriptionEntity) {
        this.numberFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.min(0)]);
        this.dateFormControl[this.rows.length] = new FormControl('',
            [Validators.required, Validators.pattern(this.regexPattern)]);
        this.dateFormControl[this.rows.length].setErrors(null);
        this.numberFormControl[this.rows.length].setErrors(null);

        if(prescription === undefined){
            this.rows = [...this.rows, {
                id: undefined,
                amount: 0,
                createdAt: DateUtils.formatDate(new Date()),
                comment: '',
            }];
        }else{
            this.rows = [...this.rows, {
                id: prescription.id,
                amount: prescription.amount,
                createdAt: DateUtils.formatDbDate(prescription.createdAt),
                comment: prescription.comment,
            }];
        }
    }

    submit(row, rowIndex) {
        if (this.dateFormControl[rowIndex].valid) {
            const prescription = new PrescriptionEntity();
            prescription.userId = this.currentUser.id.toString();
            prescription.amount = row.amount;
            prescription.comment = row.comment;
            prescription.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(this.rows[rowIndex].createdAt));
            submitPrescription(
                prescription,
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

    onCommentChange(event, rowIndex) {
        this.rows[rowIndex].comment = event.target.value;
        if (this.rows[rowIndex].id === undefined) {
            this.submit(this.rows[rowIndex], rowIndex);
        } else {
            this.update(this.rows[rowIndex]);
        }
    }

    private update(row: any) {
        const prescription = new PrescriptionEntity();
        prescription.id = row.id;
        prescription.userId = this.currentUser.id.toString();
        prescription.amount = row.amount;
        prescription.comment = row.comment;
        prescription.createdAt = DateUtils.queryFormattedDate(DateUtils.toDate(row.createdAt));
        updatePrescription(
            prescription,
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
