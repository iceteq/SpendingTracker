import { describe, expect, it } from 'vitest';
import { formatOreForInput, formatSek, parseSekToOre } from './sek';

function normalize(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, ' ');
}

describe('parseSekToOre', () => {
  it.each([
    ['249', 24_900],
    ['249,50', 24_950],
    ['249.50', 24_950],
    ['249,5', 24_950],
    ['  249  ', 24_900],
    ['1 249,50', 124_950],
    ['1\u00A0249,50', 124_950],
    ['1\u202F249.50', 124_950],
    ['007', 700],
    [',50', 50],
    ['.5', 50],
    ['249,505', 24_951],
    ['249,504', 24_950],
    ['1,995', 200],
    ['0,005', 1],
    ['0,004', 0],
    ['0', 0],
    ['0,00', 0],
    ['1000000', 100_000_000],
    ['1000000,004', 100_000_000],
  ])('parses %s as %i öre', (input, ore) => {
    expect(parseSekToOre(input)).toEqual({ ok: true, ore });
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['-10', 'negative'],
    ['−249,50', 'negative'],
    ['abc', 'invalid'],
    ['12.34.56', 'invalid'],
    ['249,', 'invalid'],
    ['249,50 kr', 'invalid'],
    ['1e2', 'invalid'],
    ['+249', 'invalid'],
    ['1000000,01', 'too-large'],
    ['100000000', 'too-large'],
    ['1000000000', 'too-large'],
  ] as const)('rejects %s as %s', (input, reason) => {
    expect(parseSekToOre(input)).toEqual({ ok: false, reason });
  });
});

describe('formatSek', () => {
  it('formats öre with Swedish kronor', () => {
    expect(normalize(formatSek(24_950))).toBe('249,50 kr');
    expect(normalize(formatSek(842_000))).toBe('8 420,00 kr');
    expect(normalize(formatSek(1))).toBe('0,01 kr');
    expect(normalize(formatSek(0))).toBe('0,00 kr');
    expect(normalize(formatSek(-15_050))).toMatch(/-150,50 kr|−150,50 kr/);
  });

  it('refuses fractional öre', () => {
    expect(() => formatSek(1.5)).toThrow();
  });
});

describe('formatOreForInput', () => {
  it('round-trips through the parser', () => {
    for (const ore of [50, 24_900, 24_950, 1_200_000]) {
      expect(parseSekToOre(formatOreForInput(ore))).toEqual({ ok: true, ore });
    }
    expect(formatOreForInput(24_950)).toBe('249,50');
    expect(formatOreForInput(24_900)).toBe('249');
    expect(formatOreForInput(50)).toBe('0,50');
  });
});
