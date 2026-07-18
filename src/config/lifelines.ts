// Frames-mode lifelines.
//
// Every LIFELINE_EVERY solves the player earns one lifeline, drawn from a
// shuffled bag so the order is a surprise each run. Each is a one-time
// consumable held in the player's inventory (in <App>) until spent. The tile-
// reveal effects act on the CURRENT movie (handled in <Game>); the rest change
// run-level resources (handled in <App>).

import { GRID_COLS, GRID_ROWS } from './scoring';

export type LifelineKey =
  | 'bomb'
  | 'plusFrames'
  | 'refund'
  | 'corners'
  | 'crosshair'
  | 'xray'
  | 'extraLife'
  | 'skip'
  | 'clueReset';

export type LifelineDef = { label: string; icon: string; blurb: string };

export const LIFELINES: Record<LifelineKey, LifelineDef> = {
  bomb: { label: 'The Bomb', icon: '💣', blurb: 'Reveal a random 3×3 block of tiles.' },
  plusFrames: { label: '+5 Frames', icon: '🎞️', blurb: 'Add 5 frames to your pool.' },
  refund: { label: 'Refund', icon: '💸', blurb: 'Your next 3 reveals are free.' },
  corners: { label: 'Corners', icon: '📐', blurb: 'Reveal all four corner tiles.' },
  crosshair: {
    label: 'Crosshair',
    icon: '🎯',
    blurb: 'Reveal the centre tile and its neighbours.',
  },
  xray: { label: 'X-Ray', icon: '🩻', blurb: 'Reveal a full random row.' },
  extraLife: {
    label: 'Extra Life',
    icon: '🛡️',
    blurb: 'Automatically absorbs your next wrong guess — no need to activate it.',
  },
  skip: { label: 'Skip', icon: '⏭️', blurb: 'Skip this movie — no solve, no miss.' },
  clueReset: { label: 'Clue Reset', icon: '🔄', blurb: 'Refresh all clues so each can be used again.' },
};

/** The v1 pool (order is randomised per run via `shuffle`). */
export const LIFELINE_POOL: LifelineKey[] = [
  'bomb',
  'plusFrames',
  'refund',
  'corners',
  'crosshair',
  'xray',
  'extraLife',
  'skip',
  'clueReset',
];

/** Lifelines whose effect reveals tiles on the CURRENT movie (need an active movie). */
export const REVEAL_LIFELINES: LifelineKey[] = ['bomb', 'corners', 'crosshair', 'xray'];

// Every Frames run opens with one free lifeline. Some make a dull opening gift —
// '+5 Frames' is a yawn when your pool is already full, and 'Clue Reset' does
// nothing until you've actually spent a clue — so they're held back from the
// run-opener draw (they can still turn up as a normal every-5 reward).
export const STARTING_LIFELINE_EXCLUDE: LifelineKey[] = ['plusFrames', 'clueReset'];

/** The pool the run-opening lifeline is drawn from. */
export const STARTING_LIFELINE_POOL: LifelineKey[] = LIFELINE_POOL.filter(
  (k) => !STARTING_LIFELINE_EXCLUDE.includes(k),
);

/** Earn one lifeline every this many solves. */
export const LIFELINE_EVERY = 5;

/** Frames granted by '+5 Frames'. */
export const PLUS_FRAMES_AMOUNT = 5;

/** Free reveals granted by 'Refund'. */
export const REFUND_TILES = 3;

// --- Tile-target geometry for the reveal lifelines ---------------------------
const rc = (row: number, col: number) => row * GRID_COLS + col;

/** The four corner tile indices. */
export const CORNER_TILES: number[] = [
  rc(0, 0),
  rc(0, GRID_COLS - 1),
  rc(GRID_ROWS - 1, 0),
  rc(GRID_ROWS - 1, GRID_COLS - 1),
];

/** Centre tile + its orthogonal neighbours (clamped to the grid). */
export const CROSSHAIR_TILES: number[] = (() => {
  const r = Math.floor(GRID_ROWS / 2);
  const c = Math.floor(GRID_COLS / 2);
  const out = [rc(r, c)];
  if (r > 0) out.push(rc(r - 1, c));
  if (r < GRID_ROWS - 1) out.push(rc(r + 1, c));
  if (c > 0) out.push(rc(r, c - 1));
  if (c < GRID_COLS - 1) out.push(rc(r, c + 1));
  return out;
})();

/** A random 3×3 block's tile indices (anchored so it fits the grid). */
export function randomBlockTiles(rand: () => number): number[] {
  const r0 = Math.floor(rand() * Math.max(1, GRID_ROWS - 2));
  const c0 = Math.floor(rand() * Math.max(1, GRID_COLS - 2));
  const out: number[] = [];
  for (let r = r0; r < Math.min(GRID_ROWS, r0 + 3); r++)
    for (let c = c0; c < Math.min(GRID_COLS, c0 + 3); c++) out.push(rc(r, c));
  return out;
}

/** Every tile index in a random row. */
export function randomRowTiles(rand: () => number): number[] {
  const row = Math.floor(rand() * GRID_ROWS);
  return Array.from({ length: GRID_COLS }, (_, c) => rc(row, c));
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
