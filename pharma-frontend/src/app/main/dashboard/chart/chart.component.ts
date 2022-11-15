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
    netProfitMarginList: any[] = [];
    netProfitLossesBeforeTaxesList: any[] = [];
    salesWithoutVatList: any[] = [];
    sales: any[] = [];
    outcome: any[] = [];
    eoppy: any[] = [];
    cashAndPos: any[] = [];
    grossProfitWithoutVat: number[] = [];
    operatingExpensesValueList: any[] = [];
    rebateList: any[] = [];
    markUpList: any[] = [];
    isLoaded: any;
    costOfSoldedItems: any = [];
    markUpAvg: any = [];
    grossProfitOperatingExpensesRebateTableSummaryColumn: any = [];
    grossProfitOperatingExpensesRebateTableAvgColumn: any = [];

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
                this.period = DateUtils.NgbDateToMonthPeriod(
                    new NgbDate(+selectedDates[0].getUTCFullYear(), +selectedDates[0].getUTCMonth()+1, +selectedDates[0].getUTCDate()));
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
                data: this.getCashAndPos(),
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
                label: 'Μικτά κέρδη',
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
                data: this.getNetProfitLossesBeforeTaxes(),
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
                setTimeout(() => {
                    this.statistics = plainToInstance(StatisticsDto, response);
                    const [year, month, day] = this.period.dateFrom.split('-');
                    this.tableLabels = this.generateLabels(new Date(+year, +month - 1, +day));
                    this.lineChart.labels = this.generateLabels(new Date(+year, +month - 1, +day));
                    this.netProfitLossesBeforeTaxesList = this.getNetProfitLossesBeforeTaxes();
                    this.salesWithoutVatList = this.getSalesWithoutVat();
                    this.sales = this.getSales();
                    this.outcome = this.getOutcome();
                    this.eoppy = this.getEOPPY();
                    this.cashAndPos = this.getCashAndPos();
                    this.grossProfitWithoutVat = this.getGrossProfitWithoutVat();
                    this.operatingExpensesValueList = this.getOperatingExpensesValue();
                    this.rebateList = this.getRebate();
                    this.markUpList = this.getMarkUp();
                    this.costOfSoldedItems = this.getCostOfSoldedItems();
                    this.netProfitMarginList = this.netProfitMargin();
                    this.markUpAvg = this.markUpTableAvgColumn();
                    this.grossProfitOperatingExpensesRebateTableSummaryColumn = this.calculateGrossProfitOperatingExpensesRebateTableSummaryColumn();
                    this.grossProfitOperatingExpensesRebateTableAvgColumn = this.calculateGrossProfitOperatingExpensesRebateTableAvgColumn();
                    this.lineChart.datasets[0].data = this.sales;
                    this.lineChart.datasets[1].data = this.outcome;
                    this.lineChart.datasets[2].data = this.eoppy;
                    this.lineChart.datasets[3].data = this.cashAndPos;


                    this.grossProfitLineChart.datasets[0].data = this.grossProfitWithoutVat;
                    this.grossProfitLineChart.datasets[1].data = this.operatingExpensesValueList;
                    this.grossProfitLineChart.datasets[2].data = this.rebateList;
                    this.grossProfitLineChart.datasets[3].data = this.netProfitLossesBeforeTaxesList;

                    this.markUpLineChart.datasets[0].data = this.markUpList;

                    this.polarAreaChart.datasets[0].data = this.totalSummaryPerOperatingExpense();

                    this.isLoaded = true;
                }, 500);

            })
            .catch((_: Error) => {
                this._authenticationService.logout();
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
        return labels;
    }

    private getSales() {
        for (let date in this.statistics) {
            this.sales.push(this.dashboardService.totalSales(this.statistics, date));
        }
        return this.sales;
    }

    private getSalesWithoutVat() {
        for (let date in this.statistics) {
            this.salesWithoutVatList.push(this.dashboardService.totalSalesWithNoVat(this.statistics, date));
        }
        return this.salesWithoutVatList;
    }

    private getOutcome() {
        for (let date in this.statistics) {
            this.outcome.push(this.dashboardService.totalExpenses(this.statistics, date));
        }
        return this.outcome;
    }

    private getEOPPY() {
        for (let date in this.statistics) {
            this.eoppy.push(this.dashboardService.totalMedicineAndConsumablesOnAccountWithVat(this.statistics, date));
        }
        return this.eoppy;
    }

    private getTotalPersonalWithdrawals() {
        let pw = [];
        for (let date in this.statistics) {
            pw.push(this.dashboardService.totalPersonalWithdrawals(this.statistics, date));
        }
        return pw;
    }

    //convert from 10/2021 -> 2021-10-01

    dateToDictionaryFormat(monthYear: string) {
        const [month, year] = monthYear.split('/');
        return year + '-' + month + '-' + '01';
    }

    lineChartTableSummaryColumn() {
        return [
            this.sales.reduce((partialSum, a) => partialSum + a, 0),
            this.outcome.reduce((partialSum, a) => partialSum + a, 0),
            this.eoppy.reduce((partialSum, a) => partialSum + a, 0),
            this.cashAndPos.reduce((partialSum, a) => partialSum + a, 0),
        ];
    }

    lineChartTableAvgColumn() {
        return [
            this.calcGPA(this.sales),
            this.calcGPA(this.outcome),
            this.calcGPA(this.eoppy),
            this.calcGPA(this.cashAndPos)
        ];
    }

    calcGPA(data) {
        const filtered = data.filter(item => item !== 0);
        if(filtered.length == 0){
            return 0;
        }
        const sum = filtered.reduce((a, b) => a + b);
        return sum / filtered.length ;
    }

    getCashAndPos(){
        for (let date in this.statistics) {
            this.cashAndPos.push(this.dashboardService.totalCash(this.statistics, date) + this.dashboardService.totalPos(this.statistics,date));
        }
        return this.cashAndPos;
    }

    totalSalesWithNoVatAndCostOfSoldedItemsSummaryColumn() {
        return [
            this.salesWithoutVatList.reduce((partialSum, a) => partialSum + a, 0),
            this.costOfSoldedItems.reduce((partialSum, a) => partialSum + a, 0)
        ];
    }

    totalSalesWithNoVatAndCostOfSoldedItemsAvgColumn() {
        return [
            this.calcGPA(this.salesWithoutVatList),
            this.calcGPA(this.costOfSoldedItems),
        ];
    }

    lineChartTablePersonalWithdrawalsSummaryColumn() {
        return [
            this.getTotalPersonalWithdrawals().reduce((partialSum, a) => partialSum + a, 0),
        ];
    }

    lineChartTablePersonalWithdrawalsAvgColumn() {
        return [
            this.calcGPA(this.getTotalPersonalWithdrawals()),
        ];
    }

    calculateGrossProfitOperatingExpensesRebateTableSummaryColumn() {
        return [
            this.grossProfitWithoutVat.reduce((partialSum, a) => partialSum + a, 0),
            this.operatingExpensesValueList.reduce((partialSum, a) => partialSum + a, 0),
            this.rebateList.reduce((partialSum, a) => partialSum + a, 0),
            this.netProfitLossesBeforeTaxesList.reduce((partialSum, a) => partialSum + a, 0),
        ];
    }

    calculateGrossProfitOperatingExpensesRebateTableAvgColumn() {
        return [
            this.calcGPA(this.grossProfitWithoutVat),
            this.calcGPA(this.operatingExpensesValueList),
            this.calcGPA(this.rebateList),
            this.calcGPA(this.netProfitLossesBeforeTaxesList)
        ];
    }

    private getGrossProfitWithoutVat() {
        for (let date in this.statistics) {
            this.grossProfitWithoutVat.push(this.dashboardService.totalGrossProfitWithoutVat(this.statistics, date));
        }
        return this.grossProfitWithoutVat;
    }

    private getOperatingExpensesValue() {
        for (let date in this.statistics) {
            this.operatingExpensesValueList.push(this.dashboardService.totalOperatingExpensesValue(this.statistics, date));
        }
        return this.operatingExpensesValueList;
    }

    private getRebate() {
        for (let date in this.statistics) {
            this.rebateList.push(this.dashboardService.calculateRebate(this.statistics, date));
        }
        return this.rebateList;
    }

    markUpTableAvgColumn() {
        let sumGrossProfit = this.grossProfitWithoutVat.reduce((partialSum, a) => partialSum + a, 0);
        let sumCostOfSoldedItems = this.costOfSoldedItems.reduce((partialSum, a) => partialSum + a, 0);
        let sumNetProfitWithoutTaxes = this.netProfitLossesBeforeTaxesList.reduce((partialSum, a) => partialSum + a, 0)
        let sumSalesWithNoVat = this.salesWithoutVatList.reduce((partialSum, a) => partialSum + a, 0);
        return [
            (sumGrossProfit / sumCostOfSoldedItems), (sumNetProfitWithoutTaxes / sumSalesWithNoVat)
        ];
    }

    private getMarkUp() {
        for (let date in this.statistics) {
            this.markUpList.push(this.dashboardService.calculateMarkUp(this.statistics, date));
        }
        return this.markUpList;
    }

    private getCostOfSoldedItems() {
        for (let date in this.statistics) {
            this.costOfSoldedItems.push(this.dashboardService.totalCostOfSoldedItems(this.statistics, date));
        }
        return this.costOfSoldedItems;
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
        let values = [];
        this.tableLabels.forEach((date) => {
            values.push(this.getValueOfOperatingExpense(expense, this.dateToDictionaryFormat(date)));
        });
        return this.calcGPA(values);
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

    private getNetProfitLossesBeforeTaxes() {
        for (let date in this.statistics) {
            this.netProfitLossesBeforeTaxesList.push(
                this.dashboardService.totalGrossProfitWithoutVat(this.statistics, date)
                -
                this.dashboardService.totalOperatingExpensesValue(this.statistics,date)
                -
                this.dashboardService.calculateRebate(this.statistics,date)
            );
        }
        return this.netProfitLossesBeforeTaxesList;
    }

    netProfitMargin() {
        for(let i=0;i<this.netProfitLossesBeforeTaxesList.length;i++){
            if(this.salesWithoutVatList[i] > 0){
                this.netProfitMarginList.push(this.netProfitLossesBeforeTaxesList[i]/this.salesWithoutVatList[i])
            }else{
                this.netProfitMarginList.push(0)
            }
        }
        return this.netProfitMarginList;

    }
}
