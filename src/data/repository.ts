import type { IsoDate } from '../domain/periods/period';
import type { HouseholdSettings, Purchase, PurchaseDraft } from '../domain/purchases/types';

/**
 * Data-access contract for household purchases and settings.
 * Phase 1 keeps this in memory inside SpendingProvider.
 * A later Supabase implementation can satisfy the same operations
 * without changing validation, period math, or the purchase form.
 */
export interface SpendingRepository {
  listPurchases(): readonly Purchase[];
  addPurchase(draft: PurchaseDraft, purchasedOn: IsoDate): Purchase;
  updatePurchase(id: string, draft: PurchaseDraft): void;
  deletePurchase(id: string): void;
  undoDelete(): void;
  getSettings(): HouseholdSettings;
  saveSettings(settings: HouseholdSettings): void;
}
