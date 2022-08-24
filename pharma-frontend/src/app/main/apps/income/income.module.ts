import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {IncomeComponent} from './income.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {DatatablesModule} from '../../tables/datatables/datatables.module';
import {ContentHeaderModule} from '../../../layout/components/content-header/content-header.module';
import {CardSnippetModule} from '../../../../@core/components/card-snippet/card-snippet.module';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {CorePipesModule} from '../../../../@core/pipes/pipes.module';
import {NgbDatepickerModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {CoreCardModule} from '../../../../@core/components/core-card/core-card.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {TranslateModule} from '@ngx-translate/core';
import {CoreDirectivesModule} from '../../../../@core/directives/directives';
import {IncomeService} from './income.service';
import {CardBasicModule} from '../../ui/card/card-basic/card-basic.module';


const routes: Routes = [
    {
        path: 'real',
        redirectTo: '/apps/income/real'
    },
    {
        path: 'z',
        redirectTo: '/apps/income/z'
    },
    {
        path: ':type',
        component: IncomeComponent,
    },
];

@NgModule({
    declarations: [
        IncomeComponent,
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
        CardBasicModule,
        NgbTooltipModule
    ],
    providers: [
        IncomeService
    ]

})
export class IncomeModule {

}
