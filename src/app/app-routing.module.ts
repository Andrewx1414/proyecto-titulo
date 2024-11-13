import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardTerapeutaComponent } from './dashboard-terapeuta/dashboard-terapeuta.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'dashboard-paciente', component: DashboardPacienteComponent },
  { path: 'dashboard-terapeuta', component: DashboardTerapeutaComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
