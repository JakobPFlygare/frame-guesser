import { useEffect, useState } from 'react';
import { getLeaderboard, type ScoreEntry } from '../lib/leaderboard';
import { LeaderboardList } from './LeaderboardList';

/** Full leaderboard, reachable any time from the header (no run required). */
export function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
