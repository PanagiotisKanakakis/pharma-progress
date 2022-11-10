import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';

// routing
const routes: Routes = [
  {
    path: 'email',
    loadChildren: () => import('./email/email.module').then(m => m.EmailModule)
  },
  {
    path: 'chat',
    loadChildren: () => import('./chat/chat.module').then(m => m.ChatModule)
  },
  {
    path: 'todo',
    loadChildren: () => import('./todo/todo.module').then(m => m.TodoModule)
  },
  {
    path: 'calendar',
    loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule)
  },
  {
    path: 'invoice',
    loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule)
  },
  {
    path: 'e-commerce',
    loadChildren: () => import('./ecommerce/ecommerce.module').then(m => m.EcommerceModule)
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.module').then(m => m.UserModule)
  },
  {
    path: 'income',
    loadChildren: () => import('./income/income.module').then(m => m.IncomeModule)
  },
  {
    path: 'outcome',
    loadChildren: () => import('./outcome/outcome.module').then(m => m.OutcomeModule)
  },
  {
    path: 'nationalHealth',
    loadChildren: () => import('./nationalHealth/nationalHealth.module').then(m => m.NationalHealthModule)
  },
  {
    path: 'operating-expenses',
    loadChildren: () => import('./operating-expenses/operating-expenses.module').then(m => m.OperatingExpensesModule)
  },
  {
    path: 'withdrawals',
    loadChildren: () => import('./personal-withdrawals/personal-withdrawals-edit/personal-withdrawals.module').then(m => m.PersonalWithdrawalsModule)
  },
  {
    path: 'check',
    loadChildren: () => import('./check/check.module').then(m => m.CheckModule)
  },
  {
    path: 'payment',
    loadChildren: () => import('./payment/payment.module').then(m => m.PaymentModule)
  },
  {
    path: 'break-even-point',
    loadChildren: () => import('./break-even-point/break-even-point.module').then(m => m.BreakEvenPointModule)
  },
];

FullCalendarModule.registerPlugins([dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]);

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class AppsModule {}
