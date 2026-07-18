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
  savedByShield: boolean; // a wrong guess was absorbed by Extra Life
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
  savedByShield,
  onNext,
}: Props) {
  if (status === 'playing') return null;
  const won = status === 'won';

  // What the miss cost you, phrased per mode.
  let lossNote: string;
  if (mode === 'frames') {
    lossNote = savedByShield
      ? '🛡️ Extra Life absorbed the miss — the run goes on.'
      : 'Run over.';
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
        mode === 'frames' ? (
          <p className="end-score">Solved! ✅ Keep the streak going.</p>
        ) : (
          <p className="end-score">
            +<strong>{score}</strong> points
          </p>
        )
      ) : (
        <p className="end-score">{lossNote}</p>
      )}
      <button type="button" className="next-btn" onClick={onNext}>
        {runEnding ? 'See results ▶' : 'Next title ▶'}
      </button>
    </div>
  );
}
