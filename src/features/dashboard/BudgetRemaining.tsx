import { formatSek } from '../../domain/money/sek';

export function BudgetRemaining({ remainingOre }: { remainingOre: number | null }) {
  if (remainingOre === null) return null;
  if (remainingOre < 0) {
    return <p className="budget over">{formatSek(Math.abs(remainingOre))} over budget</p>;
  }
  return <p className="budget left">{formatSek(remainingOre)} left</p>;
}
