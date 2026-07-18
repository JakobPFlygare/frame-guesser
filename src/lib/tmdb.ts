import type { Puzzle } from '../data/puzzles';
import type { ClueKey } from '../config/scoring';

// All puzzle data (title, backdrop, clues) is baked into puzzles.ts by
// scripts/generate-puzzles.mjs. The app makes NO TMDB API calls at runtime and
// needs NO token — backdrop images come from the public image CDN. This keeps
// static hosting (e.g. GitHub Pages) simple and secret-free.

const IMG_BASE = 'https://image.tmdb.org/t/p';

export type PuzzleData = {
  title: string;
  backdropUrl: string | null;
  clues: Record<ClueKey, string | undefined>;
};

export function imageUrl(path: string, size: 'original' | 'w1280' = 'w1280'): string {
  return `${IMG_BASE}/${size}${path}`;
}

/**
 * A "fill in the blanks" hint for a title: every letter/digit becomes an
 * underscore while spaces and punctuation stay put, so "The Avengers" reads
 * "___ ________". Reveals word count and lengths without giving letters away.
 */
export function titlePattern(title: string): string {
  return title.replace(/[\p{L}\p{N}]/gu, '_');
}

/** Pick one of a title's backdrops at random, so a run doesn't always show the
 *  same still for a given movie/show. Called once per movie (memoised in App). */
function pickBackdrop(paths: string[] | undefined): string | null {
  if (!paths || paths.length === 0) return null;
  return paths[Math.floor(Math.random() * paths.length)];
}

export function loadPuzzleData(puzzle: Puzzle): PuzzleData {
  const c = puzzle.clues ?? {};
  const path = pickBackdrop(puzzle.backdropPaths);
  return {
    title: puzzle.title,
    backdropUrl: path ? imageUrl(path) : null,
    clues: {
      pattern: titlePattern(puzzle.title),
      year: c.year,
      genre: c.genre,
      director: c.director,
      actor: c.actor,
    },
  };
}
