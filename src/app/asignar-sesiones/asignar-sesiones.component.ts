import { Component, OnInit } from '@angular/core';
import { SesionesService } from '../sesiones.service';
import { AuthService } from '../auth.service';

interface Sesion {
  id?: number; 
  paciente_id: number;
  terapeuta_id: number;
  fecha: string;
  descripcion: string;
  paciente_nombre: string;
  paciente_apellidos: string;
  ejercicios: number[]; // Usamos IDs de los ejercicios
}

@Component({
  selector: 'app-asignar-sesiones',
  templateUrl: './asignar-sesiones.component.html',
  styleUrls: ['./asignar-sesiones.component.css']
})
export class AsignarSesionesComponent implements OnInit {
  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  ejercicios: any[] = [];
  sesionesAsignadas: Sesion[] = [];
  terapeutaId!: number; 
  pacienteSeleccionado: any = null;
  nuevaSesion: Sesion = this.obtenerNuevaSesion();
  sesionEditando: Sesion | null = null;
  errorMessage: string = '';
  filtro: string = '';
  ejercicioSeleccionado: number | null = null; 
  ejercicioSeleccionadoEdicion: number | null = null; 

  constructor(private sesionesService: SesionesService, private authService: AuthService) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();

    if (usuario && usuario.tipo_usuario === 'terapeuta' && usuario.id) {
      this.terapeutaId = usuario.id;
      this.obtenerEjercicios();
      this.obtenerPacientes();
      this.obtenerSesionesAsignadas();
    } else {
      this.errorMessage = 'No se pudo obtener el terapeuta autenticado.';
    }
  }

  obtenerPacientes(): void {
    this.sesionesService.obtenerPacientesPorTerapeuta(this.terapeutaId).subscribe(
      (response) => {
        this.pacientes = response.pacientes.map((paciente: any) => ({ ...paciente, patologia: paciente.patologia }));
        this.pacientesFiltrados = [...this.pacientes];
      },
      () => {
        this.errorMessage = 'Error al obtener la lista de pacientes.';
      }
    );
  }

  obtenerEjercicios(): void {
    this.sesionesService.obtenerEjercicios().subscribe(
      (response) => {
        this.ejercicios = response.ejercicios;
      },
      () => {
        this.errorMessage = 'Error al obtener la lista de ejercicios.';
      }
    );
  }

  obtenerSesionesAsignadas(): void {
    this.sesionesService.obtenerSesionesPorTerapeuta(this.terapeutaId).subscribe(
      (response) => {
        this.sesionesAsignadas = response.sesiones.map((sesion: any) => ({
          ...sesion,
          ejercicios: sesion.ejercicios.map((ejercicio: any) => {
            // Si ya está en formato de nombre, lo usamos directamente
            if (typeof ejercicio === 'string') {
              return ejercicio; // Retorna directamente el nombre del ejercicio
            }
            // Si es un ID, buscamos el nombre
            const ejercicioEncontrado = this.ejercicios.find(e => e.id === ejercicio);
            return ejercicioEncontrado ? ejercicioEncontrado.nombre : `Ejercicio no encontrado (ID: ${ejercicio})`;
          })
        }));
      },
      (error) => {
        console.error('❌ Error al obtener las sesiones asignadas:', error);
        this.errorMessage = 'Error al obtener las sesiones asignadas.';
      }
    );
  }
  


  

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.nuevaSesion = this.obtenerNuevaSesion();
  }

  obtenerNuevaSesion(): Sesion {
    return {
      paciente_id: 0,
      terapeuta_id: this.terapeutaId, 
      fecha: '',
      descripcion: '',
      paciente_nombre: '',
      paciente_apellidos: '',
      ejercicios: [],
    };
  }

  asignarSesion(): void {
    if (!this.pacienteSeleccionado) {
      this.errorMessage = 'Por favor, seleccione un paciente.';
      return;
    }

    if (!this.nuevaSesion.fecha || !this.nuevaSesion.descripcion || this.nuevaSesion.ejercicios.length < 2) {
      this.errorMessage = 'Por favor, complete todos los campos de la sesión y seleccione al menos 2 ejercicios.';
      return;
    }

    const ejerciciosConvertidos = this.nuevaSesion.ejercicios.map(ej => Number(ej));

    const sesionAsignada = {
      paciente_id: this.pacienteSeleccionado.id,
      terapeuta_id: this.terapeutaId, 
      fecha: this.nuevaSesion.fecha,
      descripcion: this.nuevaSesion.descripcion,
      ejercicios: ejerciciosConvertidos 
    };

    this.sesionesService.asignarSesion(sesionAsignada).subscribe(
      (response) => {
        this.obtenerSesionesAsignadas();
        this.nuevaSesion = this.obtenerNuevaSesion();
      },
      (error) => {
        console.error('❌ Error al asignar la sesión:', error);
        this.errorMessage = 'Error al asignar la sesión.';
      }
    );
  }

  agregarEjercicio(): void {
    if (this.ejercicioSeleccionado && !this.nuevaSesion.ejercicios.includes(Number(this.ejercicioSeleccionado))) {
      this.nuevaSesion.ejercicios.push(Number(this.ejercicioSeleccionado));
      this.ejercicioSeleccionado = null; 
    }
  }

  editarSesion(sesion: Sesion): void {
    this.sesionEditando = { ...sesion };
  }

  guardarEdicion(): void {
    if (!this.sesionEditando || !this.sesionEditando.id) {
      this.errorMessage = 'No se puede editar la sesión: falta el ID.';
      return;
    }

    const ejerciciosConvertidos = this.sesionEditando.ejercicios.map(ej => Number(ej));

    const sesionParaEnviar = {
      ...this.sesionEditando,
      ejercicios: ejerciciosConvertidos
    };

    this.sesionesService.editarSesion(this.sesionEditando.id, sesionParaEnviar).subscribe(
      () => {
        this.obtenerSesionesAsignadas();
        this.sesionEditando = null;
      },
      (error) => {
        console.error('Error al guardar la edición:', error);
        this.errorMessage = 'Error al actualizar la sesión.';
      }
    );
  }

  eliminarSesion(sesionId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
      this.sesionesService.eliminarSesion(sesionId).subscribe(
        () => {
          this.obtenerSesionesAsignadas();
        },
        () => {
          this.errorMessage = 'Error al eliminar la sesión.';
        }
      );
    }
  }

  agregarEjercicioEdicion(): void {
    if (this.ejercicioSeleccionadoEdicion && !this.sesionEditando!.ejercicios.includes(Number(this.ejercicioSeleccionadoEdicion))) {
      this.sesionEditando!.ejercicios.push(Number(this.ejercicioSeleccionadoEdicion));
      this.ejercicioSeleccionadoEdicion = null; 
    }
  }
  

  eliminarEjercicio(ejercicioId: number): void {
    this.nuevaSesion.ejercicios = this.nuevaSesion.ejercicios.filter(id => id !== ejercicioId);
  }

  eliminarEjercicioEdicion(ejercicioId: number): void {
    this.sesionEditando!.ejercicios = this.sesionEditando!.ejercicios.filter(id => id !== ejercicioId);
  }

  obtenerNombrePaciente(pacienteId: number): string {
    const paciente = this.pacientes.find(p => p.id === pacienteId);
    return paciente ? `${paciente.nombre} ${paciente.apellidos}` : 'Paciente no encontrado';
  }

  obtenerNombreEjercicio(ejercicioId: number): string {
    const ejercicio = this.ejercicios.find(ej => ej.id === ejercicioId);
    return ejercicio ? ejercicio.nombre : 'Ejercicio no encontrado';
  }

  filtrarPacientes(): void {
    const filtroLower = this.filtro.toLowerCase();
    this.pacientesFiltrados = this.pacientes.filter((paciente) =>
      paciente.nombre.toLowerCase().includes(filtroLower)
    );
  }
}
