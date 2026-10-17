import { describe, expect, it } from 'vitest';
import { merchantSuggestions } from './suggestions';

describe('merchantSuggestions', () => {
  it('offers the catalog when nothing has been logged', () => {
    expect(merchantSuggestions([], '')).toEqual(['Lidl', 'Willys', 'ICA', 'Coop', 'Hemköp', 'City Gross']);
    expect(merchantSuggestions([], 'hem')).toEqual(['Hemköp']);
    expect(merchantSuggestions([], 'zzz')).toEqual([]);
  });

  it('sorts by frequency, then recency, and merges casing with the catalog', () => {
    const names = merchantSuggestions(
      [
        { merchant: 'lidl', createdAt: '2026-10-01T10:00:00.000Z' },
        { merchant: 'Lidl', createdAt: '2026-10-17T10:00:00.000Z' },
        { merchant: 'Willys', createdAt: '2026-10-16T10:00:00.000Z' },
        { merchant: 'ICA', createdAt: '2026-10-15T10:00:00.000Z' },
        { merchant: 'Bakery', createdAt: '2026-10-17T12:00:00.000Z' },
      ],
      '',
      8,
    );
    expect(names.slice(0, 4)).toEqual(['Lidl', 'Bakery', 'Willys', 'ICA']);
    expect(names).toContain('City Gross');
    expect(names.filter((name) => name.toLowerCase() === 'lidl')).toEqual(['Lidl']);
  });

  it('filters by the typed text', () => {
    expect(merchantSuggestions([{ merchant: 'Willys', createdAt: '2026-10-16T10:00:00.000Z' }], 'wil')).toEqual([
      'Willys',
    ]);
    expect(merchantSuggestions([], 'city g')).toEqual(['City Gross']);
  });
});
