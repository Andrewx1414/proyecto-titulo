import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { PacienteService } from '../paciente.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { formatDate } from '@angular/common';

interface Cita {
  id: number;
  paciente_id: number;
  fecha: string;
  descripcion: string;
  ejercicio_id: number | null;
}

@Component({
  selector: 'app-dashboard-paciente',
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.css']
})
export class DashboardPacienteComponent implements OnInit {
  pacienteNombre: string = '';
  pacienteId: number | null = null;
  mesActual: Date = new Date();
  diasDelMes: { dia: number, tieneCita: boolean, ejercicioId?: number | null }[] = [];
  mostrarCalendario: boolean = true;
  mostrarModal: boolean = false;
  mostrarModalEncuesta: boolean = false; // Nuevo modal para la encuesta
  mesTexto: string = '';
  diaSeleccionado: number | null = null;
  ejercicioInfo: any = null;
  videoUrl: SafeResourceUrl | null = null; // Para manejar URLs seguras
  encuesta: { dificultad: number; dolor: number; satisfaccion: number; comentario: string } = {
    dificultad: 1,
    dolor: 1,
    satisfaccion: 1,
    comentario: ''
  }; // Modelo de datos para la encuesta
  haIntentadoRedireccionar: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private pacienteService: PacienteService,
    public sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.verificarAutenticacion();
  }

  verificarAutenticacion(): void {
    const usuario = this.authService.getUsuario();
    if (usuario && usuario.tipo_usuario === 'paciente') {
      this.pacienteNombre = usuario.nombre;
      this.pacienteId = usuario.id;
      this.actualizarMes();
    } else if (!this.haIntentadoRedireccionar) {
      this.haIntentadoRedireccionar = true;
      console.log("Usuario no autenticado o no es paciente. Redirigiendo al login...");
      this.router.navigate(['/login']);
    }
  }

  actualizarMes(): void {
    this.mesTexto = formatDate(this.mesActual, 'MMMM y', 'es-ES');
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    this.diasDelMes = Array.from({ length: daysInMonth }, (_, i) => ({
      dia: i + 1,
      tieneCita: false,
      ejercicioId: null
    }));

    if (this.pacienteId) {
      this.pacienteService.obtenerCitasPorMes(this.pacienteId, year, month).subscribe(
        (respuesta: { success: boolean; citas: Cita[] }) => {
          if (respuesta.success && respuesta.citas.length > 0) {
            respuesta.citas.forEach((cita: Cita) => {
              const fechaCita = new Date(cita.fecha);
              const dia = fechaCita.getUTCDate();
              const diaConCita = this.diasDelMes.find(d => d.dia === dia);
              if (diaConCita) {
                diaConCita.tieneCita = true;
                diaConCita.ejercicioId = cita.ejercicio_id;
              }
            });
          }
        },
        (error: any) => {
          console.error('Error al obtener citas:', error);
        }
      );
    }
  }

  anteriorMes(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.actualizarMes();
  }

  siguienteMes(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.actualizarMes();
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  abrirModal(dia: { dia: number, tieneCita: boolean, ejercicioId?: number | null }): void {
    if (dia.tieneCita && dia.ejercicioId !== null && dia.ejercicioId !== undefined) {
      console.log(`Obteniendo información del ejercicio con ID: ${dia.ejercicioId}`);
      this.diaSeleccionado = dia.dia;

      this.pacienteService.obtenerEjercicio(dia.ejercicioId).subscribe(
        (respuesta: { success: boolean; ejercicio: any }) => {
          if (respuesta.success) {
            console.log('Información del ejercicio obtenida:', respuesta.ejercicio);
            this.ejercicioInfo = respuesta.ejercicio;
            this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.ejercicioInfo.video_url);
          } else {
            console.warn('No se encontró información del ejercicio');
            this.ejercicioInfo = { mensaje: "Ejercicio no encontrado." };
            this.videoUrl = null;
          }
          this.mostrarModal = true;
        },
        (error: any) => {
          console.error('Error al obtener información del ejercicio:', error);
          this.ejercicioInfo = { mensaje: "Error al obtener el ejercicio." };
          this.videoUrl = null;
          this.mostrarModal = true;
        }
      );
    } else {
      console.error('Ejercicio ID inválido o no asignado');
      this.ejercicioInfo = { mensaje: "Ejercicio ID inválido." };
      this.videoUrl = null;
      this.mostrarModal = true;
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.diaSeleccionado = null;
    this.ejercicioInfo = null;
    this.videoUrl = null;
  }

  abrirEncuesta(): void {
    console.log('Abriendo modal de encuesta...');
    this.mostrarModalEncuesta = true;
  }

  cerrarModalEncuesta(): void {
    console.log('Cerrando modal de encuesta...');
    this.mostrarModalEncuesta = false;
    this.encuesta = { dificultad: 1, dolor: 1, satisfaccion: 1, comentario: '' }; // Reiniciar modelo
  }

  guardarEncuesta(): void {
    console.log('Guardando encuesta:', this.encuesta);

    if (this.pacienteId && this.ejercicioInfo?.id) {
      const datosEncuesta = {
        paciente_id: this.pacienteId,
        ejercicio_id: this.ejercicioInfo.id,
        ...this.encuesta
      };

      this.pacienteService.guardarEncuesta(datosEncuesta).subscribe(
        (respuesta: { success: boolean; message: string }) => {
          if (respuesta.success) {
            console.log('Encuesta guardada con éxito:', respuesta.message);
            this.cerrarModalEncuesta();
          } else {
            console.error('Error al guardar la encuesta:', respuesta.message);
          }
        },
        (error: any) => {
          console.error('Error en el servidor al guardar la encuesta:', error);
        }
      );
    } else {
      console.error('Datos insuficientes para guardar la encuesta.');
    }
  }
}
