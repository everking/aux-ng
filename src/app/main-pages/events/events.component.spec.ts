import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { EventsComponent, EVENT_TAG_FILTER_KEY } from './events.component';
import { EventService } from '../../services/event.service';
import { filterEventsByTags } from '../../interfaces/bulletin-event';
import { BulletinEvent } from '../../interfaces/bulletin-event';

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;

  beforeEach(async () => {
    localStorage.removeItem(EVENT_TAG_FILTER_KEY);
    await TestBed.configureTestingModule({
      imports: [EventsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: EventService,
          useValue: {
            fetchEvents: () => Promise.resolve([])
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('treats All and no selected tags as unfiltered', () => {
    component.events = [
      eventWithTags('retreat', ['retreat']),
      eventWithTags('camp', ['camp'])
    ];
    component.allTags = true;
    expect(component.displayedEvents.length).toBe(2);
    component.allTags = false;
    component.selected = {};
    expect(component.displayedEvents.length).toBe(2);
  });

  it('filters with OR when specific tags are checked', () => {
    component.events = [
      eventWithTags('retreat', ['retreat']),
      eventWithTags('camp', ['camp']),
      eventWithTags('both', ['retreat', 'camp'])
    ];
    component.allTags = false;
    component.availableTags = ['retreat', 'camp'];
    component.selected = { retreat: true };
    expect(component.displayedEvents.map((event) => event.eventId)).toEqual(['retreat', 'both']);
  });

  it('persists the tag filter in localStorage', () => {
    component.onAllTagsChange(false);
    component.availableTags = ['men'];
    component.onTagChange('men', true);
    const saved = JSON.parse(localStorage.getItem(EVENT_TAG_FILTER_KEY) || '{}');
    expect(saved.all).toBeFalse();
    expect(saved.selected).toEqual(['men']);
  });
});

function eventWithTags(id: string, tags: string[]): BulletinEvent {
  return {
    eventId: id,
    imageURI: '',
    header: id,
    body: '',
    dates: '',
    dateFrom: '2026-09-20',
    dateTo: '2026-09-20',
    schedule: '',
    recurrence: null,
    tags,
    where: '',
    meta: {}
  };
}

describe('filterEventsByTags', () => {
  it('returns all events when no tags are selected', () => {
    const events = [eventWithTags('a', ['men']), eventWithTags('b', ['women'])];
    expect(filterEventsByTags(events, [])).toEqual(events);
  });
});

