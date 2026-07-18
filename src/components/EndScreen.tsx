import type { GameStatus } from '../hooks/useGameState';
import type { GameMode } from '../config/scoring';

type Props = {
  mode: GameMode;
  status: GameStatus;
  title: string;
  score: number;
  wrongGuess: string | null;
  gaveUp: boolean;
  runEnding: boolean; // this movie ended the run — next goes to results
  onNext: () => void;
};

export function EndScreen({
  mode,
  status,
  title,
  score,
  wrongGuess,
  gaveUp,
  runEnding,
  onNext,
}: Props) {
  if (status === 'playing') return null;
  const won = status === 'won';

  // What the miss cost you, phrased per mode.
  let lossNote: string;
  if (mode === 'frames') {
    lossNote = 'No points — run over.';
  } else {
    lossNote = runEnding ? 'No points — out of lives.' : 'No points — lost a life.';
  }

  return (
    <div className="end-screen">
      <h2 className={won ? 'end-title win' : 'end-title lose'}>
        {won ? '🎉 Correct!' : gaveUp ? '🏳️ Gave up' : '❌ Not quite'}
      </h2>
      {!won && wrongGuess && <p className="end-wrong">You guessed “{wrongGuess}”</p>}
      <p className="end-answer">
        It was <strong>{title}</strong>
      </p>
      {won ? (
        <p className="end-score">
          +<strong>{score}</strong> points
        </p>
      ) : (
        <p className="end-score">{lossNote}</p>
      )}
      <button type="button" className="next-btn" onClick={onNext}>
        {runEnding ? 'See results ▶' : 'Next movie ▶'}
      </button>
    </div>
  );
}
