import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const ruta = route.routeConfig?.path; // Ruta actual

    console.log('Validando usuario en AuthGuard:', user);
    console.log('Ruta solicitada:', ruta);

    if (user && user.tipo_usuario) {
      // Validar acceso a dashboard-administrador y sus rutas hijas
      if (ruta?.startsWith('dashboard-administrador') && user.tipo_usuario !== 'administrador') {
        console.log('Acceso denegado. Usuario no es administrador.');
        this.router.navigate(['/login']);
        return false;
      }

      console.log('Acceso permitido para la ruta:', ruta);
      return true; // Usuario válido
    } else {
      console.log('Usuario no autenticado. Redirigiendo al login.');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
