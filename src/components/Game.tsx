import type { Puzzle } from '../data/puzzles';
import type { PuzzleData } from '../lib/tmdb';
import { useGameState } from '../hooks/useGameState';
import { TileGrid } from './TileGrid';
import { GuessBox } from './GuessBox';
import { CluePanel } from './CluePanel';
import { Scoreboard } from './Scoreboard';
import { EndScreen } from './EndScreen';

type Props = {
  puzzle: Puzzle;
  data: PuzzleData;
  initialReveal: number;
  lives: number; // remaining lives (already reflects this movie's outcome)
  onWin: (score: number) => void;
  onLose: () => void;
  onNext: () => void;
};

export function Game({ puzzle, data, initialReveal, lives, onWin, onLose, onNext }: Props) {
  const { state, score, revealTile, useClue, submitGuess, giveUp } = useGameState(
    puzzle,
    data.title,
    initialReveal,
  );
  const gameOver = state.status !== 'playing';

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
  const lastLife = state.status === 'lost' && lives <= 0;

  return (
    <>
      <Scoreboard score={score} tilesRevealed={state.revealed.length} />

      <TileGrid
        imageUrl={data.backdropUrl}
        revealed={state.revealed}
        onReveal={revealTile}
        revealAll={gameOver}
      />

      {gameOver ? (
        <EndScreen
          status={state.status}
          title={data.title}
          score={score}
          wrongGuess={state.wrongGuess}
          gaveUp={gaveUp}
          lastLife={lastLife}
          onNext={onNext}
        />
      ) : (
        <div className="controls">
          <GuessBox onGuess={handleGuess} disabled={gameOver} />
          <button type="button" className="giveup-btn" onClick={handleGiveUp}>
            Give up &amp; reveal
          </button>
        </div>
      )}

      <CluePanel clues={data.clues} used={state.cluesUsed} onUseClue={useClue} disabled={gameOver} />
    </>
  );
}
