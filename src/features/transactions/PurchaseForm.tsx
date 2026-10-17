import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { PurchaseDraft } from '../../domain/purchases/types';
import type { AmountIssue, PurchaseIssues } from '../../domain/purchases/validate';
import { validatePurchase } from '../../domain/purchases/validate';
import { AmountField } from './AmountField';
import { MerchantField } from './MerchantField';

function amountMessage(issue: AmountIssue): string {
  switch (issue) {
    case 'empty':
      return 'Enter an amount';
    case 'invalid':
      return 'Use a number like 249,50';
    case 'negative':
      return 'Amount must be positive';
    case 'zero':
      return 'Amount must be greater than zero';
    case 'too-large':
      return 'Amount is too large';
  }
}

function merchantMessage(issue: NonNullable<PurchaseIssues['merchant']>): string {
  switch (issue) {
    case 'required':
      return 'Enter a store';
    case 'too-long':
      return 'Store name is too long';
  }
}

export function PurchaseForm({
  mode,
  initialMerchant,
  initialAmount,
  initialComment,
  autoFocusAmount,
  purchases,
  onSubmit,
  onCancel,
}: {
  mode: 'add' | 'edit';
  initialMerchant: string;
  initialAmount: string;
  initialComment: string;
  autoFocusAmount: boolean;
  purchases: readonly { merchant: string; createdAt: string }[];
  onSubmit: (draft: PurchaseDraft) => void;
  onCancel?: () => void;
}) {
  const [merchant, setMerchant] = useState(initialMerchant);
  const [amount, setAmount] = useState(initialAmount);
  const [comment, setComment] = useState(initialComment);
  const [commentOpen, setCommentOpen] = useState(initialComment.trim().length > 0);
  const [issues, setIssues] = useState<PurchaseIssues>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const merchantRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const commentId = useId();

  useEffect(() => {
    if (!autoFocusAmount) return;
    amountRef.current?.focus();
  }, [autoFocusAmount]);

  function clearIssue(field: keyof PurchaseIssues) {
    setIssues((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const result = validatePurchase({
      merchant,
      amountRaw: amount,
      comment: commentOpen ? comment : '',
    });
    if (!result.ok) {
      setIssues(result.issues);
      if (result.issues.merchant) merchantRef.current?.focus();
      else if (result.issues.amount) amountRef.current?.focus();
      else commentRef.current?.focus();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      onSubmit(result.draft);
    } catch (error) {
      submittingRef.current = false;
      setSubmitting(false);
      throw error;
    }
  }

  return (
    <form className="purchase-form" autoComplete="off" onSubmit={handleSubmit}>
      <MerchantField
        value={merchant}
        purchases={purchases}
        error={issues.merchant ? merchantMessage(issues.merchant) : undefined}
        inputRef={merchantRef}
        onChange={(value) => {
          setMerchant(value);
          clearIssue('merchant');
        }}
        onPick={(name) => {
          setMerchant(name);
          clearIssue('merchant');
          amountRef.current?.focus();
        }}
      />
      <AmountField
        value={amount}
        error={issues.amount ? amountMessage(issues.amount) : undefined}
        inputRef={amountRef}
        onChange={(value) => {
          setAmount(value);
          clearIssue('amount');
        }}
      />
      {commentOpen ? (
        <div className="field">
          <label className="field-label" htmlFor={commentId}>
            Comment
          </label>
          <textarea
            id={commentId}
            ref={commentRef}
            className="input textarea"
            rows={2}
            maxLength={200}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              clearIssue('comment');
            }}
          />
          {issues.comment && (
            <p className="error" role="alert">
              Comment is too long
            </p>
          )}
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setComment('');
              setCommentOpen(false);
              clearIssue('comment');
            }}
          >
            Remove comment
          </button>
        </div>
      ) : (
        <button type="button" className="text-button" onClick={() => setCommentOpen(true)}>
          Add a comment
        </button>
      )}
      <div className={onCancel ? 'button-row' : undefined}>
        {onCancel && (
          <button type="button" className="button button-quiet" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button-primary" disabled={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Save purchase'}
        </button>
      </div>
    </form>
  );
}
