import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubirVideosComponent } from './subir-videos.component';

describe('SubirVideosComponent', () => {
  let component: SubirVideosComponent;
  let fixture: ComponentFixture<SubirVideosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubirVideosComponent]
    });
    fixture = TestBed.createComponent(SubirVideosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
