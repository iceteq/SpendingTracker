import { MAX_PURCHASE_ORE, parseSekToOre, type MoneyFailure } from '../money/sek';
import type { PurchaseDraft } from './types';

export const MERCHANT_MAX_LENGTH = 80;
export const COMMENT_MAX_LENGTH = 200;

export type AmountIssue = MoneyFailure | 'zero';

export interface PurchaseIssues {
  merchant?: 'required' | 'too-long';
  amount?: AmountIssue;
  comment?: 'too-long';
}

export function validatePurchase(input: {
  merchant: string;
  amountRaw: string;
  comment: string;
}): { ok: true; draft: PurchaseDraft } | { ok: false; issues: PurchaseIssues } {
  const issues: PurchaseIssues = {};
  const merchant = input.merchant.trim().replace(/\s+/g, ' ');

  if (!merchant) issues.merchant = 'required';
  else if (merchant.length > MERCHANT_MAX_LENGTH) issues.merchant = 'too-long';

  const parsed = parseSekToOre(input.amountRaw);
  let amountOre = 0;
  if (!parsed.ok) issues.amount = parsed.reason;
  else if (parsed.ore === 0) issues.amount = 'zero';
  else amountOre = parsed.ore;

  const commentText = input.comment.trim();
  let comment: string | null = null;
  if (commentText.length > COMMENT_MAX_LENGTH) issues.comment = 'too-long';
  else if (commentText.length > 0) comment = commentText;

  if (issues.merchant || issues.amount || issues.comment) return { ok: false, issues };
  return { ok: true, draft: { merchant, amountOre, comment } };
}

export function isPersistableDraft(draft: PurchaseDraft): boolean {
  const merchant = draft.merchant.trim();
  if (!merchant || merchant.length > MERCHANT_MAX_LENGTH) return false;
  if (draft.comment !== null && (draft.comment.length === 0 || draft.comment.length > COMMENT_MAX_LENGTH)) {
    return false;
  }
  return Number.isSafeInteger(draft.amountOre) && draft.amountOre > 0 && draft.amountOre <= MAX_PURCHASE_ORE;
}
