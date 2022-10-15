import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {CoreConfigService} from '@core/services/config.service';
import {CoreTranslationService} from '@core/services/translation.service';

import {User} from 'app/auth/models';
import {colors} from 'app/colors.const';
import {AuthenticationService} from 'app/auth/service';
import {DashboardService} from 'app/main/dashboard/dashboard.service';

import {locale as greek} from 'app/main/dashboard/i18n/gr';
import {NgbDate, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import DateUtils from '../../../common/utils/date';
import {DatePeriod} from '../../../common/utils/interfaces/date-period.interface';
import {plainToInstance} from 'class-transformer';
import {Router} from '@angular/router';
import {Greek} from 'flatpickr/dist/l10n/gr';
import {StatisticsDto, TransactionType} from '../../../api/transaction';

@Component({
    selector: 'app-chart',
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ChartComponent implements OnInit {

    // Public
    public data: any;
    public currentUser: User;
    public isAdmin: boolean;
    public isClient: boolean;
    public isMenuToggled = false;
    public basicDPdata: NgbDateStruct;
    public period: DatePeriod;
    DateRangeOptions: any;
    public labels = [];
    statistics: StatisticsDto;
    // Color Variables
    private tooltipShadow = 'rgba(0, 0, 0, 0.25)';
    private labelColor = '#6e6b7b';
    private grid_line_color = 'rgba(200, 200, 200, 0.2)'; // RGBA color helps in dark layout
    tableLabels = [];
    operatingExpenses = [];

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
        public dashboardService: DashboardService,
        private _coreConfigService: CoreConfigService,
        private _coreTranslationService: CoreTranslationService,
        private _router: Router,
    ) {
        this._authenticationService.currentUser.subscribe(x => (this.currentUser = x));
        this.isAdmin = this._authenticationService.isAdmin;
        this.isClient = this._authenticationService.isClient;
        this._coreTranslationService.translate(greek);
        this.basicDPdata = DateUtils.getTodayAsNgbDateStruct();
        this.period = DateUtils.NgbDateToMonthPeriod(new NgbDate(this.basicDPdata.year, this.basicDPdata.month, this.basicDPdata.day));
        this.tableLabels = this.generateLabels(new Date(this.basicDPdata.year, this.basicDPdata.month - 1, this.basicDPdata.day));
        this.createOperatingExpensesList();
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
                this.getData();
            },
        };
    }


    //** To add spacing between legends and chart
    public plugins = [
        {
            beforeInit(chart) {
                chart.legend.afterFit = function () {
                    this.height += 20;
                };
            }
        }
    ];


    // line chart
    public lineChart = {
        chartType: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            backgroundColor: false,
            hover: {
                mode: 'label'
            },
            tooltips: {
                // Updated default tooltip UI
                shadowOffsetX: 1,
                shadowOffsetY: 1,
                shadowBlur: 8,
                shadowColor: this.tooltipShadow,
                backgroundColor: colors.solid.white,
                titleFontColor: colors.solid.black,
                bodyFontColor: colors.solid.black
            },
            scales: {
                xAxes: [
                    {
                        display: true,
                        scaleLabel: {
                            display: true
                        },
                        gridLines: {
                            display: true,
                            color: this.grid_line_color,
                            zeroLineColor: this.grid_line_color
                        },
                        ticks: {
                            fontColor: this.labelColor
                        }
                    }
                ],
                yAxes: [
                    {
                        display: true,
                        scaleLabel: {
                            display: true
                        },
                        ticks: {
                            // stepSize: 100,
                            min: 0,
                            // max: 400,
                            fontColor: this.labelColor
                        },
                        gridLines: {
                            display: true,
                            color: this.grid_line_color,
                            zeroLineColor: this.grid_line_color
                        }
                    }
                ]
            },
            layout: {
                padding: {
                    top: -15,
                    bottom: -25,
                    left: -15
                }
            },
            legend: {
                position: 'top',
                align: 'start',
                labels: {
                    usePointStyle: true,
                    padding: 25,
                    boxWidth: 9
                }
            }
        },
        labels: this.generateLabels(new Date()),
        datasets: [
            {
                data: this.getSales(),
                label: 'Πωλήσεις',
                borderColor: 'rgb(255, 99, 132)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(255, 99, 132)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(255, 99, 132)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            },
            {
                data: this.getOutcome(),
                label: 'Αγορές',
                borderColor: 'rgb(255, 205, 86)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(255, 205, 86)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(255, 205, 86)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            },
            {
                data: this.getEOPPY(),
                label: 'ΕΟΠΠΥ & Αναλώσιμα',
                borderColor: 'rgb(138,11,32)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(138,11,32)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(138,11,32)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            },
            {
                data: [80, 99, 82, 90, 133, 115, 74, 75, 130, 155, 125, 90, 140, 130, 180],
                label: 'Ρευστά διαθέσιμα',
                borderColor: 'rgb(54,235,96)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(54,235,96)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(54,235,96)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            }
        ]
    };

    public grossProfitLineChart = {
        datasets: [
            {
                data: this.getGrossProfitWithoutVat(),
                label: 'Μεικτά κέρδη',
                borderColor: 'rgb(255, 99, 132)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(255, 99, 132)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(255, 99, 132)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            },
            {
                data: this.getOperatingExpensesValue(),
                label: 'Λειτουργικά έξοδα',
                borderColor: 'rgb(255, 205, 86)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(255, 205, 86)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(255, 205, 86)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            },
            {
                data: this.getRebate(),
                label: 'Rebate',
                borderColor: 'rgb(138,11,32)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(138,11,32)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(138,11,32)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            },
            {
                data: this.getNetProfitWithTaxes(),
                label: 'Καθαρά κέρδη/ζημια προ φορων',
                borderColor: 'rgb(54,235,96)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(54,235,96)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(54,235,96)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            }
        ]
    };

    public markUpLineChart = {
        datasets: [
            {
                data: this.getMarkUp(),
                label: 'Mark Up',
                borderColor: 'rgb(138,11,32)',
                lineTension: 0.5,
                pointStyle: 'circle',
                backgroundColor: 'rgb(138,11,32)',
                fill: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 5,
                pointBorderColor: 'transparent',
                pointHoverBorderColor: colors.solid.white,
                pointHoverBackgroundColor: 'rgb(138,11,32)',
                pointShadowOffsetX: 1,
                pointShadowOffsetY: 1,
                pointShadowBlur: 5,
                pointShadowColor: this.tooltipShadow
            }
        ]
    };

    public polarAreaChart = {
        chartType: 'polarArea',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            responsiveAnimationDuration: 500,
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    padding: 45,
                    boxWidth: 40
                }
            },
            tooltips: {
                // Updated default tooltip UI
                shadowOffsetX: 1,
                shadowOffsetY: 1,
                shadowBlur: 8,
                shadowColor: this.tooltipShadow,
                backgroundColor: colors.solid.white,
                titleFontColor: colors.solid.black,
                bodyFontColor: colors.solid.black
            },
            scale: {
                scaleShowLine: true,
                scaleLineWidth: 1,
                ticks: {
                    display: true
                },
                reverse: false,
                gridLines: {
                    display: true
                }
            },
            animation: {
                animateRotate: false
            }
        },

        labels: this.operatingExpenses,
        datasets: [
            {
                label: 'Population (millions)',
                backgroundColor: [
                    'rgb(255, 99, 132)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)',
                    'rgb(201, 203, 207)',
                    'rgb(54, 162, 235)',
                    'rgb(54,235,96)',
                    'rgb(235,54,129)',
                    'rgba(150,136,53,0.41)',
                    'rgb(19,49,26)',
                    'rgb(85,179,245)',
                    'rgb(30,33,37)',
                ],
                data: this.totalSummaryPerOperatingExpense(),
                borderWidth: 0
            }
        ]
    };


    /**
     * On init
     */
    ngOnInit(): void {
        // get the currentUser details from localStorage
        this.currentUser = plainToInstance(User, JSON.parse(localStorage.getItem('currentUser')));
        this.getData();
    }

    getData() {
        this.dashboardService.getStatisticsData(String((this.currentUser.id)), this.currentUser.token, this.period.dateFrom, 'yearly')
            .then(response => {
                this.statistics = plainToInstance(StatisticsDto, response);
                console.log(this.statistics)
                const [year, month, day] = this.period.dateFrom.split('-');
                this.tableLabels = this.generateLabels(new Date(+year, +month - 1, +day));
                this.lineChart.labels = this.generateLabels(new Date(+year, +month - 1, +day));

                this.lineChart.datasets[0].data = this.getSales();
                this.lineChart.datasets[1].data = this.getOutcome();
                this.lineChart.datasets[2].data = this.getEOPPY();

                this.grossProfitLineChart.datasets[0].data = this.getGrossProfitWithoutVat();
                this.grossProfitLineChart.datasets[1].data = this.getOperatingExpensesValue();
                this.grossProfitLineChart.datasets[2].data = this.getRebate();
                this.grossProfitLineChart.datasets[3].data = this.getNetProfitWithTaxes();

                this.markUpLineChart.datasets[0].data = this.getMarkUp();

                this.polarAreaChart.datasets[0].data = this.totalSummaryPerOperatingExpense();
            })
            .catch((_: Error) => {
                localStorage.removeItem('currentUser');
                this._router.navigate(['/pages/authentication/login-v2'], {queryParams: {returnUrl: location.href}});
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
                    if (this.currentUser.role === 'Admin') {
                        // Get Dynamic Width for Charts
                        this.isMenuToggled = true;
                    }
                }, 500);
            }
        });
    }

    generateLabels(aDay) {
        let labels = [];
        for (let i = 0; i <= 12; i++) {
            labels.push(aDay.getMonth() + 1 + '/' + aDay.getFullYear());
            aDay.setMonth(aDay.getMonth() - 1);
        }
        return labels.reverse();
    }

    private getSales() {
        let sales = [];
        for (let date in this.statistics) {
            sales.push(this.dashboardService.totalSales(this.statistics, date));
        }
        return sales.reverse();
    }

    private getSalesWithoutVat() {
        let sales = [];
        for (let date in this.statistics) {
            sales.push(this.dashboardService.totalSalesWithNoVat(this.statistics, date));
        }
        return sales.reverse();
    }

    private getOutcome() {
        let outcome = [];
        for (let date in this.statistics) {
            outcome.push(this.dashboardService.totalExpenses(this.statistics, date));
        }
        return outcome.reverse();
    }

    private getEOPPY() {
        let eoppy = [];
        for (let date in this.statistics) {
            eoppy.push(this.dashboardService.totalEOPPYIncludingVat(this.statistics, date));
        }
        return eoppy.reverse();
    }

    private getTotalPersonalWithdrawals() {
        let pw = [];
        for (let date in this.statistics) {
            pw.push(this.dashboardService.totalPersonalWithdrawals(this.statistics, date));
        }
        return pw.reverse();
    }

    //convert from 10/2021 -> 2021-10-01
    dateToDictionaryFormat(monthYear: string) {
        const [month, year] = monthYear.split('/');
        return year + '-' + month + '-' + '01';
    }

    lineChartTableSummaryColumn() {
        return [
            this.getSales().reduce((partialSum, a) => partialSum + a, 0),
            this.getOutcome().reduce((partialSum, a) => partialSum + a, 0),
            this.getEOPPY().reduce((partialSum, a) => partialSum + a, 0),
            0
        ];
    }

    lineChartTableAvgColumn() {
        return [
            this.getSales().reduce((partialSum, a) => partialSum + a, 0) / 12,
            this.getOutcome().reduce((partialSum, a) => partialSum + a, 0) / 12,
            this.getEOPPY().reduce((partialSum, a) => partialSum + a, 0) / 12,
            0 / 12
        ];
    }

    totalSalesWithNoVatAndCostOfSoldedItemsSummaryColumn() {
        return [
            this.getSalesWithoutVat().reduce((partialSum, a) => partialSum + a, 0),
            this.getCostOfSoldedItems().reduce((partialSum, a) => partialSum + a, 0)
        ];
    }

    totalSalesWithNoVatAndCostOfSoldedItemsAvgColumn() {
        return [
            this.getSalesWithoutVat().reduce((partialSum, a) => partialSum + a, 0) / 12,
            this.getCostOfSoldedItems().reduce((partialSum, a) => partialSum + a, 0) / 12,
        ];
    }

    lineChartTablePersonalWithdrawalsSummaryColumn() {
        return [
            this.getTotalPersonalWithdrawals().reduce((partialSum, a) => partialSum + a, 0),
        ];
    }

    lineChartTablePersonalWithdrawalsAvgColumn() {
        return [
            this.getTotalPersonalWithdrawals().reduce((partialSum, a) => partialSum + a, 0) / 12,
        ];
    }

    grossProfitOperatingExpensesRebateTableSummaryColumn() {
        return [
            this.getGrossProfitWithoutVat().reduce((partialSum, a) => partialSum + a, 0),
            this.getOperatingExpensesValue().reduce((partialSum, a) => partialSum + a, 0),
            this.getRebate().reduce((partialSum, a) => partialSum + a, 0),
            (this.getGrossProfitWithoutVat().reduce((partialSum, a) => partialSum + a, 0)
                - this.getOperatingExpensesValue().reduce((partialSum, a) => partialSum + a, 0)
                - this.getRebate().reduce((partialSum, a) => partialSum + a, 0))
        ];
    }

    grossProfitOperatingExpensesRebateTableAvgColumn() {
        return [
            this.getGrossProfitWithoutVat().reduce((partialSum, a) => partialSum + a, 0) / 12,
            this.getOperatingExpensesValue().reduce((partialSum, a) => partialSum + a, 0) / 12,
            this.getRebate().reduce((partialSum, a) => partialSum + a, 0) / 12,
            (this.getGrossProfitWithoutVat().reduce((partialSum, a) => partialSum + a, 0) / 12
                - this.getOperatingExpensesValue().reduce((partialSum, a) => partialSum + a, 0) / 12
                - this.getRebate().reduce((partialSum, a) => partialSum + a, 0) / 12)
        ];
    }

    private getGrossProfitWithoutVat() {
        let total = [];
        for (let date in this.statistics) {
            total.push(this.dashboardService.totalGrossProfitWithoutVat(this.statistics, date));
        }
        return total.reverse();
    }

    private getOperatingExpensesValue() {
        let total = [];
        for (let date in this.statistics) {
            total.push(this.dashboardService.totalOperatingExpensesValue(this.statistics, date));
        }
        return total.reverse();
    }

    private getRebate() {
        let total = [];
        for (let date in this.statistics) {
            total.push(this.dashboardService.calculateRebate(this.statistics, date));
        }
        return total.reverse();
    }

    private getNetProfitWithTaxes() {
        let total = [];
        for (let date in this.statistics) {
            total.push((this.dashboardService.totalGrossProfitWithoutVat(this.statistics, date)
                - this.dashboardService.totalOperatingExpensesValue(this.statistics, date)
                - this.dashboardService.calculateRebate(this.statistics, date)));
        }
        return total.reverse();
    }


    markUpTableAvgColumn() {
        let sumGrossProfit = this.getGrossProfitWithoutVat().reduce((partialSum, a) => partialSum + a, 0);
        let sumCostOfSoldedItems = this.getCostOfSoldedItems().reduce((partialSum, a) => partialSum + a, 0);


        let sumNetProfitWithoutTaxes = (this.getGrossProfitWithoutVat().reduce((partialSum, a) => partialSum + a, 0)
            - this.getOperatingExpensesValue().reduce((partialSum, a) => partialSum + a, 0)
            - this.getRebate().reduce((partialSum, a) => partialSum + a, 0));
        let sumSalesWithNoVat = this.getSalesWithoutVat().reduce((partialSum, a) => partialSum + a, 0);


        return [
            (sumGrossProfit / sumCostOfSoldedItems), (sumNetProfitWithoutTaxes / sumSalesWithNoVat)
        ];
    }

    private getMarkUp() {
        let total = [];
        for (let date in this.statistics) {
            total.push(this.dashboardService.calculateMarkUp(this.statistics, date));
        }
        return total.reverse();
    }

    private getCostOfSoldedItems() {
        let total = [];
        for (let date in this.statistics) {
            total.push(this.dashboardService.totalCostOfSoldedItems(this.statistics, date));
        }
        return total.reverse();
    }

    createOperatingExpensesList() {
        Object.keys(TransactionType).forEach((s: string, index) => {
            const e = (<any>TransactionType)[s];
            if (e !== TransactionType.INCOME
                && e !== TransactionType.PERSONAL_WITHDRAWALS
                && e !== TransactionType.EXPENSE
                && e !== TransactionType.PAYMENT
                && e !== TransactionType.EOPPY
                && e !== TransactionType.TAXES
                && !e.toString().includes('function')) {
                this.operatingExpenses.push(e);
            }
        });
    }

    getValueOfOperatingExpense(expense: string, date: string) {
        let value = this.statistics[date].operatingExpenses[TransactionType.getIndexOf(expense)];
        if (value !== undefined) {
            let total = 0;
            this.statistics[date].operatingExpenses[TransactionType.getIndexOf(expense)].forEach((transaction) => {
                total+= +transaction.cost
            })
            return +total;
        }
        return 0;
    }

    operatingExpensesSummaryColumn(expense: string) {
        let value = 0;
        this.tableLabels.forEach((date) => {
            value += this.getValueOfOperatingExpense(expense, this.dateToDictionaryFormat(date));
        });
        return value;
    }

    operatingExpensesAvgColumn(expense: string) {
        let value = 0;
        this.tableLabels.forEach((date) => {
            value += this.getValueOfOperatingExpense(expense, this.dateToDictionaryFormat(date));
        });
        return value / 12;
    }

    private totalSummaryPerOperatingExpense() {
        let values = [];
        this.operatingExpenses.forEach((expense) => {
            let value = 0;
            this.tableLabels.forEach((date) => {
                value += this.getValueOfOperatingExpense(expense, this.dateToDictionaryFormat(date));
            });
            values.push(value);
        });
        return values;
    }
}
