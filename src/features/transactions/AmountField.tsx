import { useId, type RefObject } from 'react';

export function AmountField({
  value,
  onChange,
  error,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const errorId = useId();
  const hintId = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        Amount
      </label>
      <input
        id={id}
        ref={inputRef}
        className="input amount-input"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hintId}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={errorId} className="error" role="alert">
          {error}
        </p>
      ) : (
        <p id={hintId} className="hint">
          SEK, such as 249,50 or 249.50
        </p>
      )}
    </div>
  );
}
