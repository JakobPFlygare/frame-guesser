import { useCallback, useMemo, useState } from 'react';
import type { Puzzle } from '../data/puzzles';
import { FREE_TILES, movieScore, type ClueKey, type GameMode } from '../config/scoring';
import { isCorrectGuess } from '../lib/guessMatch';

export type GameStatus = 'playing' | 'won' | 'lost';

export type GameState = {
  revealed: number[]; // uncovered tile indices (includes the free starter)
  cluesUsed: ClueKey[]; // clues revealed on THIS movie (for value display)
  status: GameStatus;
  wrongGuess: string | null; // the wrong guess that ended the round, if any
  finalScore: number | null; // locked when the round ends
};

export type GuessOutcome = { outcome: 'correct' | 'wrong' | 'ignored'; score: number };

/**
 * State for a single movie. The parent remounts this (React `key`) per movie,
 * so it's in-memory only. One wrong guess (or give-up) ends the movie.
 *
 * Scoring is mode-aware but purely a function of this movie's reveals/clues;
 * run-level resources (lives, frames, once-per-run clues) live in <App> and the
 * spend/affordability gating happens in <Game>.
 */
export function useGameState(
  puzzle: Puzzle,
  resolvedTitle: string,
  initialReveal: number,
  mode: GameMode,
) {
  const [state, setState] = useState<GameState>(() => ({
    revealed: [initialReveal],
    cluesUsed: [],
    status: 'playing',
    wrongGuess: null,
    finalScore: null,
  }));

  const liveScore = useCallback(
    (revealedCount: number, cluesUsed: ClueKey[]) =>
      movieScore(mode, revealedCount - FREE_TILES, cluesUsed),
    [mode],
  );

  const score = useMemo(
    () => state.finalScore ?? liveScore(state.revealed.length, state.cluesUsed),
    [state.finalScore, state.revealed.length, state.cluesUsed, liveScore],
  );

  const revealTile = useCallback((index: number) => {
    setState((s) => {
      if (s.status !== 'playing' || s.revealed.includes(index)) return s;
      return { ...s, revealed: [...s.revealed, index] };
    });
  }, []);

  const useClue = useCallback((clue: ClueKey) => {
    setState((s) => {
      if (s.status !== 'playing' || s.cluesUsed.includes(clue)) return s;
      return { ...s, cluesUsed: [...s.cluesUsed, clue] };
    });
  }, []);

  const submitGuess = useCallback(
    (text: string): GuessOutcome => {
      const trimmed = text.trim();
      if (!trimmed || state.status !== 'playing') return { outcome: 'ignored', score };
      if (isCorrectGuess(trimmed, puzzle, resolvedTitle)) {
        const finalScore = liveScore(state.revealed.length, state.cluesUsed);
        setState((s) => ({ ...s, status: 'won', finalScore }));
        return { outcome: 'correct', score: finalScore };
      }
      setState((s) => ({ ...s, status: 'lost', wrongGuess: trimmed, finalScore: 0 }));
      return { outcome: 'wrong', score: 0 };
    },
    [puzzle, resolvedTitle, state.status, state.revealed.length, state.cluesUsed, score, liveScore],
  );

  const giveUp = useCallback(() => {
    setState((s) => (s.status === 'playing' ? { ...s, status: 'lost', finalScore: 0 } : s));
  }, []);

  return { state, score, revealTile, useClue, submitGuess, giveUp };
}
