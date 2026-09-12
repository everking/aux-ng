import {
  nextOccurrence,
  parseDates,
  toUSDate
} from './date-parse';

describe('parseDates', () => {
  const now = new Date(2026, 8, 12); // Saturday, Sept 12, 2026

  it('resolves next Friday to 09/18/2026', () => {
    const parsed = parseDates('next friday', now);
    expect(parsed?.kind).toBe('single');
    expect(parsed?.dates).toBe('09/18/2026');
    expect(parsed?.dateFrom).toBe('2026-09-18');
  });

  it('resolves today, tomorrow, and a US numeric date', () => {
    expect(parseDates('today', now)?.dates).toBe('09/12/2026');
    expect(parseDates('tomorrow', now)?.dates).toBe('09/13/2026');
    expect(parseDates('9/18/2026', now)?.dateFrom).toBe('2026-09-18');
  });

  it('resolves a named date range', () => {
    const parsed = parseDates('next friday to next sunday', now);
    expect(parsed?.kind).toBe('range');
    expect(parsed?.dates).toBe('09/18/2026 – 09/20/2026');
    expect(parsed?.dateFrom).toBe('2026-09-18');
    expect(parsed?.dateTo).toBe('2026-09-20');
  });

  it('resolves 3rd Monday of the month to the next occurrence', () => {
    const parsed = parseDates('3rd monday of the month', now);
    expect(parsed?.kind).toBe('recurring');
    expect(parsed?.dates).toBe('3rd Monday of the month');
    expect(parsed?.schedule).toBe('3rd Monday of the month');
    expect(parsed?.dateFrom).toBe('2026-09-21');
    expect(parsed?.recurrence).toEqual({
      pattern: 'nth-weekday-of-month',
      weekday: 1,
      nth: 3
    });
  });

  it('resolves every Friday as a weekly recurrence', () => {
    const parsed = parseDates('every friday', now);
    expect(parsed?.kind).toBe('recurring');
    expect(parsed?.schedule).toBe('Every Friday');
    expect(parsed?.dateFrom).toBe('2026-09-18');
  });

  it('returns null for unparseable input', () => {
    expect(parseDates('someday soon', now)).toBeNull();
  });
});

describe('nextOccurrence', () => {
  it('advances a monthly weekday to the following month after it has passed', () => {
    const afterThirdMonday = new Date(2026, 8, 22);
    const next = nextOccurrence(
      { pattern: 'nth-weekday-of-month', weekday: 1, nth: 3 },
      afterThirdMonday
    );
    expect(next && toUSDate(next)).toBe('10/19/2026');
  });
});
