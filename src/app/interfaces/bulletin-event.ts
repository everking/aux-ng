import {
  DateRecurrence,
  nextOccurrence,
  parseRecurrenceJson,
  toISODate
} from '../utils/date-parse';

export interface BulletinEventMeta {
  /*
    documentId and name are firestore
    implementation specific
  */
  documentId?: string;
  name?: string;
  lastUpdated?: string;
  createdBy?: string;
}

export interface BulletinEvent {
  eventId: string;
  imageURI: string;
  header: string;
  body: string;
  dates: string;
  dateFrom: string; /* YYYY-MM-DD inclusive start or next occurrence */
  dateTo: string; /* YYYY-MM-DD inclusive end */
  schedule: string;
  recurrence: DateRecurrence | null;
  tags: string[];
  where: string;
  meta: BulletinEventMeta;
}

export type EventStatus = 'upcoming' | 'happening' | 'ended';

export function todayISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function eventEndDate(event: Pick<BulletinEvent, 'dateFrom' | 'dateTo'>): string {
  return event.dateTo || event.dateFrom;
}

export function hydrateEvent(event: BulletinEvent, now: Date = new Date()): BulletinEvent {
  if (!event.recurrence) {
    return event;
  }
  const next = nextOccurrence(event.recurrence, now);
  if (!next) {
    return event;
  }
  const iso = toISODate(next);
  return {
    ...event,
    dateFrom: iso,
    dateTo: iso
  };
}

export function isCurrentOrFuture(
  event: Pick<BulletinEvent, 'dateFrom' | 'dateTo' | 'recurrence'>,
  today: string = todayISO()
): boolean {
  if (event.recurrence) {
    return !!event.dateFrom;
  }
  const end = eventEndDate(event);
  return !!end && end >= today;
}

export function getEventStatus(
  event: Pick<BulletinEvent, 'dateFrom' | 'dateTo' | 'recurrence'>,
  today: string = todayISO()
): EventStatus {
  const start = event.dateFrom;
  const end = eventEndDate(event);
  if (event.recurrence) {
    return start === today ? 'happening' : 'upcoming';
  }
  if (!end || end < today) {
    return 'ended';
  }
  if (start && start > today) {
    return 'upcoming';
  }
  return 'happening';
}

export function parseLocalDate(date: string): Date | null {
  if (!date) {
    return null;
  }
  const parts = date.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function formatDateRange(dateFrom: string, dateTo: string): string {
  const from = parseLocalDate(dateFrom);
  const to = parseLocalDate(dateTo || dateFrom);
  if (!from || !to) {
    return '';
  }

  const full: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  const monthDay: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };

  if (dateFrom === (dateTo || dateFrom)) {
    return from.toLocaleDateString('en-US', full);
  }

  if (from.getFullYear() === to.getFullYear()) {
    return `${from.toLocaleDateString('en-US', monthDay)} – ${to.toLocaleDateString('en-US', full)}`;
  }

  return `${from.toLocaleDateString('en-US', full)} – ${to.toLocaleDateString('en-US', full)}`;
}

export function eventDateLabel(event: Pick<BulletinEvent, 'dateFrom' | 'dateTo' | 'recurrence'>): string {
  const range = formatDateRange(event.dateFrom, event.dateTo);
  if (event.recurrence && range) {
    return `Next: ${range}`;
  }
  return range;
}

export function sortCurrentEvents(events: BulletinEvent[], today: string = todayISO()): BulletinEvent[] {
  return events
    .filter((event) => isCurrentOrFuture(event, today))
    .sort((a, b) => {
      const fromCompare = a.dateFrom.localeCompare(b.dateFrom);
      if (fromCompare !== 0) {
        return fromCompare;
      }
      return a.header.localeCompare(b.header);
    });
}

export { parseRecurrenceJson };
