import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PersonalWithdrawalsComponent} from './personal-withdrawals.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {DatatablesModule} from '../../../tables/datatables/datatables.module';
import {ContentHeaderModule} from '../../../../layout/components/content-header/content-header.module';
import {CardSnippetModule} from '../../../../../@core/components/card-snippet/card-snippet.module';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {CorePipesModule} from '../../../../../@core/pipes/pipes.module';
import {NgbDateParserFormatter, NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {CoreCardModule} from '../../../../../@core/components/core-card/core-card.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {TranslateModule} from '@ngx-translate/core';
import {CoreDirectivesModule} from '../../../../../@core/directives/directives';
import {NgbdateCustomParserFormatterYearMonth} from '../../../../common/utils/ngbdate-custom-parser-formatter-year-month';

const routes: Routes = [
    {
        path: 'source/bank',
        redirectTo: '/apps/withdrawals/source/bank'
    },
    {
        path: 'source/cash',
        redirectTo: '/apps/withdrawals/source/cash'
    },
    {
        path: 'source/:type',
        component: PersonalWithdrawalsComponent,
    },
];

@NgModule({
    declarations: [
        PersonalWithdrawalsComponent,
    ],
    imports: [
        FormsModule,
        CommonModule,
        ReactiveFormsModule,
        RouterModule.forChild(routes),
        DatatablesModule,
        ContentHeaderModule,
        CardSnippetModule,
        NgxDatatableModule,
        CorePipesModule,
        NgbDatepickerModule,
        CoreCardModule,
        NgSelectModule,
        TranslateModule,
        CoreDirectivesModule
    ],
    providers: [
        {
            provide: NgbDateParserFormatter,
            useClass: NgbdateCustomParserFormatterYearMonth
        },
    ]

})
export class PersonalWithdrawalsModule {

}
