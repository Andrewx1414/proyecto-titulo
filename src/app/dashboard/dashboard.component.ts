import { Component, OnInit } from '@angular/core';
import { EstadisticasService } from '../estadisticas.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  estadisticas: any[] = [];
  estadisticasFiltradas: any[] = [];
  patologiasSeleccionadas: string[] = [];

  labels: string[] = [];
  dificultadData: number[] = [];
  dolorData: number[] = [];
  satisfaccionData: number[] = [];

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    this.cargarEstadisticasPorPatologia();
  }

  cargarEstadisticasPorPatologia(): void {
    this.estadisticasService.getEstadisticasPorPatologia().subscribe(
      (response) => {
        if (response.success) {
          this.estadisticas = response.data;
          this.estadisticasFiltradas = [...this.estadisticas];
          this.actualizarDatosDelGrafico();
        }
      },
      (error) => {
        console.error('Error al cargar estadísticas por patología:', error);
      }
    );
  }

  togglePatologia(patologia: string): void {
    if (this.patologiasSeleccionadas.includes(patologia)) {
      this.patologiasSeleccionadas = this.patologiasSeleccionadas.filter(p => p !== patologia);
    } else {
      this.patologiasSeleccionadas.push(patologia);
    }

    this.estadisticasFiltradas = this.patologiasSeleccionadas.length
      ? this.estadisticas.filter(e => this.patologiasSeleccionadas.includes(e.patologia))
      : [...this.estadisticas];

    this.actualizarDatosDelGrafico();
  }

  actualizarDatosDelGrafico(): void {
    this.labels = this.estadisticasFiltradas.map(e => e.patologia || 'Sin Patología');
    this.dificultadData = this.estadisticasFiltradas.map(e => e.promedio_dificultad);
    this.dolorData = this.estadisticasFiltradas.map(e => e.promedio_dolor);
    this.satisfaccionData = this.estadisticasFiltradas.map(e => e.promedio_satisfaccion);
  }
}
