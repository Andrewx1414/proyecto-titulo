import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router'; // Importar RouterModule
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardAdministradorComponent } from './dashboard-administrador/dashboard-administrador.component';
import { ServiceWorkerModule } from '@angular/service-worker';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AsignarSesionesComponent } from './asignar-sesiones/asignar-sesiones.component';
import { SubirVideosComponent } from './subir-videos/subir-videos.component';
import { MantenedorUsuariosComponent } from './mantenedor-usuarios/mantenedor-usuarios.component';
import { EncuestasComponent } from './encuestas/encuestas.component';

// Importar los servicios necesarios
import { UsuarioService } from './usuario.service';
import { SesionesService } from './sesiones.service';
import { DashboardTerapeutaComponent } from './dashboard-terapeuta/dashboard-terapeuta.component';
import { NgChartsModule } from 'ng2-charts';
import { DashboardComponent } from './dashboard/dashboard.component';

// Registrar locale español
registerLocaleData(localeEs);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardPacienteComponent,
    DashboardAdministradorComponent,
    AsignarSesionesComponent,
    SubirVideosComponent,
    MantenedorUsuariosComponent,
    EncuestasComponent,
    DashboardTerapeutaComponent,
    DashboardComponent // Asegúrate de declarar el componente Dashboard aquí
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule, // Añadir RouterModule
    FormsModule,
    HttpClientModule,
    NgChartsModule, // Importación de gráficos
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    UsuarioService, // Añadir UsuarioService al provider
    SesionesService // Añadir SesionesService al provider
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
