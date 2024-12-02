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

  // Método para obtener la lista de sesiones asignadas a un terapeuta
  obtenerSesionesPorTerapeuta(terapeutaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/sesiones?terapeuta_id=${terapeutaId}`);
  }

  // Método para editar una sesión asignada
  editarSesion(sesionId: number, sesion: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/sesiones/${sesionId}`, sesion);
  }

  // Método para eliminar una sesión asignada
  eliminarSesion(sesionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sesiones/${sesionId}`);
  }
}
