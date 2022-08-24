import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {NgbDateParserFormatter, NgbDatepickerModule, NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {NgSelectModule} from '@ng-select/ng-select';
import {TranslateModule} from '@ngx-translate/core';
import {DatatablesModule} from '../../tables/datatables/datatables.module';
import {ContentHeaderModule} from '../../../layout/components/content-header/content-header.module';
import {CardSnippetModule} from '../../../../@core/components/card-snippet/card-snippet.module';
import {CorePipesModule} from '../../../../@core/pipes/pipes.module';
import {CoreCardModule} from '../../../../@core/components/core-card/core-card.module';
import {CoreDirectivesModule} from '../../../../@core/directives/directives';
import {NationalHealthComponent} from './nationalHealth.component';
import {NgbdateCustomParserFormatterYearMonth} from '../../../common/utils/ngbdate-custom-parser-formatter-year-month';


const routes: Routes = [
    {
        path: 'onAccount',
        redirectTo: '/apps/nationalHealth/onAccount'
    },
    {
        path: 'income',
        redirectTo: '/apps/nationalHealth/income'
    },
    {
        path: ':type',
        component: NationalHealthComponent,
    },
];

@NgModule({
    declarations: [
        NationalHealthComponent,
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
        CoreDirectivesModule,
        NgbDropdownModule
    ],
    providers:[
        {
            provide: NgbDateParserFormatter,
            useClass: NgbdateCustomParserFormatterYearMonth
        },
    ]
})
export class NationalHealthModule {

}
