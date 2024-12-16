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
  terapeutas: Usuario[] = []; // Lista de terapeutas
  nuevoUsuario: Usuario = this.obtenerNuevoUsuario();
  editando: boolean = false;
  esPaciente: boolean = false;
  esTerapeuta: boolean = false;
  errorMessage: string = '';
  terapeutaId: number | null = null;
  tipoUsuarioLogueado: string = '';
  enProceso: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const usuarioLogueado = this.authService.getUsuario();
    if (!usuarioLogueado?.id) {
      this.errorMessage = '❌ No se pudo obtener la información del usuario logueado.';
      return;
    }
    
    this.terapeutaId = usuarioLogueado.id;
    this.validarTipoUsuario();
    this.cargarTerapeutas(); // Cargar lista de terapeutas al inicializar
  }

  cargarTerapeutas(): void {
    this.usuarioService.obtenerUsuarios().subscribe(
      (response) => {
        this.terapeutas = response.usuarios.filter(
          (usuario: Usuario) => usuario.tipo_usuario === 'terapeuta'
        );
      },
      (error) => {
        this.errorMessage = '❌ No se pudo cargar la lista de terapeutas.';
      }
    );
  }

  validarTipoUsuario(): void {
    this.usuarioService.validarTipoUsuario(this.terapeutaId!).subscribe(
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
      this.nuevoUsuario.terapeuta_id = this.terapeutaId; // Asignar terapeuta automáticamente
    } 
    if (this.terapeutaId !== null && this.terapeutaId !== undefined) {
      this.cargarUsuarios();
    }
  }

  cargarUsuarios(): void {
    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.usuarioService.obtenerPacientesPorTerapeuta(this.terapeutaId!).subscribe(
        (response) => {
          this.usuarios = response.pacientes;
        },
        () => {
          this.errorMessage = '❌ No se pudieron cargar los pacientes asociados al terapeuta.';
        }
      );
    } else {
      this.usuarioService.obtenerUsuarios().subscribe(
        (response) => {
          this.usuarios = response.usuarios;
        },
        () => {
          this.errorMessage = '❌ No se pudieron cargar los usuarios.';
        }
      );
    }
  }

  registrarUsuario(): void {
    this.errorMessage = '';
    this.enProceso = true;

    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.nuevoUsuario.terapeuta_id = this.terapeutaId; // Asignar terapeuta automáticamente
      this.nuevoUsuario.tipo_usuario = 'paciente'; // Los terapeutas solo pueden crear pacientes
    }

    this.usuarioService.registrarUsuario(this.nuevoUsuario).subscribe(
      () => {
        this.resetFormulario();
        this.cargarUsuarios();
        this.enProceso = false;
      },
      (error) => {
        this.errorMessage = error?.error?.message || 'Error al registrar el usuario.';
        this.enProceso = false;
      }
    );
  }

  editarUsuario(usuario: Usuario): void {
    this.nuevoUsuario = { ...usuario };
    this.esPaciente = usuario.tipo_usuario === 'paciente';
    this.nuevoUsuario.terapeuta_id = usuario.terapeuta_id || null;
    this.editando = true;
  }

  guardarEdicion(): void {
    if (!this.nuevoUsuario.id) {
      console.error('⚠️ No hay usuario seleccionado para editar.');
      return;
    }
    this.usuarioService.editarUsuario(this.nuevoUsuario).subscribe(
      (response) => {
        this.cargarUsuarios();
        this.cancelarEdicion();
      },
      (error) => {
        this.errorMessage = 'Error al guardar los cambios.';
      }
    );
  }

  eliminarUsuario(usuarioId: number | undefined): void {
    if (!usuarioId) {
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

  cancelarEdicion(): void {
    this.resetFormulario();
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
      terapeuta_id: null,
    };
  }

  resetFormulario(): void {
    this.nuevoUsuario = this.obtenerNuevoUsuario();
    this.esPaciente = false;
    this.esTerapeuta = false;
    this.errorMessage = '';
    this.enProceso = false;
    if (this.tipoUsuarioLogueado === 'terapeuta') {
      this.nuevoUsuario.tipo_usuario = 'paciente';
      this.nuevoUsuario.terapeuta_id = this.terapeutaId;
    }
  }

  onCheckboxChange(tipo: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (tipo === 'paciente') {
      this.esPaciente = isChecked;
      this.esTerapeuta = !isChecked;
    } else if (tipo === 'terapeuta') {
      this.esTerapeuta = isChecked;
      this.esPaciente = !isChecked;
    }
    if (this.esPaciente) {
      this.nuevoUsuario.tipo_usuario = 'paciente';
    } else if (this.esTerapeuta) {
      this.nuevoUsuario.tipo_usuario = 'terapeuta';
    } else {
      this.nuevoUsuario.tipo_usuario = '';
    }
  }

  asignarTerapeuta(terapeuta: Usuario): void {
    if (this.nuevoUsuario) {
      this.nuevoUsuario.terapeuta_id = terapeuta.id!;
      console.log('🧾 Terapeuta asignado:', terapeuta);
    }
  }
}
