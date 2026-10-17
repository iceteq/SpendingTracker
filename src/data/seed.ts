import { paydayPeriod, shiftIsoDate, type IsoDate } from '../domain/periods/period';
import type { SpendingState } from '../domain/purchases/reducer';
import type { HouseholdSettings, Purchase } from '../domain/purchases/types';

export const DEFAULT_SETTINGS: HouseholdSettings = {
  paydayDay: 25,
  periodMode: 'payday',
  monthlyBudgetOre: 1_200_000,
};

function at(day: IsoDate, hour: number): string {
  return `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`;
}

function sample(
  id: string,
  merchant: string,
  amountOre: number,
  purchasedOn: IsoDate,
  hour: number,
  comment: string | null,
): Purchase {
  const createdAt = at(purchasedOn, hour);
  return { id, merchant, amountOre, comment, purchasedOn, createdAt, updatedAt: createdAt };
}

export function createInitialState(today: IsoDate): SpendingState {
  const settings = { ...DEFAULT_SETTINGS };
  const period = paydayPeriod(today, settings.paydayDay);
  const within = (offset: number): IsoDate => {
    const date = shiftIsoDate(today, offset);
    if (date >= period.start && date < period.end) return date;
    return period.start;
  };

  return {
    settings,
    pendingDelete: null,
    purchases: [
      sample('seed-1', 'Lidl', 24_950, within(0), 18, null),
      sample('seed-2', 'Willys', 31_200, within(-1), 16, 'Fruit and yoghurt'),
      sample('seed-3', 'ICA', 8_690, within(-2), 14, null),
      sample('seed-4', 'Lidl', 6_400, period.start, 12, null),
      sample('seed-5', 'Coop', 99_900, shiftIsoDate(period.start, -3), 8, null),
    ],
  };
}
