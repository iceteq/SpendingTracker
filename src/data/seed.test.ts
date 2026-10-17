import { describe, expect, it } from 'vitest';
import { calendarMonthPeriod, paydayPeriod } from '../domain/periods/period';
import { purchasesInPeriod, totalOreInPeriod } from '../domain/purchases/queries';
import { createInitialState } from './seed';

describe('seed purchases', () => {
  it('counts the open payday period and leaves the older Coop purchase out', () => {
    const state = createInitialState('2026-10-17');
    const payday = paydayPeriod('2026-10-17', 25);
    const month = calendarMonthPeriod('2026-10-17');
    const listed = purchasesInPeriod(state.purchases, payday);

    expect(payday).toEqual({ start: '2026-09-25', end: '2026-10-25', mode: 'payday' });
    expect(totalOreInPeriod(state.purchases, payday)).toBe(71_240);
    expect(totalOreInPeriod(state.purchases, month)).toBe(64_840);
    expect(listed.map((purchase) => [purchase.merchant, purchase.purchasedOn])).toEqual([
      ['Lidl', '2026-10-17'],
      ['Willys', '2026-10-16'],
      ['ICA', '2026-10-15'],
      ['Lidl', '2026-09-25'],
    ]);
    expect(listed.find((purchase) => purchase.merchant === 'Willys')?.comment).toBe('Fruit and yoghurt');
    expect(state.purchases.some((purchase) => purchase.merchant === 'Coop')).toBe(true);
  });
});
