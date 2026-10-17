/**
 * Stable deep link for QR codes and, later, NFC tags.
 * The URL only identifies a store: `/add?store=<slug>`.
 * It must never carry amounts, account ids, or credentials.
 * NFC is not implemented; a future tag should store this same URL.
 */

import { findStoreBySlug, type Store } from './catalog';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 40;

export type StoreParam =
  | { status: 'known'; store: Store }
  | { status: 'unknown'; slug: string }
  | { status: 'invalid' }
  | { status: 'absent' };

export type StoreLink =
  | { status: 'known'; merchant: string; slug: string; focus: 'amount' }
  | { status: 'unknown'; merchant: ''; slug: string; focus: 'merchant' }
  | { status: 'invalid'; merchant: ''; focus: 'merchant' }
  | { status: 'absent'; merchant: ''; focus: 'merchant' };

export function parseStoreParam(raw: string | null): StoreParam {
  if (raw === null || raw.trim() === '') return { status: 'absent' };

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return { status: 'invalid' };
  }

  if (!SLUG_PATTERN.test(decoded) || decoded.length > MAX_SLUG_LENGTH) {
    return { status: 'invalid' };
  }

  const store = findStoreBySlug(decoded);
  if (!store) return { status: 'unknown', slug: decoded };
  return { status: 'known', store };
}

/** What `/add` should show. Opening the link never creates a purchase. */
export function resolveStoreParam(raw: string | null): StoreLink {
  const parsed = parseStoreParam(raw);
  switch (parsed.status) {
    case 'known':
      return {
        status: 'known',
        merchant: parsed.store.name,
        slug: parsed.store.slug,
        focus: 'amount',
      };
    case 'unknown':
      return { status: 'unknown', merchant: '', slug: parsed.slug, focus: 'merchant' };
    case 'invalid':
      return { status: 'invalid', merchant: '', focus: 'merchant' };
    case 'absent':
      return { status: 'absent', merchant: '', focus: 'merchant' };
  }
}

/** Read only the store slug. Amounts, tokens, and other params are ignored. */
export function storeParamFromUrl(url: string): StoreLink {
  const parsed = new URL(url, 'https://tracker.local');
  return resolveStoreParam(parsed.searchParams.get('store'));
}

function requireKnownStore(slug: string): Store {
  const store = findStoreBySlug(slug);
  if (!store) throw new Error(`Unknown store: ${slug}`);
  return store;
}

export function buildAddPurchasePath(slug: string): string {
  const store = requireKnownStore(slug);
  return `/add?${new URLSearchParams({ store: store.slug }).toString()}`;
}

export function buildAddPurchaseUrl(origin: string, slug: string): string {
  const store = requireKnownStore(slug);
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error('Invalid origin');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Invalid origin');
  }
  const url = new URL('/add', parsed.origin);
  url.searchParams.set('store', store.slug);
  return url.toString();
}

export function resolveQrOrigin(configured: string | undefined, fallbackOrigin: string): string {
  if (configured && /^https?:\/\/\S+$/.test(configured)) {
    try {
      const url = new URL(configured);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
    } catch {
      // Ignore a broken override and use the page origin.
    }
  }
  return new URL(fallbackOrigin).origin;
}

export function sanitizeQrSvg(markup: string): string | null {
  const stripped = markup
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^<\?xml[^>]*>\s*/i, '');
  if (!stripped.startsWith('<svg') || /<script/i.test(stripped)) return null;
  return stripped;
}
