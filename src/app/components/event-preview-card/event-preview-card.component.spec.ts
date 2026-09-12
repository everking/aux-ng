import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EventPreviewCardComponent } from './event-preview-card.component';

describe('EventPreviewCardComponent', () => {
  let component: EventPreviewCardComponent;
  let fixture: ComponentFixture<EventPreviewCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventPreviewCardComponent],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EventPreviewCardComponent);
    component = fixture.componentInstance;
    component.event = {
      eventId: 'family-retreat',
      imageURI: '/assets/images/default-image.png',
      header: 'Family Retreat',
      body: '<p>Join us</p>',
      dates: '10/01/2026 – 10/03/2026',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-03',
      schedule: '',
      recurrence: null,
      tags: [],
      where: 'St. Joseph Church',
      meta: {}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
