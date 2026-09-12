import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { EditEventComponent } from './edit-event.component';

describe('EditEventComponent', () => {
  let component: EditEventComponent;
  let fixture: ComponentFixture<EditEventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditEventComponent],
      providers: [provideRouter([]), provideHttpClient()]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires a title and a valid date', () => {
    component.header = '';
    component.dates = '10/01/2026';
    component.dateFrom = '2026-10-01';
    component.dateTo = '2026-10-02';
    expect(component.isValid()).toBeFalse();

    component.header = 'Retreat';
    component.dateTo = '2026-09-01';
    expect(component.isValid()).toBeFalse();

    component.dateTo = '2026-10-02';
    expect(component.isValid()).toBeTrue();

    component.dateFrom = '';
    component.dateTo = '';
    component.dates = 'next friday';
    expect(component.isValid()).toBeTrue();
  });
});
