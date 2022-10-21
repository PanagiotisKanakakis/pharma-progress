import {Injectable} from '@angular/core';
import {getSalesStatisticsByCriteria, TransactionType, VAT} from '../../api/transaction';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

@Injectable()
export class DashboardService {
    public apiData: any;
    public onApiDataChanged: BehaviorSubject<any>;

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(private _httpClient: HttpClient) {
        // Set the defaults
        this.onApiDataChanged = new BehaviorSubject({});
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        return new Promise<void>((resolve, reject) => {
            Promise.all([this.getApiData()]).then(() => {
                resolve();
            }, reject);
        });
    }

    /**
     * Get Api Data
     */
    getApiData(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this._httpClient.get('api/dashboard-data').subscribe((response: any) => {
                this.apiData = response;
                this.onApiDataChanged.next(this.apiData);
                resolve(this.apiData);
            }, reject);
        });
    }

    /**
     * Get Api Data
     */
    getStatisticsData(userId: string, token: string, date: string, range: string) {
        return getSalesStatisticsByCriteria(
            {
                'userId': userId,
                'date': date,
                'range': range,
            },
            {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        )
    };


    totalSales( payload , date ) {
        return payload[date].totalPos
            + payload[date].totalCash
            + payload[date].totalOnAccount
            + payload[date].totalEOPPY
            - payload[date].totalPreviousMonths;
    }

    totalSalesWithNoVat( payload , date ) {
        let totalZNoVat = 0;
        let totalZ = 0;
        Object.keys(payload[date].incomePerVat).forEach(key => {
            const vat = +VAT.valueOf(+key) / 100;
            totalZNoVat += payload[date].incomePerVat[key] / (1 + vat);
            totalZ += payload[date].incomePerVat[key];
        });
        const extra = payload[date].totalPos
            + payload[date].totalCash
            - totalZ
            + payload[date].totalOnAccount
            - payload[date].totalPreviousMonths;
        return totalZNoVat
            + extra
            + payload[date].totalEOPPY / 1.06;
    }

    totalExpenses( payload , date ) {
        let totalExpenses = 0;
        Object.keys(payload[date].outcomePerVat).forEach(key => {
            totalExpenses += payload[date].outcomePerVat[key];
        });
        return totalExpenses;
    }

    totalExpensesWithNoVat( payload , date ) {
        let totalExpensesNoVat = 0;
        Object.keys(payload[date].outcomePerVat).forEach(key => {
            const vat = +VAT.valueOf(+key) / 100;
            totalExpensesNoVat += payload[date].outcomePerVat[key] / (1 + vat);
        });
        return totalExpensesNoVat;
    }

    totalMainSupplierOutcome( payload , date ) {
        let total = 0;
        Object.keys(payload[date].suppliers.mainSupplier.outcome).forEach(key => {
            total += payload[date].suppliers.mainSupplier.outcome[key];
        });
        return total;
    }

    totalOtherSupplierOutcome( payload , date ) {
        let total = 0;
        Object.keys(payload[date].suppliers.otherSuppliers.outcome).forEach(key => {
            total += payload[date].suppliers.otherSuppliers.outcome[key];
        });
        return total;
    }

    totalOtherSupplierOutcomeCash( payload , date ) {
        return payload[date].suppliers.otherSuppliers.outcome[0];
    }

    totalPersonalWithdrawals( payload , date ) {
        return payload[date].other[TransactionType.getIndexOf(TransactionType.PERSONAL_WITHDRAWALS)];
    }

    totalOperatingExpensesValue( payload , date ) {
        let value = 0;
        Object.keys(payload[date].operatingExpenses).forEach((key) => {
            payload[date].operatingExpenses[key].forEach((transaction) => {
                value += Number(transaction.cost)/(1 + Number(VAT.valueOf(transaction.vat))/100);
            })
        });
        return value;

    }

    totalCash( payload , date ) {
        return payload[date].totalCash;
    }

    totalPos( payload , date ) {
        return payload[date].totalPos;
    }

    totalEOPPYIncludingVat( payload , date ) {
        return payload[date].totalEOPPY;
    }

    totalIncomeOnAccount( payload , date ) {
        return payload[date].totalOnAccount - payload[date].totalPreviousMonths;
    }

    totalExchanges( payload , date ) {
        return payload[date].exchange;
    }

    consumablesValue( payload , date ) {
        return 0;
    }

    totalEOPPYAndConsumablesWithoutVat( payload , date ) {
        return payload[date].totalEOPPY / 1.06 + this.consumablesValue( payload , date );
    }

    totalGrossProfitWithoutVat( payload , date ) {
        return this.totalSalesWithNoVat( payload , date ) - this.totalExpensesWithNoVat( payload , date ) - this.totalInventoryChange( payload , date );
    }

    totalInventoryChange( payload , date ) {
        return 0;
    }

    totalCostOfSoldedItems( payload , date ) {
        return this.totalExpensesWithNoVat( payload , date ) - this.totalInventoryChange( payload , date );
    }

    calculateMarkUp( payload , date ) {
        return this.totalCostOfSoldedItems( payload , date ) > 0 ? (this.totalGrossProfitWithoutVat( payload , date ) / this.totalCostOfSoldedItems( payload , date ))*100 : 0;
    }

    calculateGrossProfitMargin( payload , date ) {
        return this.totalSalesWithNoVat( payload , date ) > 0 ? (this.totalGrossProfitWithoutVat( payload , date ) / this.totalSalesWithNoVat( payload , date ))*100 : 0;
    }

    calculateNetProfitMargin( payload , date ) {
        return this.totalSalesWithNoVat( payload , date ) > 0 ? (this.totalNetProfitWithoutTaxes( payload , date ) / this.totalSalesWithNoVat( payload , date )) * 100: 0;
    }

    totalNetProfitWithoutTaxes( payload , date ) {
        return this.totalGrossProfitWithoutVat( payload , date ) - this.totalOperatingExpensesValue( payload , date ) - this.calculateRebate( payload , date );
    }

    calculateRebate( payload , date ) {
        let total = this.totalEOPPYAndConsumablesWithoutVat( payload , date );
        if(total <= 3000){
            return 0;
        }else if(total <= 10000){
            return (total - 3000)*0.02;
        }else if (total <= 30000){
            return 7000*0.02 + (total - 10000)*0.03;
        }else if (total <= 40000){
            return 7000*0.02 + 20000*0.03 + (total - 30000)*0.05;
        }else{
            return 7000*0.02 + 20000*0.03 + 10000*0.05 + (total - 40000)*0.06 + this.calculateAdditionalRebate(total);
        }
    }

    calculateAdditionalRebate( total ){
        if(total <= 50000){
            return (total - 50000) * (0.5/100);
        }else if(total <= 60000){
            return 10000 * (0.5/100) + (total - 50000) * (1.25/100);
        }else if (total <= 80000){
            return 10000*(0.5/100) + 10000*(1.25/100) + (total - 60000)*(2.25/100);
        }else if (total <= 100000){
            return 10000*(0.5/100) + 10000*(1.25/100) + 20000*(2.25/100) + (total - 80000) * (3.5/100);
        }else {
            return 10000*(0.5/100) + 10000*(1.25/100) + 20000*(2.25/100) + 20000 * (3.5/100) + (total - 100000)*0.05;
        }
    }

    totalNetProfitWithTaxes( payload , date ) {
        return this.totalNetProfitWithoutTaxes( payload , date ) - this.totalTaxes( payload , date );
    }

    totalTaxes( payload , date ) {
        return 0;
    }

    totalOperatingExpensesIncludingVat( payload , date ) {
        let value = 0;
        Object.keys(payload[date].operatingExpenses).forEach((key) => {
            payload[date].operatingExpenses[key].forEach((transaction) => {
                value += Number(transaction.cost);
            })
        });
        return value;
    }

    totalPreviousMonthsPaymentsToOtherSuppliers( payload , date ) {
        return payload[date].suppliers.otherSuppliers.payment[0] + payload[date].suppliers.otherSuppliers.payment[1];
    }

    totalPreviousMonthsPaymentsToMainSupplier( payload , date ) {
        return payload[date].suppliers.mainSupplier.payment[0] + payload[date].suppliers.mainSupplier.payment[1];
    }

    totalMonthIncome( payload , date ) {
        return payload[date].totalIncome;
    }

    totalOpeningBalance( payload , date ) {
        return 0;
    }

    totalCashAvailable( payload , date ) {
        return this.totalOpeningBalance( payload , date ) + this.totalMonthIncome( payload , date ) + this.totalEOPPYIncludingVat(payload,date);
    }

    totalClosingBalance( payload , date ) {
        return this.totalCashAvailable( payload , date )
            - this.totalPreviousMonthsPaymentsToMainSupplier( payload , date )
            - this.totalPreviousMonthsPaymentsToOtherSuppliers( payload , date )
            - this.totalOtherSupplierOutcomeCash( payload , date )
            - this.totalOperatingExpensesIncludingVat( payload , date )
            - this.totalPersonalWithdrawals( payload , date );
    }


}
