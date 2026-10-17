/** Largest single amount accepted: 1 000 000 kr. */
export const MAX_PURCHASE_ORE = 1_000_000 * 100;

export type MoneyFailure = 'empty' | 'invalid' | 'negative' | 'too-large';

export type MoneyParse = { ok: true; ore: number } | { ok: false; reason: MoneyFailure };

const AMOUNT_PATTERN = /^(?:\d+|\d*[.,]\d+)$/;
const SPACES = /[ \u00A0\u202F]/g;

/**
 * Parse a SEK entry into integer öre.
 * Accepts `249`, `249,50`, `249.50`, and narrow spaces. Zero is a successful
 * parse; purchase validation rejects it. Negatives and junk are not amounts.
 */
export function parseSekToOre(input: string): MoneyParse {
  const cleaned = input.trim().replace(SPACES, '');
  if (!cleaned) return { ok: false, reason: 'empty' };
  if (cleaned.startsWith('-') || cleaned.startsWith('−')) {
    return { ok: false, reason: 'negative' };
  }
  if (!AMOUNT_PATTERN.test(cleaned)) return { ok: false, reason: 'invalid' };

  const separatorIndex = cleaned.search(/[.,]/);
  const whole = separatorIndex === -1 ? cleaned : cleaned.slice(0, separatorIndex);
  const fraction = separatorIndex === -1 ? '' : cleaned.slice(separatorIndex + 1);
  if (whole.length > 9) return { ok: false, reason: 'too-large' };

  let ore = BigInt(whole.length === 0 ? '0' : whole) * 100n;
  if (fraction.length > 0) {
    ore += BigInt(`${fraction}00`.slice(0, 2));
    const roundDigit = fraction[2];
    if (roundDigit !== undefined && roundDigit >= '5') ore += 1n;
  }

  if (ore > BigInt(MAX_PURCHASE_ORE)) return { ok: false, reason: 'too-large' };
  return { ok: true, ore: Number(ore) };
}

const currencyFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatSek(ore: number): string {
  if (!Number.isInteger(ore)) throw new Error('Amount must be an integer number of öre');
  const negative = ore < 0;
  const absolute = Math.abs(ore);
  const decimal = `${negative ? '-' : ''}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`;
  return currencyFormatter.format(Number(decimal));
}

/** Editable field text. Whole kronor stay free of a trailing ,00. */
export function formatOreForInput(ore: number): string {
  if (!Number.isInteger(ore) || ore < 0) {
    throw new Error('Amount must be a non-negative integer number of öre');
  }
  const kronor = Math.trunc(ore / 100);
  const cents = ore % 100;
  if (cents === 0) return String(kronor);
  return `${kronor},${String(cents).padStart(2, '0')}`;
}
