import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPacienteComponent } from './dashboard-paciente.component';

describe('DashboardPacienteComponent', () => {
  let component: DashboardPacienteComponent;
  let fixture: ComponentFixture<DashboardPacienteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardPacienteComponent]
    });
    fixture = TestBed.createComponent(DashboardPacienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
