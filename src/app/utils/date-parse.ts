export interface DateRecurrence {
  pattern: 'nth-weekday-of-month' | 'weekly';
  weekday: number;
  nth?: number;
}

export interface ParsedDates {
  kind: 'single' | 'range' | 'recurring';
  dates: string;
  dateFrom: string;
  dateTo: string;
  schedule: string;
  recurrence: DateRecurrence | null;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTHS: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11
};

const ORDINALS: Record<string, number> = {
  first: 1, '1st': 1, '1': 1,
  second: 2, '2nd': 2, '2': 2,
  third: 3, '3rd': 3, '3': 3,
  fourth: 4, '4th': 4, '4': 4,
  fifth: 5, '5th': 5, '5': 5,
  last: -1
};

const WEEKDAY_PATTERN = 'sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat';
const ORDINAL_PATTERN = '1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth|last';

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toUSDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : startOfDay(date);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function nthLabel(nth: number): string {
  if (nth === -1) {
    return 'Last';
  }
  const labels = ['', '1st', '2nd', '3rd', '4th', '5th'];
  return labels[nth] || `${nth}th`;
}

export function scheduleLabel(recurrence: DateRecurrence): string {
  const weekday = WEEKDAY_NAMES[recurrence.weekday];
  if (recurrence.pattern === 'weekly') {
    return `Every ${weekday}`;
  }
  return `${nthLabel(recurrence.nth || 1)} ${weekday} of the month`;
}

