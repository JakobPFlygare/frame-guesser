import { useMemo, useState, type FormEvent } from 'react';
import { PUZZLES } from '../data/puzzles';
import { normalize } from '../lib/guessMatch';

type Props = {
  onGuess: (text: string) => void;
  disabled: boolean;
};

// Each suggestion carries a search "haystack" (the title plus franchise/base
// search terms) so typing "star wars" surfaces all three films and "mad max"
// surfaces "Mad Max: Fury Road" — but we only ever display and submit the full
// canonical title, so the player still has to pick the specific one.
const SUGGESTION_POOL = Array.from(
  new Map(
    PUZZLES.map((p) => [
      p.title,
      { title: p.title, haystack: [p.title, ...(p.searchTerms ?? [])].map(normalize).join(' ') },
    ]),
  ).values(),
);
const MIN_CHARS = 2; // don't suggest until the player has committed to a guess
const MAX_SUGGESTIONS = 6;

export function GuessBox({ onGuess, disabled }: Props) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  // Suggestions appear only after a couple of characters — enough to fix
  // spelling, but not a browsable list of every answer.
  const suggestions = useMemo(() => {
    const q = normalize(value);
    if (q.length < MIN_CHARS) return [];
    return SUGGESTION_POOL.filter((s) => s.haystack.includes(q))
      .slice(0, MAX_SUGGESTIONS)
      .map((s) => s.title);
  }, [value]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    // Drop focus so the mobile keyboard closes before the result screen appears.
    (document.activeElement as HTMLElement | null)?.blur();
    onGuess(value);
    setValue('');
    setOpen(false);
  }

  return (
    <form className="guess-box" onSubmit={handleSubmit} autoComplete="off">
      <label className="guess-label" htmlFor="guess-input">
        Your guess — one shot!
      </label>
      <div className="guess-row">
        <div className="guess-input-wrap">
          <input
            id="guess-input"
            autoComplete="off"
            placeholder="Start typing a title…"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
          {open && suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((t) => (
                <li key={t}>
                  <button type="button" onMouseDown={() => setValue(t)}>
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" disabled={disabled || !value.trim()}>
          Guess
        </button>
      </div>
    </form>
  );
}
