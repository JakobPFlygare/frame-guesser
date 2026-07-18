// Shared high-score table.
//
// When Supabase is configured (src/config/supabase.ts), scores are stored in a
// hosted `scores` table so every player sees the same board. Reads/writes go
// straight to Supabase's auto-generated REST API (PostgREST) with `fetch` — no
// SDK, no server code. When it's NOT configured, we fall back to a per-browser
// localStorage board so the game still works locally.

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseEnabled } from '../config/supabase';

export type ScoreEntry = { name: string; score: number; solved: number };

const MAX_ENTRIES = 10;

// ---------------------------------------------------------------------------
// localStorage fallback (used when Supabase isn't configured)
// ---------------------------------------------------------------------------
const LOCAL_KEY = 'fg:leaderboard';

function localGet(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch {
    return [];
  }
}

function localAdd(entry: ScoreEntry): ScoreEntry[] {
  const next = [...localGet(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    /* non-fatal */
  }
  return next;
}

// ---------------------------------------------------------------------------
// Supabase (PostgREST) — https://<project>.supabase.co/rest/v1/scores
// ---------------------------------------------------------------------------
function restHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Fetch the top scores, highest first. */
export async function getLeaderboard(): Promise<ScoreEntry[]> {
  if (!supabaseEnabled) return localGet();
  const url =
    `${SUPABASE_URL}/rest/v1/scores` +
    `?select=name,score,solved&order=score.desc&limit=${MAX_ENTRIES}`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  return (await res.json()) as ScoreEntry[];
}

/** Save a score, then return the refreshed top-N board. */
export async function addScore(
  name: string,
  score: number,
  solved: number,
): Promise<ScoreEntry[]> {
  const entry: ScoreEntry = { name: name.trim().slice(0, 20) || 'Anonymous', score, solved };
  if (!supabaseEnabled) return localAdd(entry);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`Score save failed: ${res.status}`);
  return getLeaderboard();
}

/** True if this score would land on the (already-fetched) board. */
export function isHighScore(score: number, board: ScoreEntry[]): boolean {
  return (
    score > 0 && (board.length < MAX_ENTRIES || score > board[board.length - 1].score)
  );
}
