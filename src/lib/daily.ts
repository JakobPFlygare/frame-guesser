import { PUZZLES } from '../data/puzzles';

/** yyyy-mm-dd in the player's local time. */
export function dateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Stable, deterministic string hash (djb2). */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

export function puzzleIndexForDate(key: string, count: number): number {
  return hashStr(key) % count;
}

/**
 * The active date key, allowing a `?date=YYYY-MM-DD` override for testing
 * (e.g. to preview a different day's puzzle).
 */
export function activeDateKey(): string {
  const override = new URLSearchParams(window.location.search).get('date');
  return override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : dateKey();
}

/**
 * Pick the puzzle for the active date. A `?p=<index>` query param forces a
 * specific puzzle, which is handy while curating the list.
 */
export function activePuzzle() {
  const forced = new URLSearchParams(window.location.search).get('p');
  if (forced !== null) {
    const i = Number(forced);
    if (Number.isInteger(i) && i >= 0 && i < PUZZLES.length) return PUZZLES[i];
  }
  return PUZZLES[puzzleIndexForDate(activeDateKey(), PUZZLES.length)];
}
