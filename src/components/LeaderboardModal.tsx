import { useEffect, useState } from 'react';
import { getLeaderboard, type ScoreEntry } from '../lib/leaderboard';
import { MODE_LABELS, type GameMode } from '../config/scoring';
import { LeaderboardList } from './LeaderboardList';

/** Full leaderboard, reachable any time from the header (no run required). */
export function LeaderboardModal({
  initialMode,
  onClose,
}: {
  initialMode: GameMode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    getLeaderboard(mode)
      .then((b) => alive && setBoard(b))
      .catch(() => alive && setError('Could not load the leaderboard.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [mode]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Leaderboard"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 className="modal-title">🏆 Leaderboard</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mode-switch modal-modes" role="tablist" aria-label="Leaderboard mode">
          {(['frames', 'classic'] as GameMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`mode-tab${mode === m ? ' active' : ''}`}
              onClick={() => setMode(m)}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="lb-empty">Loading…</p>
        ) : error ? (
          <p className="lb-error">{error}</p>
        ) : (
          <LeaderboardList board={board} />
        )}
      </div>
    </div>
  );
}
