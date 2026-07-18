import { useEffect, useState } from 'react';
import type { Puzzle } from '../data/puzzles';
import type { PuzzleData } from '../lib/tmdb';
import { useGameState } from '../hooks/useGameState';
import { FREE_TILES, classicTileCost, type ClueKey, type GameMode } from '../config/scoring';
import {
  CORNER_TILES,
  CROSSHAIR_TILES,
  randomBlockTiles,
  randomRowTiles,
  type LifelineKey,
} from '../config/lifelines';
import { TileGrid } from './TileGrid';
import { GuessBox } from './GuessBox';
import { CluePanel } from './CluePanel';
import { LifelinePanel } from './LifelinePanel';
import { RewardPop } from './RewardPop';
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
  nextRewardIn: number; // solves until the next lifeline — Frames mode
  inventory: LifelineKey[]; // earned, unspent lifelines — Frames mode
  freeReveals: number; // banked free reveals (Refund) — Frames mode
  justEarned: LifelineKey | null; // lifeline just drawn (drives the reward pop)
  onWin: (score: number) => void;
  onLose: () => void;
  onSpendFrame: () => void;
  onConsumeFreeReveal: () => void;
  onRewardSeen: () => void;
  onUseRunClue: (clue: ClueKey) => void;
  onLifeline: (key: LifelineKey) => void;
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
  nextRewardIn,
  inventory,
  freeReveals,
  justEarned,
  onWin,
  onLose,
  onSpendFrame,
  onConsumeFreeReveal,
  onRewardSeen,
  onUseRunClue,
  onLifeline,
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
  // Set when a wrong guess is absorbed by Extra Life — routes to the next movie
  // instead of ending the run.
  const [savedByShield, setSavedByShield] = useState(false);
  const hasExtraLife = inventory.includes('extraLife');
  // Playtesting aid: a "mark correct" shortcut. On in dev (`npm run dev`) and via
  // ?admin — never in the production build, so players can't see it.
  const adminMode =
    import.meta.env.DEV || new URLSearchParams(window.location.search).has('admin');

  // When the frame resolves (a guess lands or the player gives up), the result
  // screen replaces the guess box — jump back to the top so it's in view.
  useEffect(() => {
    if (gameOver) window.scrollTo(0, 0);
  }, [gameOver]);

  const paid = state.revealed.length - FREE_TILES;
  const nextTileCost = classicTileCost(paid + 1);
  const framesExhausted = framesLeft <= 0 && freeReveals <= 0;
  // Can the player uncover another tile right now?
  const revealLocked = mode === 'classic' ? score < nextTileCost : framesExhausted;

  function handleReveal(i: number) {
    if (gameOver || state.revealed.includes(i)) return;
    if (mode === 'classic') {
      if (score < nextTileCost) return; // can't afford it
      revealTile(i);
    } else if (freeReveals > 0) {
      revealTile(i); // Refund covers this one
      onConsumeFreeReveal();
    } else if (framesLeft > 0) {
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

  // Spend a lifeline. Tile-reveal effects happen here (they need this movie's
  // reveal setter); everything else is handled up in <App> via onLifeline.
  function applyLifeline(key: LifelineKey) {
    if (gameOver) return;
    switch (key) {
      case 'bomb':
        randomBlockTiles(Math.random).forEach((t) => revealTile(t));
        break;
      case 'corners':
        CORNER_TILES.forEach((t) => revealTile(t));
        break;
      case 'crosshair':
        CROSSHAIR_TILES.forEach((t) => revealTile(t));
        break;
      case 'xray':
        randomRowTiles(Math.random).forEach((t) => revealTile(t));
        break;
      default:
        break; // plusFrames / refund / extraLife / clueReset / skip -> App
    }
    onLifeline(key);
  }

  function handleGuess(text: string) {
    const r = submitGuess(text);
    if (r.outcome === 'correct') {
      onWin(r.score);
    } else if (r.outcome === 'wrong') {
      if (mode === 'frames' && hasExtraLife) {
        // Extra Life is passive: it auto-consumes to absorb the miss so the run
        // continues. onLifeline removes it from the inventory.
        setSavedByShield(true);
        onLifeline('extraLife');
      } else {
        onLose();
      }
    }
  }

  function handleGiveUp() {
    giveUp();
    onLose();
  }

  const gaveUp = state.status === 'lost' && !state.wrongGuess;
  // A loss ends the run in Frames mode (unless a shield absorbed it), and in
  // Classic when it was the last life.
  const runEnding =
    state.status === 'lost' && (mode === 'classic' ? lives <= 0 : !savedByShield);

  let revealHint: string | null = null;
  if (!gameOver) {
    if (mode === 'classic') {
      revealHint = revealLocked ? 'Out of points — make your guess' : `Next tile costs −${nextTileCost}`;
    } else if (freeReveals > 0) {
      revealHint = `${freeReveals} free reveal${freeReveals === 1 ? '' : 's'} · then ${framesLeft} frames`;
    } else if (framesExhausted) {
      revealHint = 'No frames left — guess on what you have';
    } else {
      revealHint = `${framesLeft} ${framesLeft === 1 ? 'frame' : 'frames'} left to spend`;
    }
  }

  return (
    <>
      <Scoreboard
        mode={mode}
        totalScore={totalScore}
        lives={lives}
        framesLeft={framesLeft}
        frameScore={score}
        nextRewardIn={nextRewardIn}
      />

      <div className="frame-wrap">
        <TileGrid
          imageUrl={data.backdropUrl}
          revealed={state.revealed}
          onReveal={handleReveal}
          revealAll={gameOver}
          revealLocked={revealLocked}
        />
        {mode === 'frames' && <RewardPop reward={justEarned} onDone={onRewardSeen} />}
      </div>

      {gameOver ? (
        <EndScreen
          mode={mode}
          status={state.status}
          title={data.title}
          score={score}
          wrongGuess={state.wrongGuess}
          gaveUp={gaveUp}
          runEnding={runEnding}
          savedByShield={savedByShield}
          onNext={runEnding ? onFinish : onAdvance}
        />
      ) : (
        <div className="controls">
          {revealHint && (
            <p className={`reveal-hint${revealLocked ? ' locked' : ''}`}>{revealHint}</p>
          )}
          <GuessBox onGuess={handleGuess} disabled={gameOver} />
          <button type="button" className="giveup-btn" onClick={handleGiveUp}>
            Give up &amp; reveal
          </button>
          {adminMode && (
            <button
              type="button"
              className="admin-btn"
              onClick={() => handleGuess(data.title)}
              title="Dev only — instantly solve this frame"
            >
              ✓ Mark correct (admin)
            </button>
          )}
        </div>
      )}

      {mode === 'frames' ? (
        <div className="side-panels">
          <CluePanel
            mode={mode}
            clues={data.clues}
            used={state.cluesUsed}
            runUsed={runCluesUsed}
            budget={score}
            onUseClue={handleUseClue}
            disabled={gameOver}
          />
          <LifelinePanel
            inventory={inventory}
            nextRewardIn={nextRewardIn}
            freeReveals={freeReveals}
            justLanded={justEarned !== null}
            disabled={gameOver}
            onUse={applyLifeline}
          />
        </div>
      ) : (
        <CluePanel
          mode={mode}
          clues={data.clues}
          used={state.cluesUsed}
          runUsed={runCluesUsed}
          budget={score}
          onUseClue={handleUseClue}
          disabled={gameOver}
        />
      )}
    </>
  );
}
