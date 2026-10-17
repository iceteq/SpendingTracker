import { describe, expect, it } from 'vitest';
import { reducer, type SpendingState } from './reducer';
import type { Purchase } from './types';

function purchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 'p1',
    merchant: 'Lidl',
    amountOre: 1000,
    comment: null,
    purchasedOn: '2026-10-17',
    createdAt: '2026-10-17T10:00:00.000Z',
    updatedAt: '2026-10-17T10:00:00.000Z',
    ...overrides,
  };
}

function state(purchases: Purchase[] = [purchase()]): SpendingState {
  return {
    purchases,
    pendingDelete: null,
    settings: { paydayDay: 25, periodMode: 'payday', monthlyBudgetOre: null },
  };
}

describe('reducer', () => {
  it('adds, edits, and keeps the original purchase date', () => {
    const added = reducer(state([]), { type: 'add', purchase: purchase() });
    expect(added.purchases).toHaveLength(1);

    const edited = reducer(added, {
      type: 'update',
      id: 'p1',
      now: '2026-10-18T10:00:00.000Z',
      draft: { merchant: 'Willys', amountOre: 2500, comment: 'bread' },
    });
    expect(edited.purchases[0]).toMatchObject({
      id: 'p1',
      merchant: 'Willys',
      amountOre: 2500,
      comment: 'bread',
      purchasedOn: '2026-10-17',
      createdAt: '2026-10-17T10:00:00.000Z',
      updatedAt: '2026-10-18T10:00:00.000Z',
    });
  });

  it('deletes with undo and can expire the undo', () => {
    const deleted = reducer(state(), { type: 'delete', id: 'p1' });
    expect(deleted.purchases).toEqual([]);
    expect(deleted.pendingDelete?.id).toBe('p1');

    const restored = reducer(deleted, { type: 'undo-delete' });
    expect(restored.purchases.map((item) => item.id)).toEqual(['p1']);
    expect(restored.pendingDelete).toBeNull();

    const expired = reducer(deleted, { type: 'expire-undo' });
    expect(expired.pendingDelete).toBeNull();
    expect(expired.purchases).toEqual([]);
  });

  it('ignores invalid drafts and missing ids', () => {
    const initial = state();
    expect(reducer(initial, { type: 'delete', id: 'missing' })).toBe(initial);
    expect(
      reducer(initial, {
        type: 'add',
        purchase: purchase({ id: 'bad', amountOre: 0 }),
      }).purchases,
    ).toHaveLength(1);
    expect(reducer(initial, { type: 'undo-delete' })).toBe(initial);
  });
});
