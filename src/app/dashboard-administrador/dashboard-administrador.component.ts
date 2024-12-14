import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-dashboard-administrador', // Cambiar el selector
  templateUrl: './dashboard-administrador.component.html',
  styleUrls: ['./dashboard-administrador.component.css']
})
export class DashboardAdministradorComponent implements OnInit {
  administradorNombre: string = ''; // Cambiar terapeutaNombre a administradorNombre
  rutaActiva: string = 'datos';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener el usuario autenticado desde AuthService
    const usuario = this.authService.getUsuario();
    
    if (usuario && usuario.tipo_usuario === 'administrador') { // Validar administrador
      this.administradorNombre = usuario.nombre; // Actualizar la propiedad
    } else {
      // Si no hay usuario o no es administrador, redirigir al login
      this.router.navigate(['/login']);
      return;
    }

    // Establecer la ruta activa según la URL actual
    this.route.url.subscribe(urlSegment => {
      if (urlSegment.length > 0) {
        this.rutaActiva = urlSegment[0].path;
      }
    });
  }

  navigateTo(ruta: string): void {
    // Navegar a la ruta seleccionada, pero solo si no estamos ya en esa ruta
    if (this.rutaActiva !== ruta) {
      this.router.navigate([`./${ruta}`], { relativeTo: this.route });
      this.rutaActiva = ruta; // Actualizar la ruta activa después de navegar
    }
  }

  cerrarSesion(): void {
    // Cerrar sesión y redirigir al login
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
