import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {TranslateModule} from '@ngx-translate/core';

import {NgbDateParserFormatter, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {NgApexchartsModule} from 'ng-apexcharts';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';

import {AuthGuard} from 'app/auth/helpers';

import {CoreCommonModule} from '@core/common.module';

import {InvoiceModule} from 'app/main/apps/invoice/invoice.module';

import {DashboardService} from 'app/main/dashboard/dashboard.service';

import {ChartComponent} from 'app/main/dashboard/chart/chart.component';
import {NavbarModule} from '../../layout/components/navbar/navbar.module';
import {NgbdateCustomParserFormatterYearMonth} from '../../common/utils/ngbdate-custom-parser-formatter-year-month';
import {ResultsComponent} from './results/results.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {ContentHeaderModule} from '../../layout/components/content-header/content-header.module';
import {Ng2FlatpickrModule} from 'ng2-flatpickr';
import {ChartsModule} from 'ng2-charts';

const routes = [
    {
        path: 'chart',
        component: ChartComponent,
        canActivate: [AuthGuard],
        resolve: {
            css: DashboardService
        },
        data: {animation: 'decommerce'}
    },
    {
        path: 'results',
        component: ResultsComponent,
        canActivate: [AuthGuard],
        resolve: {
            css: DashboardService
        },
        data: {animation: 'decommerce'}
    }
];

@NgModule({
    declarations: [ ChartComponent, ResultsComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        TranslateModule,
        NgbModule,
        PerfectScrollbarModule,
        CoreCommonModule,
        NgApexchartsModule,
        InvoiceModule,
        NavbarModule,
        NgSelectModule,
        NgxDatatableModule,
        ContentHeaderModule,
        Ng2FlatpickrModule,
        ChartsModule
    ],
    providers: [
        DashboardService,
        {
            provide: NgbDateParserFormatter,
            useClass: NgbdateCustomParserFormatterYearMonth
        }],
    exports: [ChartComponent, ResultsComponent]
})
export class DashboardModule {
}
