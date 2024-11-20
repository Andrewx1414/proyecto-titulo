import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MantenedorUsuariosComponent } from './mantenedor-usuarios.component';

describe('MantenedorUsuariosComponent', () => {
  let component: MantenedorUsuariosComponent;
  let fixture: ComponentFixture<MantenedorUsuariosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MantenedorUsuariosComponent]
    });
    fixture = TestBed.createComponent(MantenedorUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
