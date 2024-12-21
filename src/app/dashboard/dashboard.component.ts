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
  pacientesSeleccionados: string[] = [];
  terminoBusqueda: string = ''; // Para la búsqueda

  labels: string[] = [];
  dificultadData: number[] = [];
  dolorData: number[] = [];
  satisfaccionData: number[] = [];

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    this.cargarEstadisticasPorPaciente();
  }

  cargarEstadisticasPorPaciente(): void {
    this.estadisticasService.getEstadisticasPorPaciente().subscribe(
      (response) => {
        if (response.success) {
          this.estadisticas = response.data;
          this.estadisticasFiltradas = [...this.estadisticas];
          this.actualizarDatosDelGrafico();
        }
      },
      (error) => {
        console.error('Error al cargar estadísticas por paciente:', error);
      }
    );
  }

  togglePaciente(nombre: string): void {
    if (this.pacientesSeleccionados.includes(nombre)) {
      this.pacientesSeleccionados = this.pacientesSeleccionados.filter(p => p !== nombre);
    } else {
      this.pacientesSeleccionados.push(nombre);
    }

    this.estadisticasFiltradas = this.pacientesSeleccionados.length
      ? this.estadisticas.filter(e => this.pacientesSeleccionados.includes(e.nombre_paciente))
      : [...this.estadisticas];

    this.actualizarDatosDelGrafico();
  }

  filtrarPacientes(): void {
    const termino = this.terminoBusqueda.toLowerCase();
  
    this.estadisticasFiltradas = this.terminoBusqueda
      ? this.estadisticas.filter(e => 
          e.nombre_paciente.toLowerCase().includes(termino) ||
          e.rut_paciente.toLowerCase().includes(termino)
        )
      : [...this.estadisticas];
  }
  

  actualizarDatosDelGrafico(): void {
    this.labels = this.estadisticasFiltradas.map(e => e.nombre_paciente || 'Sin Nombre');
    this.dificultadData = this.estadisticasFiltradas.map(e => e.promedio_dificultad);
    this.dolorData = this.estadisticasFiltradas.map(e => e.promedio_dolor);
    this.satisfaccionData = this.estadisticasFiltradas.map(e => e.promedio_satisfaccion);
  }
}
