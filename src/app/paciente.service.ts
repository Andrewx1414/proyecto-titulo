import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Cita {
  id: number;
  paciente_id: number;
  fecha: string;
  descripcion: string;
  ejercicios: { id: number; nombre: string; video_url: string }[]; // Cambiar ejercicio_id a ejercicios[]
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

interface RespuestaEncuesta {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrlCitas = 'http://54.215.133.125:3000/api/citas'; // Endpoint para citas
  private apiUrlEjercicio = 'http://54.215.133.125:3000/api/ejercicio'; // Endpoint para ejercicios
  private apiUrlEncuestas = 'http://54.215.133.125:3000/api/encuestas'; // Endpoint para encuestas

  constructor(private http: HttpClient) {}

  // Obtener citas para un mes específico para un paciente
  obtenerCitasPorMes(pacienteId: number, year: number, month: number): Observable<RespuestaCitas> {
    return this.http.get<RespuestaCitas>(`${this.apiUrlCitas}?paciente_id=${pacienteId}&year=${year}&month=${month}`)
      .pipe(
        catchError(this.manejarError)
      );
  }

  // Obtener información de un ejercicio específico
  obtenerEjercicio(id: number): Observable<RespuestaEjercicio> {
    return this.http.get<RespuestaEjercicio>(`${this.apiUrlEjercicio}/${id}`)
      .pipe(
        catchError(this.manejarError)
      );
  }

  // Guardar una encuesta en el servidor
// Guardar una o múltiples encuestas en el servidor
guardarEncuesta(encuestas: {
  paciente_id: number;
  ejercicio_id: number;
  dificultad: number;
  dolor: number;
  satisfaccion: number;
  comentario: string;
}[]): Observable<RespuestaEncuesta> {
  return this.http.post<RespuestaEncuesta>(this.apiUrlEncuestas, encuestas)
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
