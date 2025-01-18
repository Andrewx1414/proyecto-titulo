import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EjerciciosService {
  private apiUrl = 'http://54.215.133.125:3000/api/ejercicios'; // URL del endpoint para ejercicios

  constructor(private http: HttpClient) {}

  // Método para subir un nuevo ejercicio
  subirEjercicio(ejercicio: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.apiUrl, ejercicio, { headers });
  }
}
