import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {TranslateModule} from '@ngx-translate/core';

import {NgbDateParserFormatter, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {NgApexchartsModule} from 'ng-apexcharts';
import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';

import {AuthGuard} from 'app/auth/helpers';
import {Role} from 'app/auth/models';

import {CoreCommonModule} from '@core/common.module';

import {InvoiceModule} from 'app/main/apps/invoice/invoice.module';
import {InvoiceListService} from 'app/main/apps/invoice/invoice-list/invoice-list.service';

import {DashboardService} from 'app/main/dashboard/dashboard.service';

import {AnalyticsComponent} from 'app/main/dashboard/analytics/analytics.component';
import {ChartComponent} from 'app/main/dashboard/chart/chart.component';
import {NavbarModule} from '../../layout/components/navbar/navbar.module';
import {NgbdateCustomParserFormatterYearMonth} from '../../common/utils/ngbdate-custom-parser-formatter-year-month';
import {ResultsComponent} from './results/results.component';
import {NgSelectModule} from '@ng-select/ng-select';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';

const routes = [
    {
        path: 'analytics',
        component: AnalyticsComponent,
        canActivate: [AuthGuard],
        data: {roles: [Role.Admin], animation: 'danalytics'},
        resolve: {
            css: DashboardService,
            inv: InvoiceListService
        }
    },
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
    declarations: [AnalyticsComponent, ChartComponent, ResultsComponent],
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
        NgxDatatableModule
    ],
    providers: [
        DashboardService,
        {
            provide: NgbDateParserFormatter,
            useClass: NgbdateCustomParserFormatterYearMonth
        }],
    exports: [ChartComponent, ResultsComponent, AnalyticsComponent]
})
export class DashboardModule {
}
