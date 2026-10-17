import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpending } from '../../app/SpendingProvider';
import { formatOreForInput, formatSek } from '../../domain/money/sek';
import { purchasesInPeriod } from '../../domain/purchases/queries';
import type { Purchase, PurchaseDraft } from '../../domain/purchases/types';
import { PurchaseForm } from '../transactions/PurchaseForm';
import { PurchaseList } from '../transactions/PurchaseList';
import { UndoNotice } from '../transactions/UndoNotice';
import { BudgetRemaining } from './BudgetRemaining';
import { HeroTotal } from './HeroTotal';
import { PeriodBar } from './PeriodBar';

export function DashboardPage() {
  const spending = useSpending();
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const periodPurchases = useMemo(
    () => purchasesInPeriod(spending.purchases, spending.period),
    [spending.purchases, spending.period],
  );

  useEffect(() => {
    if (!status) return undefined;
    const timer = window.setTimeout(() => setStatus(null), 2500);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!editing) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }, [editing]);

  function save(draft: PurchaseDraft) {
    if (editing) {
      spending.updatePurchase(editing.id, draft);
      setEditing(null);
      setStatus(`Updated ${draft.merchant}`);
      return;
    }
    spending.addPurchase(draft, spending.today);
    setGeneration((value) => value + 1);
    setStatus(`Saved ${formatSek(draft.amountOre)} at ${draft.merchant}`);
  }

  return (
    <main id="main" className="page">
      <HeroTotal totalOre={spending.totalOre} periodMode={spending.period.mode} />
      <PeriodBar
        period={spending.period}
        onChange={(periodMode) => spending.saveSettings({ ...spending.settings, periodMode })}
      />
      <BudgetRemaining remainingOre={spending.remainingOre} />
      <div className="panel add-panel" ref={panelRef}>
        <h2 className="panel-title">{editing ? 'Edit purchase' : 'Add purchase'}</h2>
        <PurchaseForm
          key={editing ? `edit-${editing.id}` : `new-${generation}`}
          mode={editing ? 'edit' : 'add'}
          initialMerchant={editing?.merchant ?? ''}
          initialAmount={editing ? formatOreForInput(editing.amountOre) : ''}
          initialComment={editing?.comment ?? ''}
          autoFocusAmount={false}
          purchases={spending.purchases}
          onSubmit={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </div>
      {status && (
        <p className="status" role="status">
          {status}
        </p>
      )}
      <PurchaseList
        purchases={periodPurchases}
        today={spending.today}
        editingId={editing?.id ?? null}
        onEdit={(purchase) => {
          setEditing(purchase);
          setStatus(null);
        }}
        onDelete={(id) => {
          spending.deletePurchase(id);
          if (editing?.id === id) setEditing(null);
          setStatus(null);
        }}
      />
      <UndoNotice />
    </main>
  );
}
