import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PrescriptionComponent} from './prescription.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {DatatablesModule} from '../../tables/datatables/datatables.module';
import {ContentHeaderModule} from '../../../layout/components/content-header/content-header.module';
import {CardSnippetModule} from '../../../../@core/components/card-snippet/card-snippet.module';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {CorePipesModule} from '../../../../@core/pipes/pipes.module';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {CoreCardModule} from '../../../../@core/components/core-card/core-card.module';
import {NgSelectModule} from '@ng-select/ng-select';
import {TranslateModule} from '@ngx-translate/core';
import {CoreDirectivesModule} from '../../../../@core/directives/directives';
import {PrescriptionService} from './prescription.service';
import {Ng2FlatpickrModule} from 'ng2-flatpickr';


const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Prescription',
            urls: [
                {title: 'Prescription', url: '/prescriptions'},
                {title: 'Prescriptions'}
            ]
        },
        component: PrescriptionComponent
    }
];

@NgModule({
    declarations: [
        PrescriptionComponent,
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
        Ng2FlatpickrModule
    ],
    providers: [
        PrescriptionService
    ]

})
export class PrescriptionModule {

}
