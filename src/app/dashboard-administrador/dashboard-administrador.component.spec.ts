import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAdministradorComponent } from './dashboard-administrador.component';
 

describe('DashboardAdministradorComponent', () => {
  let component: DashboardAdministradorComponent;
  let fixture: ComponentFixture<DashboardAdministradorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardAdministradorComponent]
    });
    fixture = TestBed.createComponent(DashboardAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
