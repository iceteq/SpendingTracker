import { STORE_CATALOG } from '../stores/catalog';

export interface SuggestionSource {
  merchant: string;
  createdAt: string;
}

interface SuggestionRow {
  name: string;
  count: number;
  latest: string;
  catalogIndex: number;
}

function canonicalName(merchant: string): string {
  const compact = merchant.trim().replace(/\s+/g, ' ');
  const key = compact.toLowerCase();
  const store = STORE_CATALOG.find((item) => item.slug === key || item.name.toLowerCase() === key);
  return store?.name ?? compact;
}

function catalogIndex(name: string): number {
  const key = name.toLowerCase();
  const index = STORE_CATALOG.findIndex((store) => store.slug === key || store.name.toLowerCase() === key);
  return index === -1 ? STORE_CATALOG.length : index;
}

/** Frequent stores first, then the printed catalog. Free-text names stay in the list. */
export function merchantSuggestions(
  purchases: readonly SuggestionSource[],
  query: string,
  limit = 6,
): string[] {
  const rows = new Map<string, SuggestionRow>();

  for (const purchase of purchases) {
    const name = canonicalName(purchase.merchant);
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = rows.get(key);
    if (!existing) {
      rows.set(key, { name, count: 1, latest: purchase.createdAt, catalogIndex: catalogIndex(name) });
      continue;
    }
    existing.count += 1;
    if (purchase.createdAt >= existing.latest) {
      existing.latest = purchase.createdAt;
      existing.name = name;
    }
  }

  const listed = new Set([...rows.values()].map((row) => row.name.toLowerCase()));
  STORE_CATALOG.forEach((store, index) => {
    if (listed.has(store.name.toLowerCase())) return;
    rows.set(store.slug, { name: store.name, count: 0, latest: '', catalogIndex: index });
  });

  const needle = query.trim().toLowerCase();
  const filtered = [...rows.values()].filter((row) =>
    needle.length === 0 ? true : row.name.toLowerCase().includes(needle),
  );

  filtered.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.latest !== b.latest) return a.latest < b.latest ? 1 : -1;
    if (a.catalogIndex !== b.catalogIndex) return a.catalogIndex - b.catalogIndex;
    return a.name.localeCompare(b.name, 'sv');
  });

  return filtered.slice(0, limit).map((row) => row.name);
}
