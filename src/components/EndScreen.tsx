import type { GameStatus } from '../hooks/useGameState';

type Props = {
  status: GameStatus;
  title: string;
  score: number;
  wrongGuess: string | null;
  gaveUp: boolean;
  lastLife: boolean; // this was the final life — next goes to results
  onNext: () => void;
};

export function EndScreen({ status, title, score, wrongGuess, gaveUp, lastLife, onNext }: Props) {
  if (status === 'playing') return null;
  const won = status === 'won';

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
        <p className="end-score">No points — lost a life.</p>
      )}
      <button type="button" className="next-btn" onClick={onNext}>
        {lastLife ? 'See results ▶' : 'Next movie ▶'}
      </button>
    </div>
  );
}
