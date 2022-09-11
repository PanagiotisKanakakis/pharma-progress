import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {CoreTranslationService} from '../../../../../@core/services/translation.service';
import {AuthenticationService} from '../../../../auth/service';
import {ActivatedRoute, Router} from '@angular/router';
import {locale as english} from 'app/common/i18n/en';
import {locale as greek} from 'app/common/i18n/gr';
import {User} from '../../../../auth/models';
import DateUtils from '../../../../common/utils/date';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {DatePeriod} from '../../../../common/utils/interfaces/date-period.interface';
import {getTransactionsByCriteria, PaymentType, TransactionEntity, TransactionType} from '../../../../api/transaction';
import {SupplierType} from '../../../../api/transaction/enums/supplier-type.enum';
import {plainToInstance} from 'class-transformer';

// Interface
class Notification {
  messages: any = [{
    heading: String,
    text: String
  }];
  systemMessages: [];
  system: Boolean;
}

@Component({
  selector: 'app-navbar-notification',
  templateUrl: './navbar-notification.component.html',
  styleUrls: ['./navbar-notification.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NavbarNotificationComponent implements OnInit {

  public notifications: Notification;
  public currentUser: User;
  public period: DatePeriod;
  public basicDPdata: NgbDateStruct;
  isLoaded = false;


  /**
   *
   * @param _coreTranslationService
   * @param _authenticationService
   * @param _router
   * @param route
   */
  constructor(private _coreTranslationService: CoreTranslationService,
              private _authenticationService: AuthenticationService,
              private _router: Router,
              private route: ActivatedRoute) {
    this.notifications = new Notification();
    this._coreTranslationService.translate(english, greek);
    this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
    console.log(this.currentUser)
    setTimeout(() => {
      this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
      this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
      this.getTransactions();
    }, 50);
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {

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
          'dateFrom': this.period.dateFrom,
          'dateTo': this.period.dateTo,
          'transactionType': transactionType,
          'supplierType': SupplierType.getIndexOf(SupplierType.NONE),
          'paymentType': [PaymentType.getIndexOf(PaymentType.CASH)]
        },
        {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.currentUser.token
        }
    ).then((data) => {
      const paidOperatingExpenses = [];
      if (data.length !== 0) {
        for (let i = 0; i < data.length; i++) {
          const transaction = plainToInstance(TransactionEntity, data[i]);
          paidOperatingExpenses.push(transaction.transactionType);
        }
        const nonPaidOperatingExpenses = this.getDifference(transactionType,paidOperatingExpenses)
        this.notifications.messages = [];
        nonPaidOperatingExpenses.forEach((value) => {
          console.log(TransactionType.valueOf(value))
          this.notifications.messages.push({
            heading: '<span class="font-weight-bolder">Η ακόλουθη συναλλαγή δεν έχει καταχωρηθεί</span>',
            text: TransactionType.valueOf(value)
          })
        })
        this.isLoaded = true;
      }
    }).catch((error: any) => {
      console.log(error)
      localStorage.removeItem('currentUser');
      this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
    });
  }

  private getDifference<T>(a: T[], b: T[]): T[] {
    return a.filter((element) => {
      return !b.includes(element);
    });
  }

}
