import { isInPeriod, type Period } from '../periods/period';
import type { Purchase } from './types';

export function totalOreInPeriod(
  purchases: readonly Pick<Purchase, 'amountOre' | 'purchasedOn'>[],
  period: Period,
): number {
  return purchases.reduce((sum, purchase) => {
    return isInPeriod(purchase.purchasedOn, period) ? sum + purchase.amountOre : sum;
  }, 0);
}

export function budgetRemaining(totalOre: number, budgetOre: number | null): number | null {
  if (budgetOre === null) return null;
  return budgetOre - totalOre;
}

export function comparePurchasesDesc(a: Purchase, b: Purchase): number {
  if (a.purchasedOn !== b.purchasedOn) return a.purchasedOn < b.purchasedOn ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

export function purchasesInPeriod(purchases: readonly Purchase[], period: Period): Purchase[] {
  return purchases.filter((purchase) => isInPeriod(purchase.purchasedOn, period)).sort(comparePurchasesDesc);
}
