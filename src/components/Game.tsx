import { useEffect } from 'react';
import type { Puzzle } from '../data/puzzles';
import type { PuzzleData } from '../lib/tmdb';
import { useGameState } from '../hooks/useGameState';
import { FREE_TILES, classicTileCost, type ClueKey, type GameMode } from '../config/scoring';
import { TileGrid } from './TileGrid';
import { GuessBox } from './GuessBox';
import { CluePanel } from './CluePanel';
import { Scoreboard } from './Scoreboard';
import { EndScreen } from './EndScreen';

type Props = {
  puzzle: Puzzle;
  data: PuzzleData;
  initialReveal: number;
  mode: GameMode;
  lives: number; // remaining lives — Classic (already reflects this movie)
  framesLeft: number; // remaining frames — Frames mode (run-level)
  runCluesUsed: ClueKey[]; // clues already spent this run — Frames mode
  totalScore: number; // whole-run score so far
  onWin: (score: number) => void;
  onLose: () => void;
  onSpendFrame: () => void;
  onUseRunClue: (clue: ClueKey) => void;
  onAdvance: () => void;
  onFinish: () => void;
};

export function Game({
  puzzle,
  data,
  initialReveal,
  mode,
  lives,
  framesLeft,
  runCluesUsed,
  totalScore,
  onWin,
  onLose,
  onSpendFrame,
  onUseRunClue,
  onAdvance,
  onFinish,
}: Props) {
  const { state, score, revealTile, useClue, submitGuess, giveUp } = useGameState(
    puzzle,
    data.title,
    initialReveal,
    mode,
  );
  const gameOver = state.status !== 'playing';

  // When the frame resolves (a guess lands or the player gives up), the result
  // screen replaces the guess box — jump back to the top so it's in view.
  useEffect(() => {
    if (gameOver) window.scrollTo(0, 0);
  }, [gameOver]);

  const paid = state.revealed.length - FREE_TILES;
  const nextTileCost = classicTileCost(paid + 1);
  // Can the player uncover another tile right now?
  const revealLocked = mode === 'classic' ? score < nextTileCost : framesLeft <= 0;

  function handleReveal(i: number) {
    if (gameOver || state.revealed.includes(i)) return;
    if (mode === 'classic') {
      if (score < nextTileCost) return; // can't afford it
      revealTile(i);
    } else {
      if (framesLeft <= 0) return; // no frames left
      revealTile(i);
      onSpendFrame();
    }
  }

  function handleUseClue(clue: ClueKey) {
    if (gameOver || state.cluesUsed.includes(clue)) return;
    if (mode === 'classic') {
      if (score < 0) return;
      useClue(clue); // affordability is enforced by the disabled button
    } else {
      if (runCluesUsed.includes(clue)) return; // one use per run
      useClue(clue);
      onUseRunClue(clue);
    }
  }

  function handleGuess(text: string) {
    const r = submitGuess(text);
    if (r.outcome === 'correct') onWin(r.score);
    else if (r.outcome === 'wrong') onLose();
  }

  function handleGiveUp() {
    giveUp();
    onLose();
  }

  const gaveUp = state.status === 'lost' && !state.wrongGuess;
  // A loss ends the run in Frames mode always, and in Classic when it was the last life.
  const runEnding = state.status === 'lost' && (mode === 'frames' || lives <= 0);

  const revealHint = gameOver
    ? null
    : mode === 'classic'
      ? revealLocked
        ? 'Out of points — make your guess'
        : `Next tile costs −${nextTileCost}`
      : revealLocked
        ? 'No frames left — guess on what you have'
        : `${framesLeft} ${framesLeft === 1 ? 'frame' : 'frames'} left to spend`;

  return (
    <>
      <Scoreboard
        mode={mode}
        totalScore={totalScore}
        lives={lives}
        framesLeft={framesLeft}
        frameScore={score}
      />

      <TileGrid
        imageUrl={data.backdropUrl}
        revealed={state.revealed}
        onReveal={handleReveal}
        revealAll={gameOver}
        revealLocked={revealLocked}
      />

      {gameOver ? (
        <EndScreen
          mode={mode}
          status={state.status}
          title={data.title}
          score={score}
          wrongGuess={state.wrongGuess}
          gaveUp={gaveUp}
          runEnding={runEnding}
          onNext={runEnding ? onFinish : onAdvance}
        />
      ) : (
        <div className="controls">
          {revealHint && <p className={`reveal-hint${revealLocked ? ' locked' : ''}`}>{revealHint}</p>}
          <GuessBox onGuess={handleGuess} disabled={gameOver} />
          <button type="button" className="giveup-btn" onClick={handleGiveUp}>
            Give up &amp; reveal
          </button>
        </div>
      )}

      <CluePanel
        mode={mode}
        clues={data.clues}
        used={state.cluesUsed}
        runUsed={runCluesUsed}
        budget={score}
        onUseClue={handleUseClue}
        disabled={gameOver}
      />
    </>
  );
}
