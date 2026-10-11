import { describe, expect, it } from 'vitest';
import {
  comparePartialDates,
  formatPartialDate,
  isPartialDate,
  parsePartialDate,
  sortKey,
  tryParsePartialDate,
  yearOf,
} from './dates';

describe('partial dates', () => {
  it('parses every precision', () => {
    expect(parsePartialDate('2017')).toEqual({ year: 2017, precision: 'year' });
    expect(parsePartialDate('2017-03')).toEqual({ year: 2017, month: 3, precision: 'month' });
    expect(parsePartialDate('2020-08-02')).toEqual({ year: 2020, month: 8, day: 2, precision: 'day' });
  });

  it('rejects malformed and impossible dates', () => {
    for (const bad of ['17', '2017-3', '2017-13', '2019-02-29', '2017-03-01T00:00', '']) {
      expect(isPartialDate(bad), bad).toBe(false);
    }
    expect(tryParsePartialDate('2020-02-29')).toBeDefined();
    expect(() => parsePartialDate('2017-00')).toThrow(/invalid partial date/);
  });

  it('sorts less precise dates first within the same period', () => {
    const dates = ['2017-03-01', '2016', '2017', '2017-03', '2016-08'];
    expect(dates.sort(comparePartialDates)).toEqual(['2016', '2016-08', '2017', '2017-03', '2017-03-01']);
    expect(sortKey('2019-06')).toBe('2019-06-00');
    expect(yearOf('2020-04-21')).toBe(2020);
  });

  it('formats at the date’s own precision', () => {
    expect(formatPartialDate('2017', 'ru')).toBe('2017');
    expect(formatPartialDate('2017-03', 'ru')).toBe('март 2017');
    expect(formatPartialDate('2020-08-02', 'ru')).toBe('2 августа 2020');
    expect(formatPartialDate('2017-03', 'en')).toBe('March 2017');
  });
});
