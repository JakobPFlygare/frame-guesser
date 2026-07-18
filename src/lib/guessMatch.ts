import type { Puzzle } from '../data/puzzles';

/** Lowercase, strip accents & punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // combining marks
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * A guess is correct if it matches the resolved title or the puzzle's
 * canonical title or any alias, ignoring case/punctuation/accents.
 */
export function isCorrectGuess(guess: string, puzzle: Puzzle, resolvedTitle: string): boolean {
  const g = normalize(guess);
  if (!g) return false;
  const candidates = [resolvedTitle, puzzle.title, ...(puzzle.answerAliases ?? [])];
  return candidates.some((c) => normalize(c) === g);
}
