import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import {
  buildAddPurchasePath,
  buildAddPurchaseUrl,
  resolveQrOrigin,
  resolveStoreParam,
  sanitizeQrSvg,
  storeParamFromUrl,
} from './qr-url';

describe('store links', () => {
  it.each([
    ['lidl', 'Lidl', 'lidl'],
    ['willys', 'Willys', 'willys'],
    ['LIDL', 'Lidl', 'lidl'],
    [' ica ', 'ICA', 'ica'],
    ['%69%63%61', 'ICA', 'ica'],
    ['citygross', 'City Gross', 'citygross'],
    ['hemkop', 'Hemköp', 'hemkop'],
  ])('preselects %s and focuses the amount', (raw, merchant, slug) => {
    expect(resolveStoreParam(raw)).toEqual({
      status: 'known',
      merchant,
      slug,
      focus: 'amount',
    });
  });

  it('leaves the form blank when no store is provided', () => {
    expect(resolveStoreParam(null)).toEqual({ status: 'absent', merchant: '', focus: 'merchant' });
    expect(resolveStoreParam('   ')).toEqual({ status: 'absent', merchant: '', focus: 'merchant' });
  });

  it('does not preselect an unknown store', () => {
    expect(resolveStoreParam('notastore')).toEqual({
      status: 'unknown',
      merchant: '',
      slug: 'notastore',
      focus: 'merchant',
    });
  });

  it.each(['../admin', 'lidl&token=secret', 'lidl/extra', 'a'.repeat(41), '%', 'city gross', 'https://evil.test'])(
    'rejects %s',
    (raw) => {
      expect(resolveStoreParam(raw).status).toBe('invalid');
      expect(resolveStoreParam(raw).focus).toBe('merchant');
    },
  );

  it('ignores amount, token, and other parameters', () => {
    const link = storeParamFromUrl('https://tracker.example/add?store=lidl&token=secret&amount=50&password=no');
    expect(link).toEqual({ status: 'known', merchant: 'Lidl', slug: 'lidl', focus: 'amount' });
  });
});

describe('QR urls', () => {
  it('builds a store-only path and absolute url', () => {
    expect(buildAddPurchasePath('willys')).toBe('/add?store=willys');
    const url = buildAddPurchaseUrl('https://tracker.example/any/path', 'lidl');
    expect(url).toBe('https://tracker.example/add?store=lidl');
    expect([...new URL(url).searchParams.keys()]).toEqual(['store']);
    expect(url.toLowerCase()).not.toMatch(/password|token|secret|household|amount|auth|email/);
    expect(new URL(url).username).toBe('');
    expect(new URL(url).password).toBe('');
    expect(new URL(url).hash).toBe('');
  });

  it('strips credentials from the origin', () => {
    expect(buildAddPurchaseUrl('https://user:secret@tracker.example/path', 'lidl')).toBe(
      'https://tracker.example/add?store=lidl',
    );
  });

  it('refuses unknown stores and non-http origins', () => {
    expect(() => buildAddPurchaseUrl('https://tracker.example', 'nope')).toThrow(/Unknown store/);
    expect(() => buildAddPurchaseUrl('javascript:alert(1)', 'lidl')).toThrow(/Invalid origin/);
    expect(() => buildAddPurchasePath('notastore')).toThrow(/Unknown store/);
  });

  it('prefers a safe configured origin', () => {
    expect(resolveQrOrigin('https://pay.example/app/', 'http://localhost:5173')).toBe('https://pay.example');
    expect(resolveQrOrigin('https://user:pass@pay.example', 'http://localhost:5173')).toBe('https://pay.example');
    expect(resolveQrOrigin('javascript:alert(1)', 'http://localhost:5173')).toBe('http://localhost:5173');
    expect(resolveQrOrigin(undefined, 'http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173');
  });

  it('renders a store url to svg without embedding secrets', async () => {
    const url = buildAddPurchaseUrl('https://tracker.example', 'willys');
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'Q',
      color: { dark: '#000000', light: '#ffffff' },
    });
    const safe = sanitizeQrSvg(svg);
    expect(safe?.startsWith('<svg')).toBe(true);
    expect(safe).not.toMatch(/<script/i);
    expect(safe?.toLowerCase()).not.toMatch(/password|token|household/);
  });

  it('rejects svg markup that contains a script', () => {
    expect(sanitizeQrSvg('<svg></svg><script>alert(1)</script>')).toBeNull();
    expect(sanitizeQrSvg('<?xml version="1.0"?><svg></svg>')).toBe('<svg></svg>');
  });
});
