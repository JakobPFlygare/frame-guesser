import { useEffect, useState, type FormEvent } from 'react';
import { addScore, getLeaderboard, isHighScore, type ScoreEntry } from '../lib/leaderboard';

type Props = {
  totalScore: number;
  solved: number;
  onPlayAgain: () => void;
};

export function RunOverScreen({ totalScore, solved, onPlayAgain }: Props) {
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');

  // Load the shared board once when the run ends.
  useEffect(() => {
    let alive = true;
    getLeaderboard()
      .then((b) => alive && setBoard(b))
      .catch(() => alive && setError('Could not load the leaderboard.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const next = await addScore(name, totalScore, solved);
      setBoard(next);
      setSaved(true);
    } catch {
      setError('Could not save your score. Try again.');
    } finally {
      setSaving(false);
    }
  }

  const qualifies = !loading && totalScore > 0 && isHighScore(totalScore, board);

  return (
    <div className="run-over">
      <h2 className="run-over-title">Run over</h2>
      <p className="run-final">
        Final score <strong>{totalScore}</strong>
      </p>
      <p className="run-solved">
        {solved} {solved === 1 ? 'movie' : 'movies'} solved
      </p>

      {!saved && totalScore > 0 && (
        <form className="name-form" onSubmit={save}>
          <p className="name-prompt">
            {qualifies ? '🏆 New high score! Enter your name:' : 'Enter your name to save your run:'}
          </p>
          <div className="name-row">
            <input
              value={name}
              maxLength={20}
              placeholder="Your name"
              autoFocus
              disabled={saving}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {error && <p className="lb-error">{error}</p>}

      <div className="leaderboard">
        <h3 className="panel-title">Leaderboard</h3>
        {loading ? (
          <p className="lb-empty">Loading…</p>
        ) : board.length > 0 ? (
          <ol className="leaderboard-list">
            {board.map((e, i) => (
              <li key={i}>
                <span className="lb-rank">{i + 1}</span>
                <span className="lb-name">{e.name}</span>
                <span className="lb-score">{e.score}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="lb-empty">No scores yet — be the first!</p>
        )}
      </div>

      <button type="button" className="next-btn" onClick={onPlayAgain}>
        Play again ▶
      </button>
    </div>
  );
}
