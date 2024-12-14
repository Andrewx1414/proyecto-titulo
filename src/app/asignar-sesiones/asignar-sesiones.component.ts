import { Component, OnInit } from '@angular/core';
import { SesionesService } from '../sesiones.service';
import { AuthService } from '../auth.service';

interface Sesion {
  id?: number; // ID de la sesión
  paciente_id: number;
  terapeuta_id: number;
  fecha: string;
  descripcion: string;
  ejercicio_id: number;
}

interface Ejercicio {
  id: number;
  nombre: string;
  descripcion: string;
  video_url: string;
}

@Component({
  selector: 'app-asignar-sesiones',
  templateUrl: './asignar-sesiones.component.html',
  styleUrls: ['./asignar-sesiones.component.css']
})
export class AsignarSesionesComponent implements OnInit {
  pacientes: any[] = [];
  pacientesFiltrados: any[] = [];
  ejercicios: Ejercicio[] = [];
  sesionesAsignadas: Sesion[] = [];
  terapeutaId: number | null = null;
  pacienteSeleccionado: any = null;
  nuevaSesion: Sesion = this.obtenerNuevaSesion();
  sesionEditando: Sesion | null = null;
  errorMessage: string = '';
  filtro: string = '';

  constructor(private sesionesService: SesionesService, private authService: AuthService) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    console.log('👤 Usuario obtenido en ngOnInit:', usuario); 
    
    if (usuario && usuario.tipo_usuario === 'terapeuta' && usuario.id) {
      console.log('✅ Se cumple la condición del IF, tipo_usuario:', usuario.tipo_usuario, 'ID:', usuario.id);
      this.terapeutaId = usuario.id;
      console.log('🆔 Terapeuta ID asignado correctamente:', this.terapeutaId);
      
      // Asegurarse de que se llame a obtenerPacientes solo si terapeutaId tiene valor
      if (this.terapeutaId !== null && this.terapeutaId !== undefined) {
        console.log('📢 Llamando a obtenerPacientes con terapeutaId:', this.terapeutaId);
        this.obtenerPacientes();
      } else {
        console.warn('⚠️ Terapeuta ID es nulo o indefinido. No se llamará a obtenerPacientes.');
      }
  
      this.obtenerEjercicios();
      this.obtenerSesionesAsignadas();
    } else {
      this.errorMessage = '❌ No se pudo obtener el terapeuta autenticado.';
      console.error(this.errorMessage, { usuario });
    }
  }
  
  

  obtenerPacientes(): void {
  if (this.terapeutaId !== null && this.terapeutaId !== undefined) {
    const url = `http://localhost:3000/api/pacientes/${this.terapeutaId}`;
    console.log('🌐 URL generada para obtenerPacientes:', url); // 👀 Verificar la URL generada
    this.sesionesService.obtenerPacientesPorTerapeuta(this.terapeutaId)
      .subscribe(
        (response) => {
          console.log('📋 Respuesta de pacientes:', response); // 👀 Verificar la respuesta
          this.pacientes = response.pacientes.map((paciente: any) => ({
            ...paciente,
            patologia: paciente.patologia,
          }));
          this.pacientesFiltrados = [...this.pacientes];
        },
        (error) => {
          console.error('❌ Error al obtener la lista de pacientes:', error); 
          this.errorMessage = 'Error al obtener la lista de pacientes.';
        }
      );
  } else {
    console.warn('⚠️ No se puede obtener la lista de pacientes. Terapeuta ID es nulo o indefinido.');
  }
}

  
  obtenerEjercicios(): void {
    this.sesionesService.obtenerEjercicios()
      .subscribe(
        (response) => {
          this.ejercicios = response.ejercicios;
        },
        (error) => {
          this.errorMessage = 'Error al obtener la lista de ejercicios.';
        }
      );
  }

  obtenerSesionesAsignadas(): void {
    if (this.terapeutaId !== null) {
      this.sesionesService.obtenerSesionesPorTerapeuta(this.terapeutaId)
        .subscribe(
          (response) => {
            this.sesionesAsignadas = response.sesiones;
            console.log('Sesiones asignadas:', this.sesionesAsignadas);
          },
          (error) => {
            console.error('Error al obtener las sesiones asignadas:', error);
            this.errorMessage = 'Error al obtener las sesiones asignadas.';
          }
        );
    }
  }
  

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.nuevaSesion = this.obtenerNuevaSesion();
  }

  obtenerNuevaSesion(): Sesion {
    return {
      paciente_id: 0,
      terapeuta_id: this.terapeutaId!,
      fecha: '',
      descripcion: '',
      ejercicio_id: 0,
    };
  }

  asignarSesion(): void {
    if (!this.pacienteSeleccionado) {
      this.errorMessage = 'Por favor, seleccione un paciente.';
      return;
    }

    if (!this.nuevaSesion.fecha || !this.nuevaSesion.descripcion || !this.nuevaSesion.ejercicio_id) {
      this.errorMessage = 'Por favor, complete todos los campos de la sesión.';
      return;
    }

    const sesionAsignada = {
      ...this.nuevaSesion,
      paciente_id: this.pacienteSeleccionado.id,
    };

    this.sesionesService.asignarSesion(sesionAsignada)
      .subscribe(
        (response) => {
          this.obtenerSesionesAsignadas();
          this.nuevaSesion = this.obtenerNuevaSesion();
          this.errorMessage = '';
        },
        (error) => {
          this.errorMessage = 'Error al asignar la sesión.';
        }
      );
  }

  editarSesion(sesion: Sesion): void {
    this.sesionEditando = { ...sesion };
  }

  guardarEdicion(): void {
    if (!this.sesionEditando || !this.sesionEditando.id) {
      this.errorMessage = 'No se puede editar la sesión: falta el ID.';
      return;
    }

    this.sesionesService.editarSesion(this.sesionEditando.id, this.sesionEditando)
      .subscribe(
        (response) => {
          this.obtenerSesionesAsignadas();
          this.sesionEditando = null;
        },
        (error) => {
          this.errorMessage = 'Error al actualizar la sesión.';
        }
      );
  }

  eliminarSesion(sesionId: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta sesión?')) {
      this.sesionesService.eliminarSesion(sesionId)
        .subscribe(
          (response) => {
            this.obtenerSesionesAsignadas();
          },
          (error) => {
            this.errorMessage = 'Error al eliminar la sesión.';
          }
        );
    }
  }

  filtrarPacientes(): void {
    const filtroLower = this.filtro.toLowerCase();
    this.pacientesFiltrados = this.pacientes.filter((paciente) =>
      paciente.rut.toLowerCase().includes(filtroLower) ||
      paciente.nombre.toLowerCase().includes(filtroLower) ||
      paciente.apellidos.toLowerCase().includes(filtroLower) ||
      paciente.email.toLowerCase().includes(filtroLower) ||
      (paciente.patologia && paciente.patologia.toLowerCase().includes(filtroLower))
    );
  }
}
