import { Component, OnInit } from '@angular/core';
import { SesionesService } from '../sesiones.service';
import { AuthService } from '../auth.service';

interface Sesion {
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
  pacientes: any[] = []; // Lista completa de pacientes
  pacientesFiltrados: any[] = []; // Lista filtrada de pacientes
  ejercicios: Ejercicio[] = [];
  terapeutaId: number | null = null;
  pacienteSeleccionado: any = null;
  nuevaSesion: Sesion = this.obtenerNuevaSesion();
  errorMessage: string = '';
  filtro: string = ''; // Campo para el texto del buscador

  constructor(private sesionesService: SesionesService, private authService: AuthService) {}

  ngOnInit(): void {
    // Obtener el terapeutaId del usuario autenticado
    const usuario = this.authService.getUsuario();
    if (usuario && usuario.tipo_usuario === 'terapeuta') {
      this.terapeutaId = usuario.id; // Asignamos el ID del terapeuta desde el usuario autenticado
      this.obtenerPacientes();
      this.obtenerEjercicios();
    } else {
      this.errorMessage = 'No se pudo obtener el terapeuta autenticado.';
    }
  }

  obtenerPacientes(): void {
    if (this.terapeutaId !== null) {
      this.sesionesService.obtenerPacientesPorTerapeuta(this.terapeutaId)
        .subscribe(
          (response) => {
            this.pacientes = response.pacientes.map((paciente: any) => ({
              ...paciente,
              patologia: paciente.patologia // Asegurarse de que el campo patología esté incluido
            }));
            this.pacientesFiltrados = [...this.pacientes]; // Inicialmente todos los pacientes están filtrados
            console.log('Lista de pacientes con patologías:', this.pacientes);
          },
          (error) => {
            console.error('Error al obtener la lista de pacientes:', error);
            this.errorMessage = 'Error al obtener la lista de pacientes.';
          }
        );
    } else {
      console.error('No se pudo obtener el ID del terapeuta');
      this.errorMessage = 'No se pudo obtener el ID del terapeuta.';
    }
  }

  obtenerEjercicios(): void {
    this.sesionesService.obtenerEjercicios()
      .subscribe(
        (response) => {
          this.ejercicios = response.ejercicios;
          console.log('Lista de ejercicios:', this.ejercicios);
        },
        (error) => {
          console.error('Error al obtener la lista de ejercicios:', error);
          this.errorMessage = 'Error al obtener la lista de ejercicios.';
        }
      );
  }

  seleccionarPaciente(paciente: any): void {
    this.pacienteSeleccionado = paciente;
    this.nuevaSesion = this.obtenerNuevaSesion(); // Reinicia el formulario
    console.log('Paciente seleccionado:', this.pacienteSeleccionado);
  }

  obtenerNuevaSesion(): Sesion {
    return {
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
      paciente_id: this.pacienteSeleccionado.id,
      terapeuta_id: this.terapeutaId,
      fecha: this.nuevaSesion.fecha,
      descripcion: this.nuevaSesion.descripcion,
      ejercicio_id: this.nuevaSesion.ejercicio_id,
    };

    this.sesionesService.asignarSesion(sesionAsignada)
      .subscribe(
        (response) => {
          console.log('Sesión asignada exitosamente:', response);
          this.errorMessage = ''; // Limpia el mensaje de error si el registro es exitoso
          this.pacienteSeleccionado = null; // Deselecciona el paciente después de asignar la sesión
          this.nuevaSesion = this.obtenerNuevaSesion(); // Limpia el formulario después de asignar la sesión
        },
        (error) => {
          console.error('Error al asignar la sesión:', error);
          this.errorMessage = 'Error al asignar la sesión.';
        }
      );
  }

  // Método para filtrar la lista de pacientes
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
