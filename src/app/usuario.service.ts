import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios'; // Endpoint para registrar, obtener y eliminar usuarios

  constructor(private http: HttpClient) {}

  registrarUsuario(usuario: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.apiUrl, usuario, { headers });
  }

  obtenerUsuarios(): Observable<any> {
    return this.http.get<any>(this.apiUrl); // Llamada GET para obtener usuarios
  }

  eliminarUsuario(usuarioId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${usuarioId}`); // Llamada DELETE para eliminar usuarios
  }

  editarUsuario(usuario: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<any>(`${this.apiUrl}/${usuario.id}`, usuario, { headers }); // Llamada PUT para editar usuarios
  }
  obtenerPacientesPorTerapeuta(terapeutaId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/api/pacientes/${terapeutaId}`);
  }
  
}
