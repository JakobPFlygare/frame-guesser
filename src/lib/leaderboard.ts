// Shared high-score tables — one board per game mode.
//
// When Supabase is configured (src/config/supabase.ts), scores are stored in a
// hosted `scores` table so every player sees the same board. Reads/writes go
// straight to Supabase's auto-generated REST API (PostgREST) with `fetch` — no
// SDK, no server code. When it's NOT configured, we fall back to a per-browser
// localStorage board so the game still works locally.
//
// Each row carries a mode ('frames' | 'classic') so the two modes have separate
// boards. NOTE: this requires a `game_mode` column on the Supabase table — see
// README ("Shared leaderboard") for the one-line migration. (The column is named
// `game_mode`, not `mode`, because `mode` collides with a built-in Postgres
// aggregate and confuses PostgREST.)

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseEnabled } from '../config/supabase';
import type { GameMode } from '../config/scoring';

export type ScoreEntry = { name: string; score: number; solved: number; mode: GameMode };

const MAX_ENTRIES = 10;

// ---------------------------------------------------------------------------
// localStorage fallback (used when Supabase isn't configured)
// ---------------------------------------------------------------------------
const LOCAL_KEY = 'fg:leaderboard';

function localAll(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list = raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
    // Rows saved before modes existed are treated as Classic (lives) scores.
    return list.map((e) => ({ ...e, mode: e.mode ?? 'classic' }));
  } catch {
    return [];
  }
}

function localGet(mode: GameMode): ScoreEntry[] {
  return localAll()
    .filter((e) => e.mode === mode)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

function localAdd(entry: ScoreEntry): ScoreEntry[] {
  const next = [...localAll(), entry];
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  } catch {
    /* non-fatal */
  }
  return localGet(entry.mode);
}

// ---------------------------------------------------------------------------
// Supabase (PostgREST) — https://<project>.supabase.co/rest/v1/scores
// ---------------------------------------------------------------------------
// Normalize to the project origin, tolerating a pasted value that already
// includes a trailing slash or the "/rest/v1" path.
const REST_BASE = SUPABASE_URL.replace(/\/+$/, '').replace(/\/rest\/v1$/, '') + '/rest/v1';

function restHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Fetch the top scores for one mode, highest first. */
export async function getLeaderboard(mode: GameMode): Promise<ScoreEntry[]> {
  if (!supabaseEnabled) return localGet(mode);
  // `mode:game_mode` aliases the DB column back to our `mode` field.
  const url =
    `${REST_BASE}/scores` +
    `?select=name,score,solved,mode:game_mode&game_mode=eq.${mode}` +
    `&order=score.desc&limit=${MAX_ENTRIES}`;
  const res = await fetch(url, { headers: restHeaders() });
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  return (await res.json()) as ScoreEntry[];
}

/** Save a score for a mode, then return that mode's refreshed top-N board. */
export async function addScore(
  name: string,
  score: number,
  solved: number,
  mode: GameMode,
): Promise<ScoreEntry[]> {
  const entry: ScoreEntry = {
    name: name.trim().slice(0, 20) || 'Anonymous',
    score,
    solved,
    mode,
  };
  if (!supabaseEnabled) return localAdd(entry);
  const res = await fetch(`${REST_BASE}/scores`, {
    method: 'POST',
    headers: restHeaders(),
    // DB column is `game_mode` (see note above).
    body: JSON.stringify({ name: entry.name, score, solved, game_mode: mode }),
  });
  if (!res.ok) throw new Error(`Score save failed: ${res.status}`);
  return getLeaderboard(mode);
}

/** True if this score would land on the (already-fetched) board. */
export function isHighScore(score: number, board: ScoreEntry[]): boolean {
  return score > 0 && (board.length < MAX_ENTRIES || score > board[board.length - 1].score);
}
