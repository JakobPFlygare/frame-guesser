// Central place to tune game difficulty and scoring.
// Change these numbers freely while playtesting.

export const GRID_COLS = 8;
export const GRID_ROWS = 5;
export const TILE_COUNT = GRID_COLS * GRID_ROWS;

/** Tiles uncovered for free at the start of each movie (no point cost). */
export const FREE_TILES = 1;

/** Score for a movie solved with no paid reveals and no clues. */
export const MAX_SCORE = 1000;

/**
 * Score decays exponentially per paid tile: score = MAX_SCORE * DECAY_RATE^paid.
 * < 1 means each reveal costs a share of what's left, so the FIRST reveals hurt
 * far more than later ones (1->2 tiles matters much more than 15->16).
 */
export const DECAY_RATE = 0.82;

/** Lives for a whole run (not per movie). A miss or give-up costs one. */
export const STARTING_LIVES = 3;

export type ClueKey = 'year' | 'genre' | 'director' | 'actor';

/** Clue reveal order (easy -> revealing) and flat point costs. */
export const CLUE_ORDER: ClueKey[] = ['year', 'genre', 'director', 'actor'];

export const CLUE_LABELS: Record<ClueKey, string> = {
  year: 'Release year',
  genre: 'Genre',
  director: 'Director',
  actor: 'Lead actor',
};

export const CLUE_COSTS: Record<ClueKey, number> = {
  year: 60,
  genre: 90,
  director: 130,
  actor: 150,
};

/** Score for a movie given paid reveals + clues used. */
export function scoreFor(paidTiles: number, cluesUsed: ClueKey[]): number {
  const base = MAX_SCORE * Math.pow(DECAY_RATE, Math.max(0, paidTiles));
  const clueCost = cluesUsed.reduce((sum, c) => sum + CLUE_COSTS[c], 0);
  return Math.max(0, Math.round(base - clueCost));
}
