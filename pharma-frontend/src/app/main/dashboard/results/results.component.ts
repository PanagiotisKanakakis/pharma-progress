import {AfterContentInit, AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';

import {CoreConfigService} from '@core/services/config.service';
import {CoreTranslationService} from '@core/services/translation.service';

import {User} from 'app/auth/models';
import {locale as english} from 'app/common/i18n/en';
import {AuthenticationService} from 'app/auth/service';
import {DashboardService} from 'app/main/dashboard/dashboard.service';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {locale as greek} from 'app/common/i18n/gr';
import {
    getSalesStatisticsByCriteria,
    getTransactionsByCriteria,
    PaymentType,
    TransactionEntity,
    TransactionType,
    VAT
} from '../../../api/transaction';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import DateUtils from '../../../common/utils/date';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {plainToInstance} from 'class-transformer';
import {Router} from '@angular/router';
import {SupplierType} from '../../../api/transaction/enums/supplier-type.enum';
import {IncomeOutcomeAnalysisDto} from '../../../api/transaction/dto/income-outcome-analysis.dto';

@Component({
    selector: 'app-results',
    templateUrl: './results.component.html',
    styleUrls: ['./results.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ResultsComponent implements OnInit, AfterViewInit {

    @ViewChild('personalWitdrawalsRef') personalWitdrawalsRef: any;
    @ViewChild('eoppyAndConsumablesChartRef') eoppyAndConsumablesChartRef: any;

    public data: any;
    public currentUser: User;
    public isAdmin: boolean;
    public isLoaded: boolean;
    public isClient: boolean;
    public isMenuToggled = false;
    public basicDPdata: NgbDateStruct;
    public period: DatePeriod;
    public selectStatus: any = [
        {name: 'Όλα', value: ''},
        {name: 'Πληρωθέντα', value: 'Downloaded'},
        {name: 'Σε αναμονή', value: 'Draft'},
    ];
    public ColumnMode = ColumnMode;
    public selectedStatus = [];
    public personalWithdrawalsChartOptions: any;
    public orderChartoptions: any;
    public operatingExpensesOrderChartoptions: any;
    public eoppyAndConsumablesChartoptions: any;
    // Private
    private $warning = '#FF9F43';
    private $personalWithdrawalsWarning = '#FF9F43';
    private $operatingExpensesWarning = '#9042f5';
    private $eoppyAndConsumablesWarning = '#5af542';
    public operatingExpensesData: any;
    private incomeOutcomeAnalysisDto: IncomeOutcomeAnalysisDto;

    /**
     * Constructor
     * @param {AuthenticationService} _authenticationService
     * @param {DashboardService} _dashboardService
     * @param {CoreConfigService} _coreConfigService
     * @param {CoreTranslationService} _coreTranslationService
     * @param _router
     */
    constructor(
        private _authenticationService: AuthenticationService,
        private _dashboardService: DashboardService,
        private _coreConfigService: CoreConfigService,
        private _coreTranslationService: CoreTranslationService,
        private _router: Router,

    ) {
        this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
        this.isAdmin = this._authenticationService.isAdmin;
        this.isClient = this._authenticationService.isClient;
        this._coreTranslationService.translate(greek, english);
        this.orderChartoptions = {
            chart: {
                height: 100,
                type: 'area',
                toolbar: {
                    show: false
                },
                sparkline: {
                    enabled: true
                }
            },
            colors: [this.$warning],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2.5
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 0.9,
                    opacityFrom: 0.7,
                    opacityTo: 0.5,
                    stops: [0, 80, 100]
                }
            },
            series: [
                {
                    name: 'Orders',
                    data: [10, 15, 8, 15, 7, 12, 8]
                }
            ],
            tooltip: {
                x: {show: false}
            }
        };
        this.operatingExpensesOrderChartoptions = {
            chart: {
                height: 100,
                type: 'area',
                toolbar: {
                    show: false
                },
                sparkline: {
                    enabled: true
                }
            },
            colors: [this.$operatingExpensesWarning],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2.5
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 0.9,
                    opacityFrom: 0.7,
                    opacityTo: 0.5,
                    stops: [0, 80, 100]
                }
            },
            series: [
                {
                    name: 'Orders',
                    data: [10, 15, 8, 15, 7, 12, 8]
                }
            ],
            tooltip: {
                x: {show: false}
            }
        };
        this.personalWithdrawalsChartOptions = {
            chart: {
                height: 100,
                type: 'area',
                toolbar: {
                    show: false
                },
                sparkline: {
                    enabled: true
                }
            },
            colors: [this.$personalWithdrawalsWarning],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2.5
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 0.9,
                    opacityFrom: 0.7,
                    opacityTo: 0.5,
                    stops: [0, 80, 100]
                }
            },
            series: [
                {
                    name: 'Orders',
                    data: [10, 15, 8, 15, 7, 12, 8]
                }
            ],
            tooltip: {
                x: {show: false}
            }
        };
        this.eoppyAndConsumablesChartoptions = {
            chart: {
                height: 100,
                type: 'area',
                toolbar: {
                    show: false
                },
                sparkline: {
                    enabled: true
                }
            },
            colors: [this.$eoppyAndConsumablesWarning],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2.5
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 0.9,
                    opacityFrom: 0.7,
                    opacityTo: 0.5,
                    stops: [0, 80, 100]
                }
            },
            series: [
                {
                    name: 'Orders',
                    data: [10, 15, 8, 15, 7, 12, 8]
                }
            ],
            tooltip: {
                x: {show: false}
            }
        };
        this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
        this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
        this.getSalesStatistics();
        this.getOperatingExpenses();
    }
    /**
     * On init
     */
    ngOnInit(): void {
        // Get the dashboard service data
        this._dashboardService.onApiDataChanged.subscribe(response => {
            this.data = response;
        });
    }

    /**
     * After View Init
     */
    ngAfterViewInit() {
        // Subscribe to core config changes
        this._coreConfigService.getConfig().subscribe(config => {
            // If Menu Collapsed Changes
            if (
                (config.layout.menu.collapsed === true || config.layout.menu.collapsed === false) &&
                localStorage.getItem('currentUser')
            ) {
                setTimeout(() => {
                    // if (this.currentUser.role === 'Admin') {
                        // Get Dynamic Width for Charts
                        this.isMenuToggled = true;
                        this.personalWithdrawalsChartOptions.chart.width = this.personalWitdrawalsRef?.nativeElement.offsetWidth;
                        this.eoppyAndConsumablesChartoptions.chart.width = this.eoppyAndConsumablesChartRef?.nativeElement.offsetWidth;
                    // }
                }, 50);

            }
        });
    }

    getSalesStatistics() {
        getSalesStatisticsByCriteria(
            {
                'userId': this.currentUser.id.toString(),
                'dateFrom': this.period.dateFrom,
                'dateTo': this.period.dateTo,
            },
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.currentUser.token
            }
        ).then(response => {
            this.incomeOutcomeAnalysisDto = plainToInstance(IncomeOutcomeAnalysisDto, response);
            this.isLoaded = true;
            console.log(this.incomeOutcomeAnalysisDto);
        }).catch((_: any) => {
            localStorage.removeItem('currentUser');
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }

    getOperatingExpenses() {
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
            console.log(data);
            this.operatingExpensesData = [];
            if (data.length !== 0) {
                for (let i = 0; i < data.length; i++) {
                    const transaction = plainToInstance(TransactionEntity, data[i]);
                    this.operatingExpensesData = [...this.operatingExpensesData, {
                        id: transaction.id,
                        transactionType: transaction.transactionType,
                        supplierType: SupplierType.NONE,
                        cost: transaction.cost,
                        createdAt: DateUtils.formatDbDate(transaction.createdAt),
                        comment: transaction.comment,
                        vat: VAT.NONE,
                        paymentType: PaymentType.CASH,
                    }];
                    this.operatingExpensesData[i].transactionType = TransactionType.valueOf(transaction.transactionType);
                    this.operatingExpensesData[i].createdAt = DateUtils.formatDbDate(transaction.createdAt);
                }
            }
        }).catch((error: any) => {
            console.log(error);
            localStorage.removeItem('currentUser');
            this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
        });
    }

    onDateSelect(date: NgbDate) {
        this.period = DateUtils.NgbDateToMonthPeriod(date);
        this.getSalesStatistics();
        this.getOperatingExpenses();
    }

    /**
     * Filter By Roles
     *
     * @param event
     */
    filterByStatus(event) {
        const filter = event ? event.value : '';
    }

    totalSales() {
        return this.incomeOutcomeAnalysisDto.income.totalPos
            + this.incomeOutcomeAnalysisDto.income.totalCash
            + this.incomeOutcomeAnalysisDto.income.totalOnAccount
            + this.incomeOutcomeAnalysisDto.income.totalEOPPY
            - this.incomeOutcomeAnalysisDto.income.totalPreviousMonths;
    }

    totalSalesWithNoVat() {
        let totalZNoVat = 0;
        let totalZ = 0;
        Object.keys(this.incomeOutcomeAnalysisDto.income.incomePerVat).forEach(key => {
            const vat = +VAT.valueOf(+key) / 100;
            totalZNoVat += this.incomeOutcomeAnalysisDto.income.incomePerVat[key] / (1 + vat);
            totalZ += this.incomeOutcomeAnalysisDto.income.incomePerVat[key];
        });
        const extra = this.incomeOutcomeAnalysisDto.income.totalPos
            + this.incomeOutcomeAnalysisDto.income.totalCash
            - totalZ
            + this.incomeOutcomeAnalysisDto.income.totalOnAccount
            - this.incomeOutcomeAnalysisDto.income.totalPreviousMonths;
        return totalZNoVat
            + extra
            + this.incomeOutcomeAnalysisDto.income.totalEOPPY / 1.06;
    }

    totalExpenses() {
        let totalExpenses = 0;
        Object.keys(this.incomeOutcomeAnalysisDto.outcome.outcomePerVat).forEach(key => {
            totalExpenses += this.incomeOutcomeAnalysisDto.outcome.outcomePerVat[key];
        });
        return totalExpenses;
    }

    totalExpensesWithNoVat() {
        let totalExpensesNoVat = 0;
        Object.keys(this.incomeOutcomeAnalysisDto.outcome.outcomePerVat).forEach(key => {
            const vat = +VAT.valueOf(+key) / 100;
            totalExpensesNoVat += this.incomeOutcomeAnalysisDto.outcome.outcomePerVat[key] / (1 + vat);
        });
        return totalExpensesNoVat;
    }

    totalMainSupplierSales() {
        let total = 0;
        Object.keys(this.incomeOutcomeAnalysisDto.outcome.suppliers.mainSupplier).forEach(key => {
            total += this.incomeOutcomeAnalysisDto.outcome.suppliers.mainSupplier[key];
        });
        return total;
    }

    totalOtherSupplierSales() {
        let total = 0;
        Object.keys(this.incomeOutcomeAnalysisDto.outcome.suppliers.otherSuppliers).forEach(key => {
            total += this.incomeOutcomeAnalysisDto.outcome.suppliers.otherSuppliers[key];
        });
        return total;
    }

    personalWithdrawals() {
        return this.incomeOutcomeAnalysisDto.other[TransactionType.getIndexOf(TransactionType.PERSONAL_WITHDRAWALS)];
    }

    totalOperatingExpensesValue() {
        let value = 0;
        this.operatingExpensesData.forEach((row) => {
            value += Number(row.cost);
        });
        return value;
    }

    totalCash() {
        return this.incomeOutcomeAnalysisDto.income.totalCash;
    }

    totalPos() {
        return this.incomeOutcomeAnalysisDto.income.totalPos;
    }

    totalEOPPYIncludingVat() {
        return this.incomeOutcomeAnalysisDto.income.totalEOPPY;
    }

    totalIncomeOnAccount() {
        return this.incomeOutcomeAnalysisDto.income.totalOnAccount;
    }

    totalExchanges() {
        return this.incomeOutcomeAnalysisDto.outcome.exchange;
    }

    consumablesValue() {
        return 0;
    }

    totalEOPPYAndConsumablesWithoutVat() {
        return this.incomeOutcomeAnalysisDto.income.totalEOPPY / 1.06 + this.consumablesValue();
    }

    totalGrossProfitWithoutVat() {
        return this.totalSalesWithNoVat() - this.totalExpensesWithNoVat() - this.totalInventoryChange();
    }

    totalInventoryChange() {
        return 0;
    }

    totalCostOfSoldedItems() {
        return this.totalExpensesWithNoVat() - this.totalInventoryChange();
    }

    calculateMarkUp() {
        return this.totalCostOfSoldedItems() > 0 ? (this.totalGrossProfitWithoutVat() / this.totalCostOfSoldedItems())*100 : 0;
    }

    calculateGrossProfitMargin() {
        return this.totalSalesWithNoVat() > 0 ? (this.totalGrossProfitWithoutVat() / this.totalSalesWithNoVat())*100 : 0;
    }

    calculateNetProfitMargin() {
        return this.totalSalesWithNoVat() > 0 ? (this.totalNetProfitWithoutTaxes() / this.totalSalesWithNoVat()) * 100: 0;
    }

    totalNetProfitWithoutTaxes() {
        return this.totalGrossProfitWithoutVat() - this.totalOperatingExpensesValue() - this.calculateRebate();
    }

    calculateRebate() {
        return 0;
    }

    totalNetProfitWithTaxes() {
        return this.totalNetProfitWithoutTaxes() - this.totalTaxes();
    }

    totalTaxes() {
        return 0;
    }
}
