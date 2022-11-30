import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';

import {CoreConfigService} from '@core/services/config.service';
import {CoreTranslationService} from '@core/services/translation.service';

import {User} from 'app/auth/models';
import {locale as english} from 'app/common/i18n/en';
import {AuthenticationService} from 'app/auth/service';
import {DashboardService} from 'app/main/dashboard/dashboard.service';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {locale as greek} from 'app/common/i18n/gr';
import {StatisticsDto, TransactionType, VAT} from '../../../api/transaction';
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
    @ViewChild('operatingExpensesOrderChartRef') operatingExpensesOrderChartRef: any;
    @ViewChild('averageExtraRef') averageExtraRef: any;

    public data: any;
    public currentUser: User;
    public isAdmin: boolean;
    public isLoaded: boolean;
    public isClient: boolean;
    public isMenuToggled = false;
    public basicDPdata: NgbDateStruct;
    public period: DatePeriod;
    public ColumnMode = ColumnMode;
    public selectedStatus = [];
    public personalWithdrawalsChartOptions: any;
    public orderChartoptions: any;
    public operatingExpensesOrderChartOptions: any;
    public averageExtraOptions: any;
    public eoppyAndConsumablesChartoptions: any;
    // Private
    private $warning = '#FF9F43';
    private $personalWithdrawalsWarning = '#FF9F43';
    private $operatingExpensesWarning = '#9042f5';
    private $eoppyAndConsumablesWarning = '#5af542';
    private statistics: StatisticsDto;
    DateRangeOptions: any;
    operatingExpensesData = [];
    currentYearWeeklyIncome = [];
    lastYearWeeklyIncome = [];


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
        this.operatingExpensesOrderChartOptions = {
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
        this.averageExtraOptions = {
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
        this.getData();
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
                this.period = DateUtils.NgbDateToMonthPeriod(
                    new NgbDate(+selectedDates[0].getUTCFullYear(), +selectedDates[0].getUTCMonth() + 1, +selectedDates[0].getUTCDate()));
                this.getData();
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
                    this.operatingExpensesOrderChartOptions.chart.width = this.operatingExpensesOrderChartRef?.nativeElement.offsetWidth;
                    this.averageExtraOptions.chart.width = this.averageExtraRef?.nativeElement.offsetWidth;
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

    totalMedicineAndConsumablesOnAccountWithVat() {
        return this.dashboardService.totalMedicineAndConsumablesOnAccountWithVat(this.statistics, this.period.dateFrom);
    }

    totalIncomeOnAccount() {
        return this.dashboardService.totalIncomeOnAccount(this.statistics, this.period.dateFrom);
    }

    totalExchanges() {
        return this.dashboardService.totalExchanges(this.statistics, this.period.dateFrom);
    }

    consumablesValue() {
        return this.dashboardService.consumablesValueIncome(this.statistics, this.period.dateFrom);
    }

    consumablesOnAccountWithoutVat() {
        return this.dashboardService.consumablesOnAccountWithoutVat(this.statistics, this.period.dateFrom);
    }

    consumablesOnAccountWithVat() {
        return this.dashboardService.consumablesOnAccountWithVat(this.statistics, this.period.dateFrom);
    }

    consumablesIncomeWithVat() {
        return this.dashboardService.consumablesIncomeWithVat(this.statistics, this.period.dateFrom);
    }

    consumablesIncomeWithoutVat() {
        return this.dashboardService.consumablesIncomeWithoutVat(this.statistics, this.period.dateFrom);
    }

    totalEOPPYAndConsumablesOnAccountWithoutVat() {
        return this.dashboardService.totalMedicineAndConsumablesOnAccountWithoutVat(this.statistics, this.period.dateFrom);
    }

    totalMedicineAndConsumablesIncomeWithVat() {
        return this.dashboardService.totalMedicineAndConsumablesIncomeWithVat(this.statistics, this.period.dateFrom);
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

    getData() {
        this.currentYearWeeklyIncome = [];
        this.lastYearWeeklyIncome = [];
        this.operatingExpensesData = [];
        this.dashboardService.getStatisticsData(String((this.currentUser.id)), this.currentUser.token, this.period.dateFrom, 'yearly')
            .then(response => {
                setTimeout(() => {
                    this.statistics = plainToInstance(StatisticsDto, response);
                    console.log(this.statistics);
                    Object.keys(this.statistics[this.period.dateFrom].operatingExpenses).forEach((key) => {
                        const result = this.statistics[this.period.dateFrom].operatingExpenses[key]
                            .reduce((accumulator, transaction) => {
                                return accumulator + +transaction.cost;
                            }, 0);
                        this.operatingExpensesData.push({
                            transactionType: +key,
                            cost: result
                        });
                    });
                    Object.keys(this.statistics[this.period.dateFrom].weeklyIncome).forEach((week) => {
                        this.currentYearWeeklyIncome.push(this.statistics[this.period.dateFrom].weeklyIncome[week]);
                    });
                    Object.keys(this.statistics[this.locateLastYear()].weeklyIncome).forEach((week) => {
                        this.lastYearWeeklyIncome.push(this.statistics[this.locateLastYear()].weeklyIncome[week]);
                    });
                    this.isLoaded = true;
                }, 500);

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
        return this.totalMainSupplierOutcome() + this.totalOtherSupplierOutcome();
    }

    avgPersonalWithdrawals() {
        let pw = [];
        for (let date in this.statistics) {
            pw.push(this.dashboardService.totalPersonalWithdrawals(this.statistics, date));
        }
        let monthNumber = this.period.dateFrom.split('-')[1];
        let value = 0;
        for (let i = 0; i < +monthNumber; i++) {
            value += pw[i];
        }
        return value / (+monthNumber - 1);

    }

    totalExtraDividedToTotalIncome() {
        if (this.dashboardService.totalMonthIncome(this.statistics, this.period.dateFrom) == 0) {
            return 0;
        }
        return this.dashboardService.totalExtra(this.statistics, this.period.dateFrom) / this.dashboardService.totalMonthIncome(this.statistics, this.period.dateFrom);
    }

    avgExtra() {
        let extras = [];
        for (let date in this.statistics) {
            if (this.dashboardService.totalMonthIncome(this.statistics, this.period.dateFrom) == 0) {
                extras.push(0);
            }
            extras.push(this.dashboardService.totalExtra(this.statistics, this.period.dateFrom) / this.dashboardService.totalMonthIncome(this.statistics, this.period.dateFrom));
        }
        let monthNumber = this.period.dateFrom.split('-')[1];
        let value = 0;
        for (let i = 0; i < +monthNumber; i++) {
            value += extras[i];
        }
        return (+value / (+monthNumber - 1)) * 100;

    }

    private locateLastYear() {
        let year = this.period.dateFrom.split('-')[0];
        let month = this.period.dateFrom.split('-')[1];
        let day = this.period.dateFrom.split('-')[2];
        return +year - 1 + '-' + month + '-' + day;
    }

    totalIncomePerVat(i: number) {
        return this.dashboardService.totalIncomePerVat(this.statistics, this.period.dateFrom)[VAT.getIndexOf(String(i))] / (1 + i/100)
    }

    totalOutcomePerVat(i: number) {
        return this.dashboardService.totalOutcomePerVat(this.statistics, this.period.dateFrom)[VAT.getIndexOf(String(i))] / (1 + i/100);
    }

    totalVAT() {
        return(this.totalIncomePerVat(6)/1.06 - this.totalOutcomePerVat(6)/1.06) * 0.06 +
            (this.totalIncomePerVat(13)/1.13 - this.totalOutcomePerVat(13)/1.13) * 0.13 +
            (this.totalIncomePerVat(24)/1.24 - this.totalOutcomePerVat(24)/1.24) * 0.24;
    }

    getToday() {
        return new Date().getUTCDate();
    }

    threeMonthPeriodVat() {
        return this.dashboardService.threeMonthPeriodVat(this.statistics, this.period.dateFrom);
    }

    getTableData() {
        let data: any[][] = [];
        let currentYear = this.period.dateFrom;
        let lastYear = (+this.period.dateFrom.split('-')[0] - 1) + '-' + this.period.dateFrom.split('-')[1] + '-01';

        let totalMedicineAndConsumablesOnAccountVatCurrentYear = this.dashboardService.totalMedicineAndConsumablesOnAccountWithVat(this.statistics, currentYear);
        let totalMedicineAndConsumablesOnAccountWithVatLastYear = this.dashboardService.totalMedicineAndConsumablesOnAccountWithVat(this.statistics, lastYear);
        let change = 0;
        if (totalMedicineAndConsumablesOnAccountWithVatLastYear > 0) {
            change = (totalMedicineAndConsumablesOnAccountVatCurrentYear - totalMedicineAndConsumablesOnAccountWithVatLastYear) /
                totalMedicineAndConsumablesOnAccountWithVatLastYear;
        }

        data[0] = [
            totalMedicineAndConsumablesOnAccountVatCurrentYear,
            totalMedicineAndConsumablesOnAccountWithVatLastYear,
            change
        ];

        let totalPrescriptionsCurrentYear = this.dashboardService.totalMonthPrescriptions(this.statistics, currentYear);
        let totalPrescriptionsLastYear = this.dashboardService.totalMonthPrescriptions(this.statistics, lastYear);
        change = 0;
        if (totalPrescriptionsLastYear > 0) {
            change = (totalPrescriptionsCurrentYear - totalPrescriptionsLastYear) /
                totalPrescriptionsLastYear;
        }
        data[1] = [
            totalPrescriptionsCurrentYear,
            totalPrescriptionsLastYear,
            change
        ];

        let prescriptionValueCurrentYear = data[1][0] > 0 ? data[0][0] / data[1][0]: 0;
        let prescriptionValueLastYear = data[1][1] > 0 ? data[0][1] / data[1][1]: 0;
        change = prescriptionValueLastYear > 0 ? prescriptionValueCurrentYear / prescriptionValueLastYear: 0;
        data[2] = [
            prescriptionValueCurrentYear,
            prescriptionValueLastYear,
            change
        ];

        let totalMonthIncomeCurrentYear = this.dashboardService.totalMonthIncome(this.statistics, currentYear);
        let totalMonthIncomeLastYear = this.dashboardService.totalMonthIncome(this.statistics, lastYear);
        change = 0;
        if (totalMonthIncomeLastYear > 0) {
            change = (totalMonthIncomeCurrentYear - totalMonthIncomeLastYear) /
                totalMonthIncomeLastYear;
        }

        data[3] = [
            totalMonthIncomeCurrentYear,
            totalMonthIncomeLastYear,
            change
        ];
        return data;
    }
}
