import { useId, useState, type KeyboardEvent, type RefObject } from 'react';
import { merchantSuggestions } from '../../domain/purchases/suggestions';
import type { Purchase } from '../../domain/purchases/types';

export function MerchantField({
  value,
  onChange,
  onPick,
  error,
  purchases,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (name: string) => void;
  error?: string;
  purchases: readonly Pick<Purchase, 'merchant' | 'createdAt'>[];
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const listId = useId();
  const errorId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const chips = merchantSuggestions(purchases, '', 6);
  const matches = value.trim() ? merchantSuggestions(purchases, value, 6) : [];
  const showMatches = open && matches.length > 0;

  function choose(name: string) {
    onPick(name);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' || !showMatches) return;
    const exact = matches.some((name) => name.toLowerCase() === value.trim().toLowerCase());
    const first = matches[0];
    if (!exact && first) {
      event.preventDefault();
      choose(first);
    }
  }

  return (
    <div className="merchant-field">
      {chips.length > 0 && (
        <div className="chips" role="group" aria-label="Frequent stores">
          {chips.map((name) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={value.trim().toLowerCase() === name.toLowerCase()}
              onClick={() => choose(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <div className="field">
        <label className="field-label" htmlFor={inputId}>
          Store
        </label>
        <input
          id={inputId}
          ref={inputRef}
          className="input"
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showMatches}
          aria-controls={listId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoCapitalize="words"
          autoComplete="off"
          enterKeyHint="next"
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {error && (
          <p id={errorId} className="error" role="alert">
            {error}
          </p>
        )}
        {showMatches && (
          <div id={listId} className="suggestions" role="listbox">
            {matches.map((name) => (
              <button
                key={name}
                type="button"
                role="option"
                className="suggestion"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
