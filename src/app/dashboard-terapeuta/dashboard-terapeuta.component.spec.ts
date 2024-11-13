import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardTerapeutaComponent } from './dashboard-terapeuta.component';

describe('DashboardTerapeutaComponent', () => {
  let component: DashboardTerapeutaComponent;
  let fixture: ComponentFixture<DashboardTerapeutaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardTerapeutaComponent]
    });
    fixture = TestBed.createComponent(DashboardTerapeutaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
