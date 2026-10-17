export type IsoDate = string;
export type PeriodMode = 'payday' | 'month';

/** Inclusive start, exclusive end, on the Europe/Stockholm calendar. */
export interface Period {
  start: IsoDate;
  end: IsoDate;
  mode: PeriodMode;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function isValidPaydayDay(paydayDay: number): boolean {
  return Number.isInteger(paydayDay) && paydayDay >= 1 && paydayDay <= 31;
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const match = ISO_DATE.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  const yearText = match[1];
  const monthText = match[2];
  const dayText = match[3];
  if (!yearText || !monthText || !dayText) throw new Error(`Invalid date: ${iso}`);

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (month < 1 || month > 12) throw new Error(`Invalid date: ${iso}`);

  const date = new Date(Date.UTC(year, month - 1, day));
  const valid =
    date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
  if (!valid) throw new Error(`Invalid date: ${iso}`);
  return { year, month, day };
}

export function toIsoDate(year: number, month: number, day: number): IsoDate {
  const date = new Date(Date.UTC(year, month - 1, day));
  const monthText = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dayText = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${monthText}-${dayText}`;
}

export function shiftIsoDate(iso: IsoDate, days: number): IsoDate {
  const { year, month, day } = parseIsoDate(iso);
  return toIsoDate(year, month, day + days);
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Payday 29–31 falls on the last real day of a shorter month. */
export function clampPayday(year: number, month: number, paydayDay: number): IsoDate {
  if (!isValidPaydayDay(paydayDay)) throw new Error('Payday must be an integer from 1 to 31');
  return toIsoDate(year, month, Math.min(paydayDay, daysInMonth(year, month)));
}

export function paydayPeriod(today: IsoDate, paydayDay: number): Period {
  const { year, month } = parseIsoDate(today);
  const thisPayday = clampPayday(year, month, paydayDay);
  const startedThisMonth = today >= thisPayday;
  const startAnchor = startedThisMonth ? { year, month } : addMonths(year, month, -1);
  const endAnchor = startedThisMonth ? addMonths(year, month, 1) : { year, month };
  return {
    start: clampPayday(startAnchor.year, startAnchor.month, paydayDay),
    end: clampPayday(endAnchor.year, endAnchor.month, paydayDay),
    mode: 'payday',
  };
}

export function calendarMonthPeriod(today: IsoDate): Period {
  const { year, month } = parseIsoDate(today);
  const next = addMonths(year, month, 1);
  return {
    start: toIsoDate(year, month, 1),
    end: toIsoDate(next.year, next.month, 1),
    mode: 'month',
  };
}

export function currentPeriod(
  today: IsoDate,
  settings: { periodMode: PeriodMode; paydayDay: number },
): Period {
  if (settings.periodMode === 'month') return calendarMonthPeriod(today);
  return paydayPeriod(today, settings.paydayDay);
}

export function isInPeriod(date: IsoDate, period: Period): boolean {
  return date >= period.start && date < period.end;
}

function monthName(month: number): string {
  const name = MONTHS[month - 1];
  if (!name) throw new Error(`Invalid month: ${month}`);
  return name;
}

export function formatShortDate(iso: IsoDate, withYear: boolean): string {
  const { year, month, day } = parseIsoDate(iso);
  const base = `${day} ${monthName(month)}`;
  return withYear ? `${base} ${year}` : base;
}

/** Human label of the included days. The stored end date itself is excluded. */
export function formatPeriodLabel(period: Period): string {
  const last = shiftIsoDate(period.end, -1);
  const start = parseIsoDate(period.start);
  const end = parseIsoDate(last);
  const withYear = start.year !== end.year;
  return `${formatShortDate(period.start, withYear)} – ${formatShortDate(last, withYear)}`;
}

function stockholmPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const value = parts.find((part) => part.type === type)?.value;
  if (!value) throw new Error(`Missing Stockholm date part: ${type}`);
  return value;
}

export function stockholmToday(now: Date = new Date()): IsoDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  return `${stockholmPart(parts, 'year')}-${stockholmPart(parts, 'month')}-${stockholmPart(parts, 'day')}`;
}
