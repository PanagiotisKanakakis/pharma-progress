import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {CoreTranslationService} from '@core/services/translation.service';
import {locale as english} from 'app/common/i18n/en';
import {locale as greek} from 'app/common/i18n/gr';
import {User} from '../../../auth/models';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService} from '../../../auth/service';
import {DashboardService} from "../../dashboard/dashboard.service";

@Component({
    selector: 'break-even-point',
    templateUrl: './break-even-point.component.html',
    styleUrls: ['./break-even-point.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class BreakEvenPointComponent implements OnInit {
    public currentUser: User;
    editingValue = [];
    values = [];
    operatingExpenses = [];
    variableCosts = [];

    constructor(private _coreTranslationService: CoreTranslationService,
                private _authenticationService: AuthenticationService,
                private dashBoardService: DashboardService,
                private _router: Router,
                private route: ActivatedRoute) {
        this._coreTranslationService.translate(english, greek);
    }

    ngOnInit() {
        for (let i = 0; i < 20; i++) {
            this.editingValue[i] = false;
            this.values[i] = 0;
        }
        this.operatingExpenses = [
            {
                name: 'Μηνιαίο Κόστος Υπαλλήλων (περ. ΔΩΡΑ, επιδομα, ασφ.εισφορα)',
                value: 0,
                editingValue: false
            }, {
                name: 'Ενοίκιο',
                value: 0,
                editingValue: false
            }, {
                name: 'ΔΕΗ - Τηλεπικοινωνίες - Λοιπά',
                value: 0,
                editingValue: false
            }, {
                name: 'Αμοιβές Τρίτων (λογιστής, πληροφορική, συνδρομές, εισφορές κ.α.)',
                value: 0,
                editingValue: false
            }, {
                name: 'Ασφάλιση (ΤΣΑΥ Φαρμακοποιού)',
                value: 0,
                editingValue: false
            }, {
                name: 'Διάφορα (χαρτί, αναλώσιμα, σακούλες, συντήρηση κ.λπ.)',
                value: 0,
                editingValue: false
            }, {
                name: 'Τράπεζες (τόκοι, προμήθειες)-Δόση Δανείου-Ασφάλεια',
                value: 0,
                editingValue: false
            }
        ]
        this.variableCosts = [{
            name: 'Marketing - Διαφήμιση - Promotion',
            value: 0,
            editingValue: false
        }, {
            name: 'Έκτακτο προσωπικό, συντήρηση, αναλώσιμα κ.α.',
            value: 0,
            editingValue: false
        }, {
            name: 'Πρόβλεψη ζημίας ληγμένων προιόντων',
            value: 0,
            editingValue: false
        }]
    }

    calculateBreakEvenPoint() {
        console.log(this.sumOfOperatingExpenses())
        console.log((1-this.overallForecast()))
        return this.sumOfOperatingExpenses()/(1-this.overallForecast());
    }

    calculatePreVatProfit() {
        return this.getMonthlySales() - this.sumOfOperatingExpenses()-(this.overallForecast()*this.getMonthlySales());
    }

    calculateVariableCosts() {
        return 0;
    }

    monthlySales(event) {
        this.values[0] = event.target.value;
        this.editingValue[0] = false;
    }

    getMonthlySales() {
        return this.values[0];
    }

    salesPercentageOnMedicine(event) {
        this.values[1] = event.target.value;
        this.editingValue[1] = false;
    }

    getSalesPercentageOnMedicine() {
        return this.values[1];
    }

    salesPercentageOnParamedics(event) {
        this.values[2] = event.target.value;
        this.editingValue[2] = false;
    }

    getSalesPercentageOnParamedics() {
        return this.values[2];
    }

    avgEOPPY(event) {
        this.values[3] = event.target.value;
        this.editingValue[3] = false;
    }

    getAvgEOPPY() {
        return this.values[3];
    }

    markUpMedicine(event) {
        this.values[4] = event.target.value;
        this.editingValue[4] = false;
    }

    getMarkUpMedicine() {
        return this.values[4];
    }

    markUpParaMedics(event) {
        this.values[5] = event.target.value;
        this.editingValue[5] = false;
    }

    getMarkUpParaMedics() {
        return this.values[5];
    }

    operatingExpensesValue(event, i) {
        this.operatingExpenses[i].value = event.target.value;
        this.operatingExpenses[i].editingValue = false;
    }

    sumOfOperatingExpenses() {
        return this.operatingExpenses.reduce((partialSum, a) => partialSum + +a.value, 0)
    }

    calculateCostOfSoldItems() {
        return this.getSalesPercentageOnMedicine() / (1 + this.getMarkUpMedicine()) + this.getSalesPercentageOnParamedics() / (1 + this.getMarkUpParaMedics());
    }

    calculateRebateApproach() {
        if(this.getMonthlySales() > 0){
            return this.calculateRebate(this.getAvgEOPPY()) / this.getMonthlySales();
        }
        return 0;
    }

    calculateRebate(total) {
        if (total <= 3000) {
            return 0;
        } else if (total <= 10000) {
            return (total - 3000) * 0.02;
        } else if (total <= 30000) {
            return 7000 * 0.02 + (total - 10000) * 0.03;
        } else if (total <= 40000) {
            return 7000 * 0.02 + 20000 * 0.03 + (total - 30000) * 0.05;
        } else {
            return 7000 * 0.02 + 20000 * 0.03 + 10000 * 0.05 + (total - 40000) * 0.06;
        }
    }

    overallForecast() {
        return this.variableCosts.reduce((partialSum, a) => partialSum + +a.value, 0)
            + +this.calculateRebateApproach()
            + +this.calculateCostOfSoldItems();
    }
}