export function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date | null {
  if (nth === -1) {
    const lastDay = new Date(year, month + 1, 0);
    const offset = (lastDay.getDay() - weekday + 7) % 7;
    return new Date(year, month, lastDay.getDate() - offset);
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  const result = new Date(year, month, day);
  if (result.getMonth() !== month) {
    return null;
  }
  return result;
}

export function nextOccurrence(recurrence: DateRecurrence, now: Date = new Date()): Date | null {
  const today = startOfDay(now);
  if (recurrence.pattern === 'weekly') {
    const delta = (recurrence.weekday - today.getDay() + 7) % 7;
    return addDays(today, delta);
  }
  const nth = recurrence.nth ?? 1;
  let year = today.getFullYear();
  let month = today.getMonth();
  for (let i = 0; i < 18; i++) {
    const candidate = nthWeekdayOfMonth(year, month, recurrence.weekday, nth);
    if (candidate && candidate >= today) {
      return candidate;
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return null;
}

function parseWeekday(token: string): number | null {
  const key = token.toLowerCase();
  return key in WEEKDAYS ? WEEKDAYS[key] : null;
}

function parseOrdinal(token: string): number | null {
  const key = token.toLowerCase();
  return key in ORDINALS ? ORDINALS[key] : null;
}

function fromParts(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return startOfDay(date);
}

function parseNumericDate(text: string, now: Date): Date | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) {
    return fromParts(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }
  const us = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(text);
  if (us) {
    let year = Number(us[3]);
    if (year < 100) {
      year += 2000;
    }
    return fromParts(year, Number(us[1]) - 1, Number(us[2]));
  }
  const monthName = new RegExp(
    `^(${Object.keys(MONTHS).join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?(?:\\s+(\\d{4}))?$`,
    'i'
  ).exec(text);
  if (monthName) {
    const month = MONTHS[monthName[1].toLowerCase()];
    const day = Number(monthName[2]);
    const year = monthName[3] ? Number(monthName[3]) : inferYear(now, month, day);
    return fromParts(year, month, day);
  }
  const dayMonth = new RegExp(
    `^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${Object.keys(MONTHS).join('|')})(?:,?\\s+(\\d{4}))?$`,
    'i'
  ).exec(text);
  if (dayMonth) {
    const month = MONTHS[dayMonth[2].toLowerCase()];
    const day = Number(dayMonth[1]);
    const year = dayMonth[3] ? Number(dayMonth[3]) : inferYear(now, month, day);
    return fromParts(year, month, day);
  }
  return null;
}

function inferYear(now: Date, month: number, day: number): number {
  const thisYear = fromParts(now.getFullYear(), month, day);
  if (thisYear && thisYear >= startOfDay(now)) {
    return now.getFullYear();
  }
  return now.getFullYear() + 1;
}

function parseRelativeDate(text: string, now: Date): Date | null {
  const today = startOfDay(now);
  const normalized = text.toLowerCase();
  if (normalized === 'today') {
    return today;
  }
  if (normalized === 'tomorrow') {
    return addDays(today, 1);
  }
  if (normalized === 'yesterday') {
    return addDays(today, -1);
  }
  const relativeWeekday = new RegExp(`^(this|next|last)?\\s*(${WEEKDAY_PATTERN})$`).exec(normalized);
  if (relativeWeekday) {
    const weekday = parseWeekday(relativeWeekday[2]);
    if (weekday === null) {
      return null;
    }
    const mode = relativeWeekday[1] || '';
    const current = today.getDay();
    if (mode === 'last') {
      let delta = current - weekday;
      if (delta <= 0) {
        delta += 7;
      }
      return addDays(today, -delta);
    }
    if (mode === 'next') {
      let delta = weekday - current;
      if (delta <= 0) {
        delta += 7;
      }
      return addDays(today, delta);
    }
    let delta = weekday - current;
    if (delta < 0) {
      delta += 7;
    }
    return addDays(today, delta);
  }
  return null;
}

function parseSingleDate(text: string, now: Date): Date | null {
  return parseRelativeDate(text, now) || parseNumericDate(text, now);
}

function parseRecurring(text: string): DateRecurrence | null {
  const nthMonth = new RegExp(
    `^(?:every\\s+)?(?:the\\s+)?(${ORDINAL_PATTERN})\\s+(${WEEKDAY_PATTERN})s?(?:\\s+of(?:\\s+the|\\s+each|\\s+every)?\\s+month)?$`,
    'i'
  ).exec(text);
  if (nthMonth) {
    const nth = parseOrdinal(nthMonth[1]);
    const weekday = parseWeekday(nthMonth[2]);
    if (nth === null || weekday === null) {
      return null;
    }
    return { pattern: 'nth-weekday-of-month', weekday, nth };
  }
  const weekly = new RegExp(`^every\\s+(${WEEKDAY_PATTERN})s?$`, 'i').exec(text);
  if (weekly) {
    const weekday = parseWeekday(weekly[1]);
    if (weekday === null) {
      return null;
    }
    return { pattern: 'weekly', weekday };
  }
  const plural = new RegExp(`^(${WEEKDAY_PATTERN})s$`, 'i').exec(text);
  if (plural) {
    const weekday = parseWeekday(plural[1]);
    if (weekday === null) {
      return null;
    }
    return { pattern: 'weekly', weekday };
  }
  return null;
}

function splitRange(text: string): [string, string] | null {
  const stripped = text.replace(/^from\s+/i, '');
  const parts = stripped.split(/\s+(?:to|through|until|–)\s+|\s+-\s+/i);
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return [parts[0].trim(), parts[1].trim()];
  }
  return null;
}

export function parseDates(input: string, now: Date = new Date()): ParsedDates | null {
  const text = input.trim().replace(/\s+/g, ' ');
  if (!text) {
    return null;
  }

  const recurrence = parseRecurring(text.toLowerCase());
  if (recurrence) {
    const next = nextOccurrence(recurrence, now);
    if (!next) {
      return null;
    }
    const iso = toISODate(next);
    const schedule = scheduleLabel(recurrence);
    return {
      kind: 'recurring',
      dates: schedule,
      dateFrom: iso,
      dateTo: iso,
      schedule,
      recurrence
    };
  }

  const range = splitRange(text);
  if (range) {
    const from = parseSingleDate(range[0], now);
    if (!from) {
      return null;
    }
    let to = parseSingleDate(range[1], now);
    if (!to || to < from) {
      to = parseSingleDate(range[1], from);
    }
    if (!to || to < from) {
      return null;
    }
    return {
      kind: 'range',
      dates: `${toUSDate(from)} – ${toUSDate(to)}`,
      dateFrom: toISODate(from),
      dateTo: toISODate(to),
      schedule: '',
      recurrence: null
    };
  }

  const single = parseSingleDate(text, now);
  if (!single) {
    return null;
  }
  return {
    kind: 'single',
    dates: toUSDate(single),
    dateFrom: toISODate(single),
    dateTo: toISODate(single),
    schedule: '',
    recurrence: null
  };
}

export function parseRecurrenceJson(raw?: string): DateRecurrence | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as DateRecurrence;
    if (parsed?.pattern === 'weekly' || parsed?.pattern === 'nth-weekday-of-month') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
