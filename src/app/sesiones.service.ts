import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 🔥 Definición de la interfaz de la sesión
export interface Sesion {
  id: number;
  paciente_id: number;
  terapeuta_id: number;
  fecha: string;
  descripcion: string;
  paciente_nombre: string; // ✅ Nombre del paciente
  paciente_apellidos: string; // ✅ Apellidos del paciente
  ejercicios: number[]; // ✅ Usamos una lista de IDs de ejercicios (números)
}

@Injectable({
  providedIn: 'root'
})
export class SesionesService {
  public apiUrl = 'http://localhost:3000/api'; // 🔥 URL de la API ahora pública para uso en el componente

  constructor(private http: HttpClient) { }

  /**
   * Obtener la lista de pacientes asignados a un terapeuta
   * @param terapeutaId ID del terapeuta
   * @returns Observable con la lista de pacientes
   */
  obtenerPacientesPorTerapeuta(terapeutaId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/pacientes?terapeuta_id=${terapeutaId}`);
  }

  /**
   * Obtener la lista de ejercicios disponibles
   * @returns Observable con la lista de ejercicios
   */
  obtenerEjercicios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ejercicios`);
  }

  /**
   * Asignar una nueva sesión
   * @param sesion Datos de la sesión a asignar
   * @returns Observable con la respuesta de la asignación
   */
  asignarSesion(sesion: {
    paciente_id: number;
    terapeuta_id: number;
    fecha: string;
    descripcion: string;
    ejercicios: number[]; // ✅ Aseguramos que los ejercicios sean un array de IDs numéricos
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/asignar-sesion`, sesion);
  }

  /**
   * Obtener la lista de sesiones asignadas a un terapeuta
   * @param terapeutaId ID del terapeuta
   * @returns Observable con la lista de sesiones
   */
  obtenerSesionesPorTerapeuta(terapeutaId: number): Observable<{ success: boolean, sesiones: Sesion[] }> {
    return this.http.get<{ success: boolean, sesiones: Sesion[] }>(`${this.apiUrl}/sesiones?terapeuta_id=${terapeutaId}`);
  }

  /**
   * Editar una sesión asignada
   * @param sesionId ID de la sesión
   * @param sesion Datos actualizados de la sesión
   * @returns Observable con la respuesta de la actualización
   */
  editarSesion(sesionId: number, sesion: {
    fecha: string;
    descripcion: string;
    ejercicios: number[]; // ✅ Lista de IDs de ejercicios
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/sesiones/${sesionId}`, sesion);
  }

  /**
   * Eliminar una sesión
   * @param sesionId ID de la sesión
   * @returns Observable con la respuesta de la eliminación
   */
  eliminarSesion(sesionId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sesiones/${sesionId}`);
  }
}
