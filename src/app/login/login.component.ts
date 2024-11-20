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

    if (this.email.trim() === '' || this.password.trim() === '') {
      this.errorMessage = 'Por favor, ingrese el correo electrónico y la contraseña.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe(
      response => {
        if (response.success) {
          // Guarda el usuario autenticado en el AuthService
          this.authService.setUsuario(response.user);

          // Redirige al dashboard correspondiente según el tipo de usuario
          if (response.user.tipo_usuario === 'paciente') {
            this.router.navigate(['/dashboard-paciente']);
          } else if (response.user.tipo_usuario === 'terapeuta') {
            this.router.navigate(['/dashboard-terapeuta']);
          }
        } else {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        }
      },
      error => {
        this.errorMessage = 'Ocurrió un error al intentar iniciar sesión. Inténtalo de nuevo más tarde.';
        console.error('Error de autenticación:', error);
      }
    );
  }
}
