export interface Store {
  slug: string;
  name: string;
}

/** Allowlist for QR links. Free-text stores are still allowed when typing. */
export const STORE_CATALOG: readonly Store[] = [
  { slug: 'lidl', name: 'Lidl' },
  { slug: 'willys', name: 'Willys' },
  { slug: 'ica', name: 'ICA' },
  { slug: 'coop', name: 'Coop' },
  { slug: 'hemkop', name: 'Hemköp' },
  { slug: 'citygross', name: 'City Gross' },
];

export function findStoreBySlug(slug: string): Store | undefined {
  const key = slug.trim().toLowerCase();
  return STORE_CATALOG.find((store) => store.slug === key);
}
