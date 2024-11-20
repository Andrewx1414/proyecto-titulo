import { Component } from '@angular/core';
import { UsuarioService } from '../usuario.service';
import { AuthService } from '../auth.service';

interface Usuario {
  tipo_usuario: string;
  rut: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  fecha_nacimiento?: string;
  telefono?: string;
  direccion?: string;
  especialidad?: string;
  terapeuta_id?: number; // Nuevo campo para asociar el paciente al terapeuta
}

@Component({
  selector: 'app-mantenedor-usuarios',
  templateUrl: './mantenedor-usuarios.component.html',
  styleUrls: ['./mantenedor-usuarios.component.css']
})
export class MantenedorUsuariosComponent {
  nuevoUsuario: Usuario = this.obtenerNuevoUsuario();
  esPaciente: boolean = false;
  esTerapeuta: boolean = false;
  errorMessage: string = '';
  terapeutaId: number | null = null;

  constructor(private usuarioService: UsuarioService, private authService: AuthService) {
    // Obtener el terapeuta_id del terapeuta autenticado utilizando el método getTerapeutaId
    this.terapeutaId = this.authService.getTerapeutaId();
  }

  obtenerNuevoUsuario(): Usuario {
    return {
      tipo_usuario: '',
      rut: '',
      nombre: '',
      apellidos: '',
      email: '',
      password: '',
    };
  }

  onCheckboxChange(tipo: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (tipo === 'paciente') {
      this.esPaciente = isChecked;
      this.esTerapeuta = false; // Desactivar la otra casilla
    } else if (tipo === 'terapeuta') {
      this.esTerapeuta = isChecked;
      this.esPaciente = false; // Desactivar la otra casilla
    }

    // Solo establecer el valor de `nuevoUsuario.tipo_usuario` si hay un cambio en los flags
    if (this.esPaciente) {
      this.nuevoUsuario.tipo_usuario = 'paciente';
    } else if (this.esTerapeuta) {
      this.nuevoUsuario.tipo_usuario = 'terapeuta';
    } else {
      this.nuevoUsuario.tipo_usuario = '';
    }
  }

  registrarUsuario(): void {
    this.errorMessage = ''; // Limpiar mensaje de error antes de validar

    // Validar campos comunes
    if (!this.nuevoUsuario.tipo_usuario || !this.nuevoUsuario.rut || !this.nuevoUsuario.nombre ||
      !this.nuevoUsuario.apellidos || !this.nuevoUsuario.email || !this.nuevoUsuario.password) {
      this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
      return;
    }

    // Validar campos adicionales para pacientes
    if (this.nuevoUsuario.tipo_usuario === 'paciente') {
      if (!this.nuevoUsuario.fecha_nacimiento || !this.nuevoUsuario.telefono || !this.nuevoUsuario.direccion) {
        this.errorMessage = 'Por favor, completa todos los campos obligatorios del paciente.';
        return;
      }

      // Asociar el paciente con el terapeuta que lo está creando
      if (this.terapeutaId) {
        this.nuevoUsuario.terapeuta_id = this.terapeutaId;
      } else {
        this.errorMessage = 'No se pudo identificar al terapeuta que está creando al paciente.';
        return;
      }
    }

    // Validar campos adicionales para terapeutas
    if (this.nuevoUsuario.tipo_usuario === 'terapeuta') {
      if (!this.nuevoUsuario.especialidad) {
        this.errorMessage = 'Por favor, ingresa la especialidad del terapeuta.';
        return;
      }
    }

    // Llamar al servicio para registrar el usuario
    this.usuarioService.registrarUsuario(this.nuevoUsuario).subscribe(
      (response) => {
        if (response.success) {
          console.log('Usuario registrado:', response);
          this.errorMessage = ''; // Limpia el mensaje de error si el registro es exitoso
          this.resetFormulario(); // Limpia el formulario después de registrar
        } else {
          this.errorMessage = response.message || 'No se pudo registrar el usuario.';
        }
      },
      (error) => {
        console.error('Error al registrar usuario:', error);
        this.errorMessage = error?.error?.message || 'Error al comunicarse con el servidor.';
      }
    );
  }

  resetFormulario(): void {
    console.log('Formulario reseteado');
    this.nuevoUsuario = this.obtenerNuevoUsuario();
    this.esPaciente = false;
    this.esTerapeuta = false;
    this.errorMessage = '';

    // Asegurarse de que el tipo de usuario quede sin seleccionar
    this.nuevoUsuario.tipo_usuario = '';
  }
}
