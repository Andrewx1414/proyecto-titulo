import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMessage = '';
  
    // Validar campos de entrada
    if (this.email.trim() === '' || this.password.trim() === '') {
      this.errorMessage = 'Por favor, ingrese el correo electrónico y la contraseña.';
      return;
    }
  
    if (!this.email.trim().match(/^\S+@\S+\.\S+$/)) {
      this.errorMessage = 'Por favor, ingrese un correo electrónico válido.';
      return;
    }
  
    this.authService.login(this.email, this.password).subscribe(
      response => {
        if (response.success) {
          // Guarda el usuario autenticado
          this.authService.setUsuario(response.user);
          console.log('Usuario autenticado:', response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          console.log('Usuario almacenado en localStorage:', localStorage.getItem('user'));
  
          // Redirige al dashboard correspondiente
          const userType = response.user.tipo_usuario;
          console.log('Tipo de usuario recibido:', userType);
  
          if (userType === 'paciente') {
            console.log('Redirigiendo a /dashboard-paciente');
            this.router.navigate(['/dashboard-paciente']);
          } else if (userType === 'terapeuta') {
            console.log('Redirigiendo a /dashboard-terapeuta');
            this.router.navigate(['/dashboard-terapeuta']);
          } else if (userType === 'administrador') {
            console.log('Redirigiendo a /dashboard-administrador');
            this.router.navigate(['/dashboard-administrador']);
          } else {
            this.errorMessage = 'Tipo de usuario no reconocido.';
          }
        } else {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        }
      },
      error => {
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        } else if (error.status === 500) {
          this.errorMessage = 'Error interno del servidor. Intente nuevamente más tarde.';
        } else {
          this.errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
        }
        console.error('Error de autenticación:', error);
      }
    );
  }
}  