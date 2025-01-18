import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private apiUrlEstadisticas = 'http://54.215.133.125:3000/api/encuestas-estadisticas';
  private apiUrlPorPatologia = 'http://54.215.133.125:3000/api/encuestas-por-patologia';
  private apiUrlPorPaciente = 'http://54.215.133.125:3000/api/encuestas-por-paciente';

  constructor(private http: HttpClient) {}

  // Método para obtener estadísticas generales
  getEstadisticas(): Observable<any> {
    return this.http.get<any>(this.apiUrlEstadisticas);
  }
  
  // Método para obtener estadísticas por patología
  getEstadisticasPorPatologia(): Observable<any> {
    return this.http.get<any>(this.apiUrlPorPatologia);
  }
  
  // Método para obtener estadísticas por paciente
  getEstadisticasPorPaciente(): Observable<any> {
    return this.http.get<any>(this.apiUrlPorPaciente);
  }
}
