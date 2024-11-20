// usuario.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios'; // URL del endpoint para registrar usuarios

  constructor(private http: HttpClient) { }

  registrarUsuario(usuario: any): Observable<any> {
    // Configuración de los headers para la solicitud HTTP
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    // Enviar una solicitud POST para registrar al usuario
    return this.http.post<any>(this.apiUrl, usuario, { headers });
  }
}
