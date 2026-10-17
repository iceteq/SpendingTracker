import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSpending } from '../../app/SpendingProvider';
import { formatSek } from '../../domain/money/sek';
import { formatPeriodLabel } from '../../domain/periods/period';
import type { Purchase, PurchaseDraft } from '../../domain/purchases/types';
import { resolveStoreParam } from '../../domain/stores/qr-url';
import { PurchaseForm } from './PurchaseForm';

function seedFromStore(rawStore: string | null): { merchant: string; focusAmount: boolean; round: number } {
  const link = resolveStoreParam(rawStore);
  return {
    merchant: link.status === 'known' ? link.merchant : '',
    focusAmount: link.focus === 'amount',
    round: 0,
  };
}

export function AddPurchasePage() {
  const spending = useSpending();
  const [params] = useSearchParams();
  const rawStore = params.get('store');
  const link = resolveStoreParam(rawStore);
  const [saved, setSaved] = useState<Purchase | null>(null);
  const [formSeed, setFormSeed] = useState(() => seedFromStore(rawStore));

  useEffect(() => {
    setSaved(null);
    setFormSeed(seedFromStore(rawStore));
  }, [rawStore]);

  const periodLabel = spending.period.mode === 'month' ? 'This month' : 'Since payday';

  function save(draft: PurchaseDraft) {
    setSaved(spending.addPurchase(draft, spending.today));
  }

  return (
    <main id="main" className="page">
      <p className="add-total">
        <span>{periodLabel}</span>
        <strong>{formatSek(spending.totalOre)}</strong>
      </p>
      {saved ? (
        <section className="panel confirm" role="status">
          <p className="hero-label">Saved</p>
          <p className="hero-amount">{formatSek(saved.amountOre)}</p>
          <p className="confirm-merchant">{saved.merchant}</p>
          {saved.comment && <p className="purchase-comment">{saved.comment}</p>}
          <p className="confirm-total">
            {periodLabel} {formatSek(spending.totalOre)}
          </p>
          <p className="period-dates">{formatPeriodLabel(spending.period)}</p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setFormSeed({ merchant: saved.merchant, focusAmount: true, round: formSeed.round + 1 });
                setSaved(null);
              }}
            >
              Add another
            </button>
            <Link to="/" className="button button-quiet">
              Done
            </Link>
          </div>
        </section>
      ) : (
        <>
          {link.status === 'unknown' && formSeed.round === 0 && (
            <p className="notice" role="status">
              Unknown store <strong>{link.slug}</strong>. Choose a store or type a name. No purchase was added.
            </p>
          )}
          {link.status === 'invalid' && formSeed.round === 0 && (
            <p className="notice" role="status">
              This store link is invalid. Choose a store or type a name. No purchase was added.
            </p>
          )}
          {formSeed.focusAmount && formSeed.merchant && (
            <p className="status" role="status">
              {formSeed.merchant} selected. Enter the amount.
            </p>
          )}
          <div className="panel add-panel">
            <h2 className="panel-title">Add purchase</h2>
            <PurchaseForm
              key={`${formSeed.round}-${formSeed.merchant}`}
              mode="add"
              initialMerchant={formSeed.merchant}
              initialAmount=""
              initialComment=""
              autoFocusAmount={formSeed.focusAmount}
              purchases={spending.purchases}
              onSubmit={save}
            />
          </div>
        </>
      )}
    </main>
  );
}
