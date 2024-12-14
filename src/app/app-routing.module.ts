import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardTerapeutaComponent } from './dashboard-terapeuta/dashboard-terapeuta.component';
import { DashboardAdministradorComponent } from './dashboard-administrador/dashboard-administrador.component';
import { AsignarSesionesComponent } from './asignar-sesiones/asignar-sesiones.component';
import { SubirVideosComponent } from './subir-videos/subir-videos.component';
import { MantenedorUsuariosComponent } from './mantenedor-usuarios/mantenedor-usuarios.component';
import { EncuestasComponent } from './encuestas/encuestas.component';
import {DashboardComponent} from './dashboard/dashboard.component'

import { AuthGuard } from './auth.guard'; // Importar el guard

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  // Rutas protegidas con AuthGuard
  { path: 'dashboard-paciente', component: DashboardPacienteComponent, canActivate: [AuthGuard] },
  
  { 
    path: 'dashboard-terapeuta', 
    component: DashboardTerapeutaComponent, 
    canActivate: [AuthGuard], // Protege el dashboard del terapeuta
    children: [
      { path: '', redirectTo: 'asignar-sesiones', pathMatch: 'full' },
      { path: 'asignar-sesiones', component: AsignarSesionesComponent },
      { path: 'subir-videos', component: SubirVideosComponent },
      { path: 'mantenedor-usuarios', component: MantenedorUsuariosComponent },
      { path: 'encuestas', component: EncuestasComponent }
    ]
  },
  
  { 
    path: 'dashboard-administrador', 
    component: DashboardAdministradorComponent, 
    canActivate: [AuthGuard], 
    children :[
      { path: '', redirectTo: 'datos', pathMatch: 'full' },
      { path: 'asignar-sesiones', component: AsignarSesionesComponent },
      { path: 'subir-videos', component: SubirVideosComponent },
      { path: 'mantenedor-usuarios', component: MantenedorUsuariosComponent },
      { path: 'encuestas', component: EncuestasComponent },
      { path: 'datos', component: DashboardComponent }
    ]
  },

  // Ruta comodín para manejar rutas no encontradas
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
