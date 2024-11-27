import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../usuario.service';
import { AuthService } from '../auth.service';

interface Usuario {
  id?: number; // ID del usuario
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
  terapeuta_id?: number; // ID del terapeuta asociado (solo para pacientes)
  patologia?: string; // Patología (solo para pacientes)
}

@Component({
  selector: 'app-mantenedor-usuarios',
  templateUrl: './mantenedor-usuarios.component.html',
  styleUrls: ['./mantenedor-usuarios.component.css'],
})
export class MantenedorUsuariosComponent implements OnInit {
  usuarios: Usuario[] = []; // Lista de usuarios cargados
  nuevoUsuario: Usuario = this.obtenerNuevoUsuario();
  usuarioEditando: Usuario = this.obtenerNuevoUsuario(); // Inicialización para evitar null
  editando: boolean = false; // Estado de edición
  esPaciente: boolean = false;
  esTerapeuta: boolean = false;
  errorMessage: string = '';
  terapeutaId: number | null = null;
  tipoUsuarioLogueado: string = ''; // Tipo de usuario logueado

  constructor(private usuarioService: UsuarioService, private authService: AuthService) {
    // Obtener datos del usuario logueado
    const usuario = this.authService.getUsuario();
    this.tipoUsuarioLogueado = usuario?.tipo_usuario || '';
    this.terapeutaId = usuario?.tipo_usuario === 'terapeuta' ? usuario.id : null;
  }

  ngOnInit(): void {
    // Configurar restricciones según el tipo de usuario
    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.esPaciente = true;
      this.esTerapeuta = false;
      this.nuevoUsuario.tipo_usuario = 'paciente'; // Solo pacientes permitidos
    }

    this.cargarUsuarios(); // Cargar usuarios al iniciar el componente
  }

  cargarUsuarios(): void {
    console.log('Tipo de usuario logueado:', this.tipoUsuarioLogueado);
    console.log('Terapeuta ID:', this.terapeutaId);

    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.usuarioService.obtenerPacientesPorTerapeuta(this.terapeutaId!).subscribe(
        (response) => {
          console.log('Pacientes cargados:', response.pacientes);
          this.usuarios = response.pacientes;
        },
        (error) => {
          console.error('Error al cargar pacientes:', error);
          this.errorMessage = 'No se pudieron cargar los pacientes.';
        }
      );
    } else {
      this.usuarioService.obtenerUsuarios().subscribe(
        (response) => {
          console.log('Usuarios cargados para admin:', response.usuarios);
          this.usuarios = response.usuarios;
        },
        (error) => {
          console.error('Error al cargar usuarios:', error);
          this.errorMessage = 'No se pudieron cargar los usuarios.';
        }
      );
    }
  }

  eliminarUsuario(usuarioId: number | undefined): void {
    if (!usuarioId) {
      console.error('El ID del usuario es inválido.');
      return;
    }

    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuarioService.eliminarUsuario(usuarioId).subscribe(
        (response) => {
          console.log('Usuario eliminado:', response);
          this.cargarUsuarios(); // Recargar lista de usuarios
        },
        (error) => {
          console.error('Error al eliminar usuario:', error);
          this.errorMessage = 'No se pudo eliminar el usuario.';
        }
      );
    }
  }

  editarUsuario(usuario: Usuario): void {
    console.log('Usuario seleccionado para editar:', usuario); // Verificar contenido
    this.usuarioEditando = { ...usuario }; // Clonar usuario para edición
    this.editando = true;
  }
  

  guardarEdicion(): void {
    if (!this.usuarioEditando) {
      console.error('No hay usuario seleccionado para editar.');
      return;
    }

    this.usuarioService.editarUsuario(this.usuarioEditando).subscribe(
      (response) => {
        console.log('Usuario actualizado:', response);
        this.cargarUsuarios(); // Recargar lista de usuarios
        this.cancelarEdicion(); // Salir del modo edición
      },
      (error) => {
        console.error('Error al editar usuario:', error);
        this.errorMessage = 'No se pudo actualizar el usuario.';
      }
    );
  }

  cancelarEdicion(): void {
    this.usuarioEditando = this.obtenerNuevoUsuario(); // Reiniciar objeto de edición
    this.editando = false;
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
    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.esPaciente = true;
      this.esTerapeuta = false;
      this.nuevoUsuario.tipo_usuario = 'paciente';
      return;
    }

    const isChecked = (event.target as HTMLInputElement).checked;

    if (tipo === 'paciente') {
      this.esPaciente = isChecked;
      this.esTerapeuta = false;
    } else if (tipo === 'terapeuta') {
      this.esTerapeuta = isChecked;
      this.esPaciente = false;
    }

    if (this.esPaciente) {
      this.nuevoUsuario.tipo_usuario = 'paciente';
    } else if (this.esTerapeuta) {
      this.nuevoUsuario.tipo_usuario = 'terapeuta';
    } else {
      this.nuevoUsuario.tipo_usuario = '';
    }
  }

  registrarUsuario(): void {
    this.errorMessage = '';

    if (!this.nuevoUsuario.tipo_usuario || !this.nuevoUsuario.rut || !this.nuevoUsuario.nombre ||
      !this.nuevoUsuario.apellidos || !this.nuevoUsuario.email || !this.nuevoUsuario.password) {
      this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
      return;
    }

    if (this.nuevoUsuario.tipo_usuario === 'paciente') {
      if (!this.nuevoUsuario.fecha_nacimiento || !this.nuevoUsuario.telefono || !this.nuevoUsuario.direccion || !this.nuevoUsuario.patologia) {
        this.errorMessage = 'Por favor, completa todos los campos obligatorios del paciente.';
        return;
      }

      if (this.terapeutaId) {
        this.nuevoUsuario.terapeuta_id = this.terapeutaId;
      } else {
        this.errorMessage = 'No se pudo identificar al terapeuta que está creando al paciente.';
        return;
      }
    }

    if (this.nuevoUsuario.tipo_usuario === 'terapeuta') {
      if (!this.nuevoUsuario.especialidad) {
        this.errorMessage = 'Por favor, ingresa la especialidad del terapeuta.';
        return;
      }
    }

    this.usuarioService.registrarUsuario(this.nuevoUsuario).subscribe(
      (response) => {
        if (response.success) {
          console.log('Usuario registrado:', response);
          this.errorMessage = '';
          this.resetFormulario();
          this.cargarUsuarios();
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
    this.nuevoUsuario = this.obtenerNuevoUsuario();
    this.esPaciente = false;
    this.esTerapeuta = false;
    this.errorMessage = '';
  }
}
