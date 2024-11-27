import { Component } from '@angular/core';
import { EjerciciosService } from '../ejercicios.service';

interface Ejercicio {
  nombre: string;
  descripcion: string;
  video_url: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  ejercicio?: any; // Cambiar según el esquema del backend si es necesario
}

@Component({
  selector: 'app-subir-videos',
  templateUrl: './subir-videos.component.html',
  styleUrls: ['./subir-videos.component.css']
})
export class SubirVideosComponent {
  nuevoEjercicio: Ejercicio = {
    nombre: '',
    descripcion: '',
    video_url: ''
  };
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private ejerciciosService: EjerciciosService) {}

  subirVideo(): void {
    this.errorMessage = ''; // Limpiar mensajes previos
    this.successMessage = '';

    // Validar que todos los campos estén completos
    if (!this.nuevoEjercicio.nombre || !this.nuevoEjercicio.descripcion || !this.nuevoEjercicio.video_url) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    // Llamar al servicio para realizar el INSERT
    this.ejerciciosService.subirEjercicio(this.nuevoEjercicio).subscribe(
      (response: ApiResponse) => {
        if (response.success) {
          console.log('Ejercicio creado:', response.ejercicio);
          this.successMessage = 'Ejercicio subido correctamente.';
          this.resetFormulario();
        } else {
          this.errorMessage = response.message || 'No se pudo subir el ejercicio.';
        }
      },
      (error: any) => {
        console.error('Error al subir ejercicio:', error);
        this.errorMessage = 'No se pudo subir el ejercicio. Intenta nuevamente.';
      }
    );
  }

  resetFormulario(): void {
    this.nuevoEjercicio = {
      nombre: '',
      descripcion: '',
      video_url: ''
    };
  }
}
