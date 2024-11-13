import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-terapeuta',
  templateUrl: './dashboard-terapeuta.component.html',
  styleUrls: ['./dashboard-terapeuta.component.css']
})
export class DashboardTerapeutaComponent {
  nombre: string = '';
  email: string = '';
  password: string = '';
  tipoUsuario: string = 'paciente'; // Por defecto es 'paciente'
  mensaje: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  createUser() {
    const userData = {
      nombre: this.nombre,
      email: this.email,
      password: this.password,
      usuario: this.tipoUsuario
    };

    this.http.post('http://localhost:3000/api/usuarios', userData).subscribe(
      (response: any) => {
        if (response.success) {
          this.mensaje = 'Usuario creado exitosamente';
          // Limpiar los campos después de la creación
          this.nombre = '';
          this.email = '';
          this.password = '';
          this.tipoUsuario = 'paciente';
        } else {
          this.mensaje = 'Error al crear el usuario';
        }
      },
      (error) => {
        this.mensaje = 'Error en el servidor';
        console.error('Error:', error);
      }
    );
  }

  logout() {
    this.router.navigate(['/']);
  }
}
