import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiBaseUrl = 'http://localhost:3000/api'; // Base URL del API

  constructor(private http: HttpClient) {}

  // Registrar un usuario
  registrarUsuario(usuario: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(`${this.apiBaseUrl}/usuarios`, usuario, { headers });
  }

  // Obtener todos los usuarios (para administradores)
  obtenerUsuarios(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/usuarios`);
  }

  // Eliminar un usuario por ID
  eliminarUsuario(usuarioId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBaseUrl}/usuarios/${usuarioId}`);
  }

  // Editar un usuario (mantenemos el terapeuta_id)
  editarUsuario(usuario: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    // No sobrescribir terapeuta_id con null
    if (!usuario.terapeuta_id) {
      delete usuario.terapeuta_id;
    }

    console.log('📤 URL de la actualización:', `${this.apiBaseUrl}/usuarios/${usuario.id}`);
    console.log('📤 Cuerpo que se envía al servidor:', JSON.stringify(usuario, null, 2));

    return this.http.put<any>(`${this.apiBaseUrl}/usuarios/${usuario.id}`, usuario, { headers });
  }

  // Obtener pacientes asignados a un terapeuta específico
  obtenerPacientesPorTerapeuta(terapeutaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/pacientes/${terapeutaId}`);
  }

  // Validar el tipo de usuario basado en su ID
  validarTipoUsuario(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/usuario/tipo/${userId}`);
  }
}
