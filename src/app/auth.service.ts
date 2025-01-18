import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://54.215.133.125:3000/api/login';
  private usuarioKey = 'user'; // Clave consistente para el almacenamiento en localStorage

  constructor(private http: HttpClient) {}

  // Método para iniciar sesión y obtener la respuesta del servidor
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { email, password });
  }

  // Guardar el usuario autenticado
  setUsuario(usuario: any): void {
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuario)); // Persistencia del usuario
  }

  // Obtener el usuario autenticado
  getUsuario(): any {
    const usuarioString = localStorage.getItem(this.usuarioKey);
    return usuarioString ? JSON.parse(usuarioString) : null;
  }

  // Obtener el terapeuta_id del usuario autenticado (si es un terapeuta)
  getTerapeutaId(): number | null {
    const usuario = this.getUsuario();
    return usuario && usuario.tipo_usuario === 'terapeuta' ? usuario.id : null;
  }

  // Método para cerrar sesión
  logout(): void {
    localStorage.removeItem(this.usuarioKey); // Elimina el usuario guardado en el almacenamiento local
    console.log('Usuario eliminado de localStorage. Sesión cerrada.');
  }
}
