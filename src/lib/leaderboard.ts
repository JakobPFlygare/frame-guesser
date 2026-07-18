// Local high-score table stored in the browser (localStorage). This is
// per-device — a leaderboard shared across friends would need a small backend
// (e.g. Supabase); see the README notes.

const KEY = 'fg:leaderboard';
const MAX_ENTRIES = 10;

export type ScoreEntry = { name: string; score: number; solved: number };

export function getLeaderboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

/** Insert a score, keep the top N, and return the updated, sorted table. */
export function addScore(name: string, score: number, solved: number): ScoreEntry[] {
  const entry: ScoreEntry = { name: name.trim() || 'Anonymous', score, solved };
  const next = [...getLeaderboard(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* non-fatal */
  }
  return next;
}

/** True if this score would land on the board. */
export function isHighScore(score: number): boolean {
  const board = getLeaderboard();
  return score > 0 && (board.length < MAX_ENTRIES || score > board[board.length - 1].score);
}
