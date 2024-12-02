import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../usuario.service';
import { AuthService } from '../auth.service';

interface Usuario {
  id?: number;
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
  terapeuta_id?: number | null;
  patologia?: string;
}

@Component({
  selector: 'app-mantenedor-usuarios',
  templateUrl: './mantenedor-usuarios.component.html',
  styleUrls: ['./mantenedor-usuarios.component.css'],
})
export class MantenedorUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  nuevoUsuario: Usuario = this.obtenerNuevoUsuario();
  usuarioEditando: Usuario = this.obtenerNuevoUsuario();
  editando: boolean = false;
  esPaciente: boolean = false;
  esTerapeuta: boolean = false;
  errorMessage: string = '';
  terapeutaId: number | null = null;
  tipoUsuarioLogueado: string = '';
  enProceso: boolean = false; // Nueva propiedad para manejar el estado de espera

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.validarTipoUsuario();
  }

  validarTipoUsuario(): void {
    const usuarioLogueado = this.authService.getUsuario();
    if (!usuarioLogueado?.id) {
      this.errorMessage = 'No se pudo obtener la información del usuario logueado.';
      return;
    }

    this.usuarioService.validarTipoUsuario(usuarioLogueado.id).subscribe(
      (response) => {
        if (response.success) {
          this.tipoUsuarioLogueado = response.tipo_usuario;
          this.configurarPermisos();
        } else {
          this.errorMessage = response.message || 'No se pudo determinar el tipo de usuario.';
        }
      },
      (error) => {
        this.errorMessage = error?.error?.message || 'Error al validar el tipo de usuario.';
      }
    );
  }

  configurarPermisos(): void {
    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.esPaciente = true;
      this.nuevoUsuario.tipo_usuario = 'paciente';
    } else if (this.tipoUsuarioLogueado === 'admin') {
      this.esPaciente = false;
      this.esTerapeuta = false;
    }

    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.usuarioService.obtenerPacientesPorTerapeuta(this.terapeutaId!).subscribe(
        (response) => {
          this.usuarios = response.pacientes;
        },
        () => {
          this.errorMessage = 'No se pudieron cargar los pacientes.';
        }
      );
    } else {
      this.usuarioService.obtenerUsuarios().subscribe(
        (response) => {
          this.usuarios = response.usuarios;
        },
        () => {
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
        () => {
          this.cargarUsuarios();
        },
        () => {
          this.errorMessage = 'No se pudo eliminar el usuario.';
        }
      );
    }
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioEditando = { ...usuario };
    this.esPaciente = usuario.tipo_usuario === 'paciente';
    this.esTerapeuta = usuario.tipo_usuario === 'terapeuta';
    this.editando = true;
  }

  guardarEdicion(): void {
    if (!this.usuarioEditando) {
      console.error('No hay usuario seleccionado para editar.');
      return;
    }

    this.usuarioService.editarUsuario(this.usuarioEditando).subscribe(
      () => {
        this.cargarUsuarios();
        this.cancelarEdicion();
      },
      () => {
        this.errorMessage = 'No se pudo actualizar el usuario.';
      }
    );
  }

  cancelarEdicion(): void {
    this.usuarioEditando = this.obtenerNuevoUsuario();
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
    const isChecked = (event.target as HTMLInputElement).checked;

    if (tipo === 'paciente') {
      this.esPaciente = isChecked;
      if (isChecked) this.esTerapeuta = false;
    } else if (tipo === 'terapeuta') {
      this.esTerapeuta = isChecked;
      if (isChecked) this.esPaciente = false;
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
    this.enProceso = true; // Activa el estado de espera

    if (!this.nuevoUsuario.tipo_usuario || !this.nuevoUsuario.rut || !this.nuevoUsuario.nombre ||
        !this.nuevoUsuario.apellidos || !this.nuevoUsuario.email || !this.nuevoUsuario.password) {
      this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
      this.enProceso = false; // Desactiva el estado de espera
      return;
    }

    if (this.nuevoUsuario.tipo_usuario === 'paciente') {
      if (!this.nuevoUsuario.fecha_nacimiento || !this.nuevoUsuario.telefono || !this.nuevoUsuario.direccion || !this.nuevoUsuario.patologia) {
        this.errorMessage = 'Por favor, completa todos los campos obligatorios del paciente.';
        this.enProceso = false; // Desactiva el estado de espera
        return;
      }
      this.nuevoUsuario.terapeuta_id = this.terapeutaId;
    }

    if (this.nuevoUsuario.tipo_usuario === 'terapeuta') {
      if (!this.nuevoUsuario.especialidad) {
        this.errorMessage = 'Por favor, ingresa la especialidad del terapeuta.';
        this.enProceso = false; // Desactiva el estado de espera
        return;
      }
    }

    this.usuarioService.registrarUsuario(this.nuevoUsuario).subscribe(
      () => {
        this.resetFormulario();
        this.cargarUsuarios();
        this.enProceso = false; // Desactiva el estado de espera
      },
      (error) => {
        this.errorMessage = error?.error?.message || 'Error al registrar el usuario.';
        this.enProceso = false; // Desactiva el estado de espera
      }
    );
  }

  resetFormulario(): void {
    this.nuevoUsuario = this.obtenerNuevoUsuario();
    this.esPaciente = false;
    this.esTerapeuta = false;
    this.errorMessage = '';
    this.enProceso = false; // Desactiva el estado de espera
  }
}
