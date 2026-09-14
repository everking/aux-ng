import { stripHtml } from './utils';

describe('stripHtml', () => {
  it('inserts a space where a newline separated words', () => {
    expect(stripHtml('forum\nThe CAL Forum')).toBe('forum The CAL Forum');
    expect(stripHtml('retreats\r\nWhat to expect')).toBe('retreats What to expect');
  });

  it('inserts a space between block and break tags', () => {
    expect(stripHtml('<p>retreats</p><p>What to expect</p>')).toBe('retreats What to expect');
    expect(stripHtml('12:00 PM<br>https://example.com')).toBe('12:00 PM https://example.com');
  });
});
