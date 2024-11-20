import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarSesionesComponent } from './asignar-sesiones.component';

describe('AsignarSesionesComponent', () => {
  let component: AsignarSesionesComponent;
  let fixture: ComponentFixture<AsignarSesionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AsignarSesionesComponent]
    });
    fixture = TestBed.createComponent(AsignarSesionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
