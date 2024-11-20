import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Cita {
  id: number;
  paciente_id: number;
  fecha: string;
  descripcion: string;
  ejercicio_id: number | null;
}

interface RespuestaCitas {
  success: boolean;
  citas: Cita[];
}

interface RespuestaEjercicio {
  success: boolean;
  ejercicio: {
    id: number;
    nombre: string;
    descripcion: string;
    video_url: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrlCitas = 'http://localhost:3000/api/citas'; // Endpoint para citas
  private apiUrlEjercicio = 'http://localhost:3000/api/ejercicio'; // Endpoint actualizado para ejercicios

  constructor(private http: HttpClient) {}

  // Obtener citas para un mes específico para un paciente
  obtenerCitasPorMes(pacienteId: number, year: number, month: number): Observable<RespuestaCitas> {
    return this.http.get<RespuestaCitas>(`${this.apiUrlCitas}?paciente_id=${pacienteId}&year=${year}&month=${month}`)
      .pipe(
        catchError(this.manejarError)
      );
  }

  obtenerEjercicio(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrlEjercicio}/${id}`)
      .pipe(
        catchError(this.manejarError)
      );
  }
  


  // Método privado para manejar errores
  private manejarError(error: HttpErrorResponse): Observable<never> {
    console.error('Ocurrió un error al comunicarse con el servidor:', error);
    return throwError('Error al comunicarse con el servidor. Por favor, intente más tarde.');
  }
}
