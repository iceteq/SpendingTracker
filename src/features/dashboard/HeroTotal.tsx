import { formatSek } from '../../domain/money/sek';
import type { PeriodMode } from '../../domain/periods/period';

export function HeroTotal({ totalOre, periodMode }: { totalOre: number; periodMode: PeriodMode }) {
  const label = periodMode === 'month' ? 'Spent this month' : 'Spent since payday';
  return (
    <section className="hero" aria-live="polite">
      <p className="hero-label">{label}</p>
      <p className="hero-amount">{formatSek(totalOre)}</p>
    </section>
  );
}
