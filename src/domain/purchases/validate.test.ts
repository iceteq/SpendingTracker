import { describe, expect, it } from 'vitest';
import { COMMENT_MAX_LENGTH, MERCHANT_MAX_LENGTH, validatePurchase } from './validate';

describe('validatePurchase', () => {
  it('accepts a store, a positive amount, and an optional comment', () => {
    expect(
      validatePurchase({ merchant: '  Lidl  ', amountRaw: '249,50', comment: '  milk  ' }),
    ).toEqual({
      ok: true,
      draft: { merchant: 'Lidl', amountOre: 24_950, comment: 'milk' },
    });
    expect(validatePurchase({ merchant: 'Corner shop', amountRaw: '80', comment: '   ' })).toEqual({
      ok: true,
      draft: { merchant: 'Corner shop', amountOre: 8_000, comment: null },
    });
  });

  it('rejects an empty store, a zero amount, and oversized text', () => {
    expect(validatePurchase({ merchant: '  ', amountRaw: '', comment: '' })).toEqual({
      ok: false,
      issues: { merchant: 'required', amount: 'empty' },
    });
    expect(validatePurchase({ merchant: 'Lidl', amountRaw: '0,00', comment: '' })).toMatchObject({
      ok: false,
      issues: { amount: 'zero' },
    });
    expect(validatePurchase({ merchant: 'Lidl', amountRaw: '-5', comment: '' })).toMatchObject({
      ok: false,
      issues: { amount: 'negative' },
    });
    expect(
      validatePurchase({
        merchant: 'A'.repeat(MERCHANT_MAX_LENGTH + 1),
        amountRaw: '10',
        comment: 'B'.repeat(COMMENT_MAX_LENGTH + 1),
      }),
    ).toMatchObject({
      ok: false,
      issues: { merchant: 'too-long', comment: 'too-long' },
    });
  });
});
