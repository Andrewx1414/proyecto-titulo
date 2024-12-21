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
  tiempoRestante: number = 3600; // 1 hora en segundos
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
      tiempoRestante: 3600
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
      this.tiempoRestante = dia.tiempoRestante; // Recuperar el tiempo restante correctamente
      console.log('Tiempo restante al abrir el modal:', this.tiempoRestante); // Verificar valor inicial
      this.iniciarCuentaRegresiva(dia);
      this.mostrarModal = true;
    }
  }
  

  cerrarModal(): void {
    const diaActual = this.diasDelMes.find(d => d.dia === this.diaSeleccionado);
    if (diaActual) {
      if (this.tiempoRestante === 0) {
        diaActual.bloqueado = true; // Bloquear el día si el tiempo llegó a 0
      }
      diaActual.tiempoRestante = this.tiempoRestante; // Guardar el tiempo restante
      console.log('Tiempo restante guardado al cerrar:', diaActual.tiempoRestante); // Verificar valor guardado
    }
  
    this.mostrarModal = false;
    this.diaSeleccionado = null;
    this.ejerciciosDelDia = [];
    clearInterval(this.cuentaRegresiva); // Detener el intervalo
  }
  

  iniciarCuentaRegresiva(dia: Dia): void {
    if (this.cuentaRegresiva) {
      clearInterval(this.cuentaRegresiva);
    }
  
    this.cuentaRegresiva = setInterval(() => {
      if (this.tiempoRestante > 0) {
        this.tiempoRestante--;
        dia.tiempoRestante = this.tiempoRestante;
  
        // Forzar la actualización de Angular
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

  abrirEncuesta(): void {
    this.mostrarModalEncuesta = true;
  }

  cerrarModalEncuesta(): void {
    this.mostrarModalEncuesta = false;
    this.encuesta = { dificultad: 1, dolor: 1, satisfaccion: 1, comentario: '' };
  }

  guardarEncuesta(): void {
    console.log('pacienteId:', this.pacienteId);
    console.log('ejerciciosSeleccionados:', this.ejerciciosDelDia);
  
    // Validar que pacienteId no sea null
    if (this.pacienteId === null || !this.ejerciciosDelDia || this.ejerciciosDelDia.length === 0) {
      console.error('Paciente o ejercicios no definidos.');
      return;
    }
  
    if (
      this.encuesta.dificultad === undefined ||
      this.encuesta.dolor === undefined ||
      this.encuesta.satisfaccion === undefined
    ) {
      console.error('Campos de la encuesta incompletos:', this.encuesta);
      return;
    }
  
    // Crear el arreglo de encuestas
    const encuestas = this.ejerciciosDelDia.map((ejercicio: any) => ({
      paciente_id: this.pacienteId as number, // Forzar que paciente_id sea de tipo number
      ejercicio_id: ejercicio.id as number, // Garantizar que ejercicio_id sea un número
      dificultad: this.encuesta.dificultad,
      dolor: this.encuesta.dolor,
      satisfaccion: this.encuesta.satisfaccion,
      comentario: this.encuesta.comentario,
    }));
  
    console.log('Datos enviados a la API:', encuestas);
  
    this.pacienteService.guardarEncuesta(encuestas).subscribe(
      (respuesta: { success: boolean; message: string }) => {
        if (respuesta.success) {
          console.log('Encuestas guardadas correctamente:', respuesta);
          this.cerrarModalEncuesta();
        } else {
          console.error('Error al guardar las encuestas:', respuesta.message);
        }
      },
      (error: any) => {
        console.error('Error en el servidor al guardar las encuestas:', error);
      }
    );
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

  formatTiempoRestante(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;
    return `${this.pad(horas)}:${this.pad(minutos)}:${this.pad(segundosRestantes)}`;
  }
  
  private pad(valor: number): string {
    return valor < 10 ? `0${valor}` : `${valor}`;
  }
  

  ngOnDestroy(): void {
    clearInterval(this.cuentaRegresiva);
  }
}
