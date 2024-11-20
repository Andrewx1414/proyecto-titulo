import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { DashboardTerapeutaComponent } from './dashboard-terapeuta/dashboard-terapeuta.component';
import { AsignarSesionesComponent } from './asignar-sesiones/asignar-sesiones.component';
import { SubirVideosComponent } from './subir-videos/subir-videos.component';
import { MantenedorUsuariosComponent } from './mantenedor-usuarios/mantenedor-usuarios.component';
import { EncuestasComponent } from './encuestas/encuestas.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirige a login por defecto
  { path: 'login', component: LoginComponent },
  { path: 'dashboard-paciente', component: DashboardPacienteComponent },
  {
    path: 'dashboard-terapeuta', component: DashboardTerapeutaComponent,
    children: [
      { path: '', redirectTo: 'asignar-sesiones', pathMatch: 'full' }, // Ruta predeterminada para el dashboard del terapeuta
      { path: 'asignar-sesiones', component: AsignarSesionesComponent },
      { path: 'subir-videos', component: SubirVideosComponent },
      { path: 'mantenedor-usuarios', component: MantenedorUsuariosComponent },
      { path: 'encuestas', component: EncuestasComponent }
    ]
  },
  { path: '**', redirectTo: 'login' } // Ruta comodín para manejar todas las demás rutas no encontradas
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
