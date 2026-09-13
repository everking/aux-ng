import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { EventService } from './event.service';
import {
  BulletinEvent,
  formatDateRange,
  getEventStatus,
  isCurrentOrFuture,
  sortCurrentEvents,
  todayISO,
  upcomingEventsForHome
} from '../interfaces/bulletin-event';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('maps a Firestore document to a bulletin event', () => {
    const event = service.firebaseToEvent({
      name: 'projects/auxilium-420904/databases/aux-db/documents/events/abc123',
      fields: {
        articleId: { stringValue: 'retreat-2026' },
        eventId: { stringValue: 'retreat-2026' },
        header: { stringValue: 'Family Retreat' },
        body: { stringValue: '<p>Join us</p>' },
        imageURI: { stringValue: '/assets/images/family.png' },
        dateFrom: { stringValue: '2026-03-01' },
        dateTo: { stringValue: '2026-03-03' },
        meta: {
          mapValue: {
            fields: {
              lastUpdated: { timestampValue: '2026-01-01T00:00:00Z' },
              createdBy: { stringValue: 'editor@example.com' }
            }
          }
        }
      }
    });

    expect(event.eventId).toBe('retreat-2026');
    expect(event.header).toBe('Family Retreat');
    expect(event.dateFrom).toBe('2026-03-01');
    expect(event.dateTo).toBe('2026-03-03');
    expect(event.meta.documentId).toBe('abc123');
    expect(event.meta.createdBy).toBe('editor@example.com');
    expect(event.deleted).toBeFalse();
  });

  it('maps a deleted Firestore event', () => {
    const event = service.firebaseToEvent({
      name: 'projects/auxilium-420904/databases/aux-db/documents/articles/abc123',
      fields: {
        articleId: { stringValue: 'gone' },
        eventId: { stringValue: 'gone' },
        header: { stringValue: 'Gone' },
        dateFrom: { stringValue: '2026-10-01' },
        dateTo: { stringValue: '2026-10-01' },
        deleted: { booleanValue: true }
      }
    });
    expect(event.deleted).toBeTrue();
  });
});

describe('bulletin event date helpers', () => {
  const today = '2026-09-12';

  const event = (dateFrom: string, dateTo: string): BulletinEvent => ({
    eventId: `${dateFrom}-${dateTo}`,
    imageURI: '',
    header: dateFrom,
    body: '',
    dates: dateFrom,
    dateFrom,
    dateTo,
    schedule: '',
    recurrence: null,
    tags: [],
    where: '',
    meta: {}
  });

  it('formats today as local YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 8, 12))).toBe('2026-09-12');
  });

  it('treats events ending today as current', () => {
    expect(isCurrentOrFuture(event('2026-09-01', '2026-09-12'), today)).toBeTrue();
  });

  it('treats future events as current-or-future', () => {
    expect(isCurrentOrFuture(event('2026-10-01', '2026-10-02'), today)).toBeTrue();
  });

  it('hides events that already ended', () => {
    expect(isCurrentOrFuture(event('2026-08-01', '2026-09-11'), today)).toBeFalse();
  });

  it('keeps recurring events on the board', () => {
    const recurring = {
      ...event('2026-09-21', '2026-09-21'),
      recurrence: { pattern: 'nth-weekday-of-month' as const, weekday: 1, nth: 3 }
    };
    expect(isCurrentOrFuture(recurring, today)).toBeTrue();
    expect(getEventStatus(recurring, today)).toBe('upcoming');
  });

  it('classifies happening, upcoming, and ended statuses', () => {
    expect(getEventStatus(event('2026-09-01', '2026-09-20'), today)).toBe('happening');
    expect(getEventStatus(event('2026-10-01', '2026-10-02'), today)).toBe('upcoming');
    expect(getEventStatus(event('2026-08-01', '2026-09-11'), today)).toBe('ended');
  });

  it('formats a same-day window as a single date', () => {
    expect(formatDateRange('2026-03-15', '2026-03-15')).toBe('Mar 15, 2026');
  });

  it('formats a multi-day window in the same year without repeating the year', () => {
    expect(formatDateRange('2026-03-15', '2026-03-22')).toBe('Mar 15 – Mar 22, 2026');
  });

  it('limits home highlights to the next two weeks and four items', () => {
    const highlighted = upcomingEventsForHome(
      [
        event('2026-09-12', '2026-09-12'),
        event('2026-09-18', '2026-09-18'),
        event('2026-09-20', '2026-09-21'),
        event('2026-09-25', '2026-09-25'),
        event('2026-09-26', '2026-09-26'),
        event('2026-10-01', '2026-10-01')
      ],
      today
    );

    expect(highlighted.map((item) => item.dateFrom)).toEqual([
      '2026-09-12',
      '2026-09-18',
      '2026-09-20',
      '2026-09-25'
    ]);
  });

  it('sorts current events by start date and drops past events', () => {
    const sorted = sortCurrentEvents(
      [
        event('2026-10-02', '2026-10-03'),
        event('2026-08-01', '2026-08-02'),
        event('2026-09-12', '2026-09-13'),
        event('2026-10-01', '2026-10-01')
      ],
      today
    );

    expect(sorted.map((item) => item.dateFrom)).toEqual([
      '2026-09-12',
      '2026-10-01',
      '2026-10-02'
    ]);
  });
});
