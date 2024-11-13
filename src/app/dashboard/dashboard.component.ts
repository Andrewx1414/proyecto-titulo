import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  nombre: string = '';
  email: string = '';
  password: string = ''; // Cambiado de 'contraseña' a 'password'
  tipoUsuario: string = 'paciente';
  mensaje: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  createUser() {
    const userData = {
      nombre: this.nombre,
      email: this.email,
      password: this.password, // Cambiado de 'contraseña' a 'password'
      usuario: this.tipoUsuario
    };

    this.http.post('http://localhost:3000/api/usuarios', userData).subscribe(
      (response: any) => {
        if (response.success) {
          this.mensaje = 'Usuario creado exitosamente';
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
    this.router.navigate(['/']); // Redirige al usuario a la página de login
  }
}
