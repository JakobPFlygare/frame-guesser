import { useMemo, useState, type FormEvent } from 'react';
import { addScore, getLeaderboard, isHighScore, type ScoreEntry } from '../lib/leaderboard';

type Props = {
  totalScore: number;
  solved: number;
  onPlayAgain: () => void;
};

export function RunOverScreen({ totalScore, solved, onPlayAgain }: Props) {
  const qualifies = useMemo(() => isHighScore(totalScore), [totalScore]);
  const [board, setBoard] = useState<ScoreEntry[]>(() => getLeaderboard());
  const [saved, setSaved] = useState(!qualifies);
  const [name, setName] = useState('');

  function save(e: FormEvent) {
    e.preventDefault();
    setBoard(addScore(name, totalScore, solved));
    setSaved(true);
  }

  return (
    <div className="run-over">
      <h2 className="run-over-title">Run over</h2>
      <p className="run-final">
        Final score <strong>{totalScore}</strong>
      </p>
      <p className="run-solved">
        {solved} {solved === 1 ? 'movie' : 'movies'} solved
      </p>

      {!saved && (
        <form className="name-form" onSubmit={save}>
          <p className="name-prompt">🏆 New high score! Enter your name:</p>
          <div className="name-row">
            <input
              value={name}
              maxLength={20}
              placeholder="Your name"
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit">Save</button>
          </div>
        </form>
      )}

      {board.length > 0 && (
        <div className="leaderboard">
          <h3 className="panel-title">Leaderboard</h3>
          <ol className="leaderboard-list">
            {board.map((e, i) => (
              <li key={i}>
                <span className="lb-rank">{i + 1}</span>
                <span className="lb-name">{e.name}</span>
                <span className="lb-score">{e.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <button type="button" className="next-btn" onClick={onPlayAgain}>
        Play again ▶
      </button>
    </div>
  );
}
