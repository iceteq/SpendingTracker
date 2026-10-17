import { describe, expect, it } from 'vitest';
import {
  calendarMonthPeriod,
  formatPeriodLabel,
  isInPeriod,
  paydayPeriod,
  stockholmToday,
  toIsoDate,
} from './period';

describe('payday periods', () => {
  it.each([
    ['2026-10-17', 25, '2026-09-25', '2026-10-25'],
    ['2026-10-24', 25, '2026-09-25', '2026-10-25'],
    ['2026-10-25', 25, '2026-10-25', '2026-11-25'],
    ['2026-10-26', 25, '2026-10-25', '2026-11-25'],
    ['2026-01-10', 25, '2025-12-25', '2026-01-25'],
    ['2026-12-25', 25, '2026-12-25', '2027-01-25'],
    ['2026-12-26', 25, '2026-12-25', '2027-01-25'],
    ['2025-12-15', 25, '2025-11-25', '2025-12-25'],
    ['2026-03-15', 31, '2026-02-28', '2026-03-31'],
    ['2026-03-31', 31, '2026-03-31', '2026-04-30'],
    ['2026-02-28', 31, '2026-02-28', '2026-03-31'],
    ['2026-02-27', 31, '2026-01-31', '2026-02-28'],
    ['2024-02-29', 31, '2024-02-29', '2024-03-31'],
    ['2024-03-01', 31, '2024-02-29', '2024-03-31'],
    ['2024-02-28', 31, '2024-01-31', '2024-02-29'],
    ['2026-04-15', 31, '2026-03-31', '2026-04-30'],
    ['2026-04-30', 31, '2026-04-30', '2026-05-31'],
    ['2026-01-15', 31, '2025-12-31', '2026-01-31'],
    ['2026-01-31', 31, '2026-01-31', '2026-02-28'],
    ['2026-12-31', 31, '2026-12-31', '2027-01-31'],
    ['2026-03-01', 29, '2026-02-28', '2026-03-29'],
    ['2024-03-01', 29, '2024-02-29', '2024-03-29'],
    ['2026-10-01', 1, '2026-10-01', '2026-11-01'],
    ['2026-10-17', 1, '2026-10-01', '2026-11-01'],
    ['2026-10-17', 17, '2026-10-17', '2026-11-17'],
  ])('payday %s day %i runs %s inclusive to %s exclusive', (today, payday, start, end) => {
    expect(paydayPeriod(today, payday)).toEqual({ start, end, mode: 'payday' });
  });

  it('treats the range as inclusive start and exclusive end', () => {
    const period = paydayPeriod('2026-10-17', 25);
    expect(isInPeriod('2026-09-25', period)).toBe(true);
    expect(isInPeriod('2026-10-24', period)).toBe(true);
    expect(isInPeriod('2026-10-25', period)).toBe(false);
    expect(isInPeriod('2026-09-24', period)).toBe(false);
  });

  it('rejects impossible payday days and calendar dates', () => {
    expect(() => paydayPeriod('2026-10-17', 0)).toThrow();
    expect(() => paydayPeriod('2026-10-17', 32)).toThrow();
    expect(() => paydayPeriod('2026-10-17', 25.5)).toThrow();
    expect(() => paydayPeriod('2026-02-31', 25)).toThrow();
  });

  it('keeps payday-31 periods moving forward across leap years', () => {
    for (let year = 2023; year <= 2028; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        for (const day of [1, 15, 28]) {
          const today = toIsoDate(year, month, day);
          const period = paydayPeriod(today, 31);
          expect(period.end > period.start).toBe(true);
          expect(isInPeriod(today, period)).toBe(true);
          expect(isInPeriod(period.start, period)).toBe(true);
          expect(isInPeriod(period.end, period)).toBe(false);
        }
      }
    }
  });
});

describe('calendar months', () => {
  it.each([
    ['2026-10-17', '2026-10-01', '2026-11-01'],
    ['2026-01-01', '2026-01-01', '2026-02-01'],
    ['2026-12-15', '2026-12-01', '2027-01-01'],
  ])('month of %s is %s inclusive to %s exclusive', (today, start, end) => {
    const period = calendarMonthPeriod(today);
    expect(period).toEqual({ start, end, mode: 'month' });
    expect(isInPeriod(today, period)).toBe(true);
    expect(isInPeriod(end, period)).toBe(false);
  });
});

describe('period labels', () => {
  it('shows the last included day', () => {
    expect(formatPeriodLabel(paydayPeriod('2026-10-17', 25))).toBe('25 Sep – 24 Oct');
    expect(formatPeriodLabel(paydayPeriod('2026-01-10', 25))).toBe('25 Dec 2025 – 24 Jan 2026');
    expect(formatPeriodLabel(calendarMonthPeriod('2026-10-17'))).toBe('1 Oct – 31 Oct');
    expect(formatPeriodLabel(calendarMonthPeriod('2026-12-15'))).toBe('1 Dec – 31 Dec');
  });
});

describe('stockholmToday', () => {
  it('uses the Stockholm calendar across midnight and daylight saving', () => {
    expect(stockholmToday(new Date('2025-12-31T22:30:00Z'))).toBe('2025-12-31');
    expect(stockholmToday(new Date('2025-12-31T23:30:00Z'))).toBe('2026-01-01');
    expect(stockholmToday(new Date('2026-03-28T22:30:00Z'))).toBe('2026-03-28');
    expect(stockholmToday(new Date('2026-03-28T23:30:00Z'))).toBe('2026-03-29');
    expect(stockholmToday(new Date('2026-10-24T21:30:00Z'))).toBe('2026-10-24');
    expect(stockholmToday(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25');
  });
});
