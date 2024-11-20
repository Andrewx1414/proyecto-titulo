import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { PacienteService } from '../paciente.service';
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
  mesTexto: string = '';
  diaSeleccionado: number | null = null;
  ejercicioInfo: any = null;
  haIntentadoRedireccionar: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private pacienteService: PacienteService
  ) {}

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    this.verificarAutenticacion();
  }

  verificarAutenticacion(): void {
    const usuario = this.authService.getUsuario();
    if (usuario && usuario.tipo_usuario === 'paciente') {
      // Si el usuario autenticado es un paciente, cargar su información
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
    // Utiliza formatDate para mostrar el mes en español
    this.mesTexto = formatDate(this.mesActual, 'MMMM y', 'es-ES');

    // Obtener los días del mes actual
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth() + 1; // Los meses en JavaScript van de 0 a 11, por eso se suma 1.

    // Calcular el número de días en el mes
    const daysInMonth = new Date(year, month, 0).getDate();
    this.diasDelMes = Array.from({ length: daysInMonth }, (_, i) => ({
      dia: i + 1,
      tieneCita: false,
      ejercicioId: null
    }));

    // Obtener las citas del mes desde el servicio
    if (this.pacienteId) {
      this.pacienteService.obtenerCitasPorMes(this.pacienteId, year, month).subscribe(
        (respuesta: { success: boolean; citas: Cita[] }) => {
          if (respuesta.success && respuesta.citas.length > 0) {
            respuesta.citas.forEach((cita: Cita) => {
              // Asegúrate de que la fecha sea interpretada correctamente
              const fechaCita = new Date(cita.fecha);
              const dia = fechaCita.getUTCDate(); // Obtener el día del mes de la fecha de la cita

              // Encuentra el objeto correspondiente al día de la cita y actualiza la información
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

      // Obtener información del ejercicio usando el servicio
      this.pacienteService.obtenerEjercicio(dia.ejercicioId).subscribe(
        (respuesta: { success: boolean; ejercicio: any }) => {
          if (respuesta.success) {
            console.log('Información del ejercicio obtenida:', respuesta.ejercicio); // Añadir log aquí
            this.ejercicioInfo = respuesta.ejercicio;
          } else {
            console.warn('No se encontró información del ejercicio');
            this.ejercicioInfo = { mensaje: "Ejercicio no encontrado." };
          }
          this.mostrarModal = true; // Mostrar el modal después de obtener la información
        },
        (error: any) => {
          console.error('Error al obtener información del ejercicio:', error);
          this.ejercicioInfo = { mensaje: "Error al obtener el ejercicio." };
          this.mostrarModal = true;
        }
      );
    } else {
      console.error('Ejercicio ID inválido o no asignado');
      this.ejercicioInfo = { mensaje: "Ejercicio ID inválido." };
      this.mostrarModal = true;
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.diaSeleccionado = null;
    this.ejercicioInfo = null;
  }
}
