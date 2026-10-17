import { formatSek } from '../../domain/money/sek';
import { formatShortDate, type IsoDate } from '../../domain/periods/period';
import type { Purchase } from '../../domain/purchases/types';

export function PurchaseList({
  purchases,
  today,
  editingId,
  onEdit,
  onDelete,
}: {
  purchases: readonly Purchase[];
  today: IsoDate;
  editingId: string | null;
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="panel" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="panel-title">
        Recent
      </h2>
      {purchases.length === 0 ? (
        <p className="empty">Nothing logged this period yet.</p>
      ) : (
        <ul className="purchase-list">
          {purchases.map((purchase) => {
            const showYear = purchase.purchasedOn.slice(0, 4) !== today.slice(0, 4);
            return (
              <li key={purchase.id} className={purchase.id === editingId ? 'purchase-row editing' : 'purchase-row'}>
                <button type="button" className="purchase-main" onClick={() => onEdit(purchase)}>
                  <span className="purchase-top">
                    <span className="purchase-merchant">{purchase.merchant}</span>
                    <span className="purchase-amount">{formatSek(purchase.amountOre)}</span>
                  </span>
                  <span className="purchase-meta">{formatShortDate(purchase.purchasedOn, showYear)}</span>
                  {purchase.comment && <span className="purchase-comment">{purchase.comment}</span>}
                </button>
                <button
                  type="button"
                  className="purchase-delete"
                  aria-label={`Delete ${purchase.merchant}`}
                  onClick={() => onDelete(purchase.id)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
