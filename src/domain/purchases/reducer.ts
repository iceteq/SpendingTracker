import { isPersistableDraft } from './validate';
import type { HouseholdSettings, Purchase, PurchaseDraft } from './types';

export interface SpendingState {
  purchases: Purchase[];
  settings: HouseholdSettings;
  pendingDelete: Purchase | null;
}

export type SpendingAction =
  | { type: 'add'; purchase: Purchase }
  | { type: 'update'; id: string; draft: PurchaseDraft; now: string }
  | { type: 'delete'; id: string }
  | { type: 'undo-delete' }
  | { type: 'expire-undo' }
  | { type: 'replace-settings'; settings: HouseholdSettings };

export function reducer(state: SpendingState, action: SpendingAction): SpendingState {
  switch (action.type) {
    case 'add':
      if (!isPersistableDraft(action.purchase)) return state;
      if (state.purchases.some((purchase) => purchase.id === action.purchase.id)) return state;
      return { ...state, purchases: [...state.purchases, action.purchase] };
    case 'update': {
      if (!isPersistableDraft(action.draft)) return state;
      return {
        ...state,
        purchases: state.purchases.map((purchase) =>
          purchase.id === action.id
            ? {
                ...purchase,
                merchant: action.draft.merchant,
                amountOre: action.draft.amountOre,
                comment: action.draft.comment,
                updatedAt: action.now,
              }
            : purchase,
        ),
      };
    }
    case 'delete': {
      const purchase = state.purchases.find((item) => item.id === action.id);
      if (!purchase) return state;
      return {
        ...state,
        purchases: state.purchases.filter((item) => item.id !== action.id),
        pendingDelete: purchase,
      };
    }
    case 'undo-delete':
      if (!state.pendingDelete) return state;
      return {
        ...state,
        purchases: [...state.purchases, state.pendingDelete],
        pendingDelete: null,
      };
    case 'expire-undo':
      return state.pendingDelete ? { ...state, pendingDelete: null } : state;
    case 'replace-settings':
      return { ...state, settings: action.settings };
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}
