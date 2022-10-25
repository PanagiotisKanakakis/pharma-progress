import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';

import {CoreConfigService} from '@core/services/config.service';
import {CoreTranslationService} from '@core/services/translation.service';

import {User} from 'app/auth/models';
import {locale as english} from 'app/common/i18n/en';
import {AuthenticationService} from 'app/auth/service';
import {DashboardService} from 'app/main/dashboard/dashboard.service';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {locale as greek} from 'app/common/i18n/gr';
import {StatisticsDto, TransactionType} from '../../../api/transaction';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import DateUtils from '../../../common/utils/date';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {plainToInstance} from 'class-transformer';
import {Router} from '@angular/router';
import {Greek} from 'flatpickr/dist/l10n/gr';

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
    private statistics: StatisticsDto;
    DateRangeOptions: any;
    operatingExpensesData = [];


    /**
     * Constructor
     * @param {AuthenticationService} _authenticationService
     * @param dashboardService
     * @param {CoreConfigService} _coreConfigService
     * @param {CoreTranslationService} _coreTranslationService
     * @param _router
     */
    constructor(
        private _authenticationService: AuthenticationService,
        private dashboardService: DashboardService,
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
        this.updateApiData();
        // ng2-flatpickr options
        this.DateRangeOptions = {
            locale: Greek,
            altInput: true,
            altInputClass: 'form-control flat-picker bg-transparent border-0 shadow-none flatpickr-input',
            defaultDate: new Date(),
            shorthand: true,
            dateFormat: 'm.y',
            altFormat: 'F Y',
            onClose: (selectedDates: any) => {
                const [month, day, year] = selectedDates[0].toLocaleDateString().split('/');
                this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(+year, +month, +day));
                this.updateApiData();
            },
        };

    }

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the dashboard service data
        this.dashboardService.onApiDataChanged.subscribe(response => {
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

    totalSales() {
        return this.dashboardService.totalSales(this.statistics, this.period.dateFrom);
    }

    totalSalesWithNoVat() {
        return this.dashboardService.totalSalesWithNoVat(this.statistics, this.period.dateFrom);
    }

    totalExpenses(): number {
        return this.dashboardService.totalExpenses(this.statistics, this.period.dateFrom);
    }

    totalExpensesWithNoVat() {
        return this.dashboardService.totalExpensesWithNoVat(this.statistics, this.period.dateFrom);
    }

    totalMainSupplierOutcome() {
        return this.dashboardService.totalMainSupplierOutcome(this.statistics, this.period.dateFrom);
    }

    totalOtherSupplierOutcome() {
        return this.dashboardService.totalOtherSupplierOutcome(this.statistics, this.period.dateFrom);
    }

    totalOtherSupplierOutcomeCash() {
        return this.dashboardService.totalOtherSupplierOutcomeCash(this.statistics, this.period.dateFrom);
    }

    totalPersonalWithdrawals() {
        return this.dashboardService.totalPersonalWithdrawals(this.statistics, this.period.dateFrom);
    }

    totalOperatingExpensesValue() {
        return this.dashboardService.totalOperatingExpensesValue(this.statistics, this.period.dateFrom);
    }

    totalCash() {
        return this.dashboardService.totalCash(this.statistics, this.period.dateFrom);
    }

    totalPos() {
        return this.dashboardService.totalPos(this.statistics, this.period.dateFrom);
    }

    totalEOPPYOnAccountIncludingVat() {
        return this.dashboardService.totalEOPPYOnAccountIncludingVat(this.statistics, this.period.dateFrom);
    }

    totalIncomeOnAccount() {
        return this.dashboardService.totalIncomeOnAccount(this.statistics, this.period.dateFrom);
    }

    totalExchanges() {
        return this.dashboardService.totalExchanges(this.statistics, this.period.dateFrom);
    }

    consumablesValue() {
        return this.dashboardService.consumablesValue(this.statistics, this.period.dateFrom);
    }

    totalEOPPYAndConsumablesOnAccountWithoutVat() {
        return this.dashboardService.totalEOPPYAndConsumablesOnAccountWithoutVat(this.statistics, this.period.dateFrom);
    }

    totalEOPPYIncomeIncludingVat() {
        return this.dashboardService.totalEOPPYAndConsumablesIncomeWithVat(this.statistics, this.period.dateFrom);
    }

    totalGrossProfitWithoutVat() {
        return this.dashboardService.totalGrossProfitWithoutVat(this.statistics, this.period.dateFrom);
    }

    totalInventoryChange() {
        return this.dashboardService.totalInventoryChange(this.statistics, this.period.dateFrom);
    }

    totalCostOfSoldedItems() {
        return this.dashboardService.totalCostOfSoldedItems(this.statistics, this.period.dateFrom);
    }

    calculateMarkUp() {
        return this.dashboardService.calculateMarkUp(this.statistics, this.period.dateFrom);
    }

    calculateGrossProfitMargin() {
        return this.dashboardService.calculateGrossProfitMargin(this.statistics, this.period.dateFrom);
    }

    calculateNetProfitMargin() {
        return this.dashboardService.calculateNetProfitMargin(this.statistics, this.period.dateFrom);
    }

    totalNetProfitWithoutTaxes() {
        return this.dashboardService.totalNetProfitWithoutTaxes(this.statistics, this.period.dateFrom);
    }

    calculateRebate() {
        return this.dashboardService.calculateRebate(this.statistics, this.period.dateFrom);
    }

    totalNetProfitWithTaxes() {
        return this.dashboardService.totalNetProfitWithTaxes(this.statistics, this.period.dateFrom);
    }

    totalTaxes() {
        return this.dashboardService.totalTaxes(this.statistics, this.period.dateFrom);
    }

    totalOperatingExpensesIncludingVat() {
        return this.dashboardService.totalOperatingExpensesIncludingVat(this.statistics, this.period.dateFrom);
    }

    totalPreviousMonthsPaymentsToOtherSuppliers() {
        return this.dashboardService.totalPreviousMonthsPaymentsToOtherSuppliers(this.statistics, this.period.dateFrom);
    }

    totalPreviousMonthsPaymentsToMainSupplier() {
        return this.dashboardService.totalPreviousMonthsPaymentsToMainSupplier(this.statistics, this.period.dateFrom);
    }

    totalMonthIncome() {
        return this.dashboardService.totalMonthIncome(this.statistics, this.period.dateFrom);
    }

    totalOpeningBalance() {
        return this.dashboardService.totalOpeningBalance(this.statistics, this.period.dateFrom);
    }

    totalCashAvailable() {
        return this.dashboardService.totalCashAvailable(this.statistics, this.period.dateFrom);
    }

    totalClosingBalance() {
        return this.dashboardService.totalClosingBalance(this.statistics, this.period.dateFrom);
    }

    private updateApiData() {
        this.dashboardService.getStatisticsData(String(this.currentUser.id), this.currentUser.token, this.period.dateFrom, 'monthly')
            .then(response => {
                const [year, month, day] = this.period.dateFrom.split('-');
                this.period.dateFrom = year + '-' + +month + '-' + day;
                this.statistics = plainToInstance(StatisticsDto, response);
                Object.keys(this.statistics[this.period.dateFrom].operatingExpenses).forEach((key) => {
                    const result = this.statistics[this.period.dateFrom].operatingExpenses[key].reduce((accumulator, transaction) => {
                        return accumulator + +transaction.cost;
                    }, 0);
                    this.operatingExpensesData.push({
                        transactionType: +key,
                        cost: result
                    })
                });
                this.isLoaded = true;
            })
            .catch((_: Error) => {
                this._authenticationService.logout();
                this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
            });
    }

    getNameOfOperatingExpense(transactionType: number) {
        return TransactionType.valueOf(transactionType);
    }

    parseDate(createdAt: any) {
        return DateUtils.formatDbDate(createdAt);
    }

    totalOutcome() {
        return this.totalMainSupplierOutcome() + this.totalOtherSupplierOutcome()
    }
}
