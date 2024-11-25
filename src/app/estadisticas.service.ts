import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private apiUrl = 'http://localhost:3000/api/encuestas-estadisticas';

  constructor(private http: HttpClient) {}

  getEstadisticas(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
  
  getEstadisticasPorPatologia(): Observable<any> {
    return this.http.get<any>('http://localhost:3000/api/encuestas-por-patologia');
  }
  
}
