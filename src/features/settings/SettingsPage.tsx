import { useState, type FormEvent } from 'react';
import { useSpending } from '../../app/SpendingProvider';
import { formatOreForInput, parseSekToOre, type MoneyFailure } from '../../domain/money/sek';
import { formatPeriodLabel, isValidPaydayDay, paydayPeriod } from '../../domain/periods/period';

function budgetMessage(reason: MoneyFailure): string {
  switch (reason) {
    case 'empty':
      return 'Enter a budget or leave it blank';
    case 'invalid':
      return 'Use a number like 12000';
    case 'negative':
      return 'Budget must be zero or more';
    case 'too-large':
      return 'Budget is too large';
  }
}

export default function SettingsPage() {
  const { settings, today, saveSettings } = useSpending();
  const [payday, setPayday] = useState(String(settings.paydayDay));
  const [budget, setBudget] = useState(
    settings.monthlyBudgetOre === null ? '' : formatOreForInput(settings.monthlyBudgetOre),
  );
  const [paydayError, setPaydayError] = useState<string | null>(null);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const paydayNumber = Number(payday.trim());
  const preview = isValidPaydayDay(paydayNumber) ? formatPeriodLabel(paydayPeriod(today, paydayNumber)) : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    let nextPaydayError: string | null = null;
    let nextBudgetError: string | null = null;
    let monthlyBudgetOre: number | null = null;

    if (!isValidPaydayDay(paydayNumber)) nextPaydayError = 'Use a day from 1 to 31';
    if (budget.trim()) {
      const parsed = parseSekToOre(budget);
      if (!parsed.ok) nextBudgetError = budgetMessage(parsed.reason);
      else monthlyBudgetOre = parsed.ore;
    }

    setPaydayError(nextPaydayError);
    setBudgetError(nextBudgetError);
    if (nextPaydayError || nextBudgetError) return;

    saveSettings({
      paydayDay: paydayNumber,
      periodMode: settings.periodMode,
      monthlyBudgetOre,
    });
    setStatus('Saved');
  }

  return (
    <main id="main" className="page">
      <form className="panel settings-form" onSubmit={handleSubmit}>
        <h2 className="panel-title">Settings</h2>
        <div className="field">
          <label className="field-label" htmlFor="payday-day">
            Payday
          </label>
          <input
            id="payday-day"
            className="input"
            inputMode="numeric"
            value={payday}
            aria-invalid={paydayError ? true : undefined}
            aria-describedby="payday-help"
            onChange={(event) => setPayday(event.target.value)}
          />
          <p id="payday-help" className="hint">
            The period runs from this day until the day before the next one. Shorter months use the last day.
          </p>
          {preview && <p className="hint">Today falls in {preview}.</p>}
          {paydayError && (
            <p className="error" role="alert">
              {paydayError}
            </p>
          )}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="budget">
            Budget
          </label>
          <input
            id="budget"
            className="input"
            inputMode="decimal"
            value={budget}
            aria-invalid={budgetError ? true : undefined}
            aria-describedby="budget-help"
            onChange={(event) => setBudget(event.target.value)}
          />
          <p id="budget-help" className="hint">
            Optional. Leave blank to hide the remaining amount. Logging a purchase is never blocked.
          </p>
          {budgetError && (
            <p className="error" role="alert">
              {budgetError}
            </p>
          )}
        </div>
        <button type="submit" className="button button-primary">
          Save settings
        </button>
        {status && (
          <p className="status" role="status">
            {status}
          </p>
        )}
        <p className="hint">Purchases in this preview stay in memory until you refresh the page.</p>
      </form>
    </main>
  );
}
