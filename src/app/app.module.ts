import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // Importa HttpClientModule
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardTerapeutaComponent } from './dashboard-terapeuta/dashboard-terapeuta.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    DashboardPacienteComponent,
    DashboardTerapeutaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule // Agrega HttpClientModule aquí
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
