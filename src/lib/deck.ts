import { PUZZLES } from '../data/puzzles';

// A persistent, shuffled "deck" of puzzles. We draw from the front and only
// reshuffle once every puzzle has been shown — so the player never sees a
// repeat until the whole pool is exhausted, even across separate runs and
// page reloads (the state lives in localStorage).

const KEY = 'fg:deck';

type DeckState = {
  /** Puzzle ids still to show, front = next up. */
  remaining: string[];
  /** Most recently drawn id, so a fresh shuffle never repeats it back-to-back. */
  last: string | null;
  /** Pool size when this deck was built; a change means the pool was regenerated. */
  size: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const allIds = () => PUZZLES.map((p) => p.id);

// A freshly shuffled full pool, avoiding an immediate repeat of `last`.
function freshRemaining(last: string | null): string[] {
  const ids = shuffle(allIds());
  if (last && ids.length > 1 && ids[0] === last) {
    [ids[0], ids[1]] = [ids[1], ids[0]];
  }
  return ids;
}

function load(): DeckState {
  const ids = allIds();
  const valid = new Set(ids);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DeckState>;
      const last = typeof parsed.last === 'string' ? parsed.last : null;
      // If the pool was regenerated (different size), start a fresh shuffle so
      // newly added titles mix in immediately instead of after the old queue.
      if (parsed.size === ids.length) {
        // Drop any ids no longer in the pool, just in case.
        const remaining = (parsed.remaining ?? []).filter((id) => valid.has(id));
        if (remaining.length > 0) return { remaining, last, size: ids.length };
      }
      return { remaining: freshRemaining(last), last, size: ids.length };
    }
  } catch {
    /* corrupt/unavailable storage — fall through to a fresh deck */
  }
  return { remaining: freshRemaining(null), last: null, size: ids.length };
}

function save(state: DeckState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode etc.) — deck just won't persist */
  }
}

/** Draw the next puzzle id, reshuffling only once the pool is exhausted. */
export function drawNext(): string {
  const state = load();
  if (state.remaining.length === 0) {
    state.remaining = freshRemaining(state.last);
  }
  const id = state.remaining.shift() as string;
  state.last = id;
  state.size = allIds().length;
  save(state);
  return id;
}

/** Wipe the deck so the next draw starts a brand-new shuffle. */
export function resetDeck(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
