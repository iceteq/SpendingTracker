import { useSpending } from '../../app/SpendingProvider';

export function UndoNotice() {
  const { pendingDelete, undoDelete } = useSpending();
  if (!pendingDelete) return null;
  return (
    <div className="undo" role="status">
      <p>Removed {pendingDelete.merchant}</p>
      <button type="button" className="button button-undo" onClick={undoDelete}>
        Undo
      </button>
    </div>
  );
}
