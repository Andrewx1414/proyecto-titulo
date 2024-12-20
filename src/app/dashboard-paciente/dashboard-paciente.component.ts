import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
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
  ejercicios: { id: number; nombre: string; video_url: string }[];
}

interface Dia {
  dia: number;
  tieneCita: boolean;
  ejercicios: any[];
  bloqueado: boolean;
  tiempoRestante: number;
}

@Component({
  selector: 'app-dashboard-paciente',
  templateUrl: './dashboard-paciente.component.html',
  styleUrls: ['./dashboard-paciente.component.css']
})
export class DashboardPacienteComponent implements OnInit, OnDestroy {
  pacienteNombre: string = '';
  pacienteId: number | null = null;
  mesActual: Date = new Date();
  diasDelMes: Dia[] = [];
  mostrarCalendario: boolean = true;
  mostrarModal: boolean = false;
  mostrarModalEjercicio: boolean = false;
  mostrarModalEncuesta: boolean = false;
  mesTexto: string = '';
  diaSeleccionado: number | null = null;
  ejerciciosDelDia: any[] = [];
  ejercicioSeleccionado: any = null;
  videoSeguro: SafeResourceUrl | null = null;
  tiempoRestante: number = 3600; // En segundos
  cuentaRegresiva: any = null;
  encuesta = { dificultad: 1, dolor: 1, satisfaccion: 1, comentario: '' };

  constructor(
    private router: Router,
    private authService: AuthService,
    private pacienteService: PacienteService,
    public sanitizer: DomSanitizer,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
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
    } else {
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
      ejercicios: [],
      bloqueado: false,
      tiempoRestante: 3600 // Inicialmente 60 minutos para cada día con cita
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
                diaConCita.ejercicios = cita.ejercicios;
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

  abrirModal(dia: Dia): void {
    if (dia.bloqueado) {
      alert('Este día ya está bloqueado. No puedes volver a entrar.');
      return;
    }

    if (dia.tieneCita) {
      this.diaSeleccionado = dia.dia;
      this.ejerciciosDelDia = dia.ejercicios || [];
      this.tiempoRestante = dia.tiempoRestante;
      this.iniciarCuentaRegresiva(dia);
      this.mostrarModal = true;
    }
  }

  cerrarModal(): void {
    const diaActual = this.diasDelMes.find(d => d.dia === this.diaSeleccionado);
    if (diaActual) {
      if (this.tiempoRestante === 0) {
        diaActual.bloqueado = true; // Bloquear el día si el tiempo se agotó
      }
      diaActual.tiempoRestante = this.tiempoRestante; // Guardar el tiempo restante
    }

    this.mostrarModal = false;
    this.diaSeleccionado = null;
    this.ejerciciosDelDia = [];
    clearInterval(this.cuentaRegresiva);
  }

  abrirModalEjercicio(ejercicio: any): void {
    const videoId = ejercicio.video_url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      this.videoSeguro = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    this.ejercicioSeleccionado = ejercicio;
    this.mostrarModalEjercicio = true;
  }

  cerrarModalEjercicio(): void {
    this.mostrarModalEjercicio = false;
    this.ejercicioSeleccionado = null;
    this.videoSeguro = null;
  }

  iniciarCuentaRegresiva(dia: Dia): void {
    clearInterval(this.cuentaRegresiva);

    this.cuentaRegresiva = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
        dia.tiempoRestante = this.tiempoRestante;
        this.zone.run(() => {
          this.cdr.detectChanges();
        });
      } else {
        clearInterval(this.cuentaRegresiva);
        this.tiempoRestante = 0;
        dia.bloqueado = true;
        this.cerrarModal();
      }
    }, 1000);
  }

  get tiempoRestanteMilisegundos(): number {
    return this.tiempoRestante * 1000;
  }

  ngOnDestroy(): void {
    clearInterval(this.cuentaRegresiva);
  }

  // Métodos faltantes
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  anteriorMes(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    this.actualizarMes();
  }

  siguienteMes(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    this.actualizarMes();
  }

  abrirEncuesta(): void {
    this.mostrarModalEncuesta = true;
  }

  cerrarModalEncuesta(): void {
    this.mostrarModalEncuesta = false;
    this.encuesta = { dificultad: 1, dolor: 1, satisfaccion: 1, comentario: '' };
  }

  guardarEncuesta(): void {
    if (this.pacienteId && this.ejercicioSeleccionado?.id) {
      const datosEncuesta = {
        paciente_id: this.pacienteId,
        ejercicio_id: this.ejercicioSeleccionado.id,
        ...this.encuesta
      };

      this.pacienteService.guardarEncuesta(datosEncuesta).subscribe(
        (respuesta: { success: boolean; message: string }) => {
          if (respuesta.success) {
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
