import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  // Método para obtener la lista de pacientes asignados a un terapeuta
  obtenerPacientesPorTerapeuta(terapeutaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pacientes?terapeuta_id=${terapeutaId}`);
  }

  // Método para obtener la lista de ejercicios disponibles
  obtenerEjercicios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ejercicios`);
  }

  // Método para asignar una sesión a un paciente
  asignarSesion(sesion: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar-sesion`, sesion);
  }
}
