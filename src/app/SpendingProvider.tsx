import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { createInitialState } from '../data/seed';
import { MAX_PURCHASE_ORE } from '../domain/money/sek';
import { currentPeriod, isValidPaydayDay, stockholmToday, type IsoDate, type Period } from '../domain/periods/period';
import { budgetRemaining, totalOreInPeriod } from '../domain/purchases/queries';
import { reducer } from '../domain/purchases/reducer';
import type { HouseholdSettings, Purchase, PurchaseDraft } from '../domain/purchases/types';

const UNDO_MS = 8000;

interface SpendingContextValue {
  purchases: readonly Purchase[];
  settings: HouseholdSettings;
  today: IsoDate;
  period: Period;
  totalOre: number;
  remainingOre: number | null;
  pendingDelete: Purchase | null;
  addPurchase: (draft: PurchaseDraft, purchasedOn: IsoDate) => Purchase;
  updatePurchase: (id: string, draft: PurchaseDraft) => void;
  deletePurchase: (id: string) => void;
  undoDelete: () => void;
  saveSettings: (settings: HouseholdSettings) => void;
}

const SpendingContext = createContext<SpendingContextValue | null>(null);

export function SpendingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, createInitialState(stockholmToday()));

  useEffect(() => {
    if (!state.pendingDelete) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'expire-undo' }), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [state.pendingDelete]);

  const today = stockholmToday();
  const period = currentPeriod(today, state.settings);
  const totalOre = totalOreInPeriod(state.purchases, period);

  const value: SpendingContextValue = {
    purchases: state.purchases,
    settings: state.settings,
    today,
    period,
    totalOre,
    remainingOre: budgetRemaining(totalOre, state.settings.monthlyBudgetOre),
    pendingDelete: state.pendingDelete,
    addPurchase(draft, purchasedOn) {
      const now = new Date().toISOString();
      const purchase: Purchase = {
        id: crypto.randomUUID(),
        merchant: draft.merchant,
        amountOre: draft.amountOre,
        comment: draft.comment,
        purchasedOn,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'add', purchase });
      return purchase;
    },
    updatePurchase(id, draft) {
      dispatch({ type: 'update', id, draft, now: new Date().toISOString() });
    },
    deletePurchase(id) {
      dispatch({ type: 'delete', id });
    },
    undoDelete() {
      dispatch({ type: 'undo-delete' });
    },
    saveSettings(settings) {
      if (!isValidPaydayDay(settings.paydayDay)) return;
      const budget = settings.monthlyBudgetOre;
      if (budget !== null && (!Number.isSafeInteger(budget) || budget < 0 || budget > MAX_PURCHASE_ORE)) return;
      dispatch({
        type: 'replace-settings',
        settings: {
          paydayDay: settings.paydayDay,
          periodMode: settings.periodMode,
          monthlyBudgetOre: budget,
        },
      });
    },
  };

  return <SpendingContext.Provider value={value}>{children}</SpendingContext.Provider>;
}

export function useSpending(): SpendingContextValue {
  const value = useContext(SpendingContext);
  if (!value) throw new Error('useSpending must be used within SpendingProvider');
  return value;
}
