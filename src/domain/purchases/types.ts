import type { IsoDate, PeriodMode } from '../periods/period';

export interface HouseholdSettings {
  paydayDay: number;
  periodMode: PeriodMode;
  monthlyBudgetOre: number | null;
}

export interface Purchase {
  id: string;
  merchant: string;
  amountOre: number;
  comment: string | null;
  purchasedOn: IsoDate;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseDraft {
  merchant: string;
  amountOre: number;
  comment: string | null;
}
