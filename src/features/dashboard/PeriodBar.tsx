import { formatPeriodLabel, type Period, type PeriodMode } from '../../domain/periods/period';

export function PeriodBar({ period, onChange }: { period: Period; onChange: (mode: PeriodMode) => void }) {
  return (
    <div className="period-bar">
      <p className="period-dates">{formatPeriodLabel(period)}</p>
      <div className="segment" role="group" aria-label="Period">
        <button type="button" aria-pressed={period.mode === 'payday'} onClick={() => onChange('payday')}>
          Payday
        </button>
        <button type="button" aria-pressed={period.mode === 'month'} onClick={() => onChange('month')}>
          Month
        </button>
      </div>
    </div>
  );
}
