// Central place to tune game difficulty and scoring.
// Change these numbers freely while playtesting.

export const GRID_COLS = 8;
export const GRID_ROWS = 5;
export const TILE_COUNT = GRID_COLS * GRID_ROWS;

/** Tiles uncovered for free at the start of each movie (no cost). */
export const FREE_TILES = 1;

/** Score for a movie solved with no paid reveals and no clues. */
export const MAX_SCORE = 1000;

// ---------------------------------------------------------------------------
// Game modes
// ---------------------------------------------------------------------------
export type GameMode = 'frames' | 'classic';

export const MODE_LABELS: Record<GameMode, string> = {
  frames: 'Frames',
  classic: 'Lives',
};

export const MODE_BLURBS: Record<GameMode, string> = {
  frames: 'A shared pool of frames for the whole run. Reveal spends one. One miss ends it.',
  classic: 'Three lives. Points are a budget — reveals and clues cost points you can run out of.',
};

export const DEFAULT_MODE: GameMode = 'frames';

export type ClueKey = 'year' | 'genre' | 'director' | 'actor';

/** Clue reveal order (easy -> revealing). */
export const CLUE_ORDER: ClueKey[] = ['year', 'genre', 'director', 'actor'];

export const CLUE_LABELS: Record<ClueKey, string> = {
  year: 'Release year',
  genre: 'Genre',
  director: 'Director',
  actor: 'Lead actor',
};

// ---------------------------------------------------------------------------
// Classic (Lives) mode — points are a spendable BUDGET.
// Each movie starts at MAX_SCORE. Every paid tile and every clue costs points,
// and you can't buy what you can't afford — so you can't reveal everything to
// de-risk a guess. Whatever budget survives is what you bank on a correct guess.
// ---------------------------------------------------------------------------

/** Lives for a whole run (not per movie). A miss or give-up costs one. */
export const STARTING_LIVES = 3;

/** Flat point cost of each clue in Classic mode. */
export const CLUE_COSTS: Record<ClueKey, number> = {
  year: 60,
  genre: 90,
  director: 130,
  actor: 150,
};

/** First paid tile's cost; each further tile costs TILE_COST_STEP more, so
 *  opening more frames bites harder and harder. */
export const TILE_BASE_COST = 45;
export const TILE_COST_STEP = 12;

/** Cost of the nth paid tile (1-indexed). */
export function classicTileCost(nthPaid: number): number {
  return TILE_BASE_COST + Math.max(0, nthPaid - 1) * TILE_COST_STEP;
}

/** Total spent on the first `paid` tiles. */
export function classicTilesTotal(paid: number): number {
  let sum = 0;
  for (let n = 1; n <= paid; n++) sum += classicTileCost(n);
  return sum;
}

/** Remaining budget = what you'd bank if you solved right now. */
export function classicBudget(paidTiles: number, cluesUsed: ClueKey[]): number {
  const clue = cluesUsed.reduce((sum, c) => sum + CLUE_COSTS[c], 0);
  return Math.max(0, MAX_SCORE - classicTilesTotal(Math.max(0, paidTiles)) - clue);
}

// ---------------------------------------------------------------------------
// Frames (survival) mode — a shared pool of reveals for the WHOLE run.
// Each paid tile spends one frame; frames persist across movies and don't come
// back. Clues are free but each can be used only ONCE per run. A wrong guess or
// give-up ends the run. A solved movie banks a score based on how little of the
// frame you had to reveal (clues don't affect it).
// ---------------------------------------------------------------------------

/** Frames granted at the start of a Frames-mode run. */
export const START_FRAMES = 30;

/**
 * Score decays exponentially per paid tile: score = MAX_SCORE * DECAY_RATE^paid.
 * < 1 means the FIRST reveals hurt far more than later ones.
 */
export const DECAY_RATE = 0.82;

export function framesScore(paidTiles: number): number {
  return Math.round(MAX_SCORE * Math.pow(DECAY_RATE, Math.max(0, paidTiles)));
}

/** Live score on offer for the current movie, by mode. */
export function movieScore(
  mode: GameMode,
  paidTiles: number,
  cluesUsed: ClueKey[],
): number {
  return mode === 'classic' ? classicBudget(paidTiles, cluesUsed) : framesScore(paidTiles);
}
