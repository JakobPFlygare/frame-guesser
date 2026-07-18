import type { ScoreEntry } from '../lib/leaderboard';

/** Presentational top-scores list, shared by the modal and the run-over screen. */
export function LeaderboardList({ board }: { board: ScoreEntry[] }) {
  if (board.length === 0) {
    return <p className="lb-empty">No scores yet — be the first!</p>;
  }
  return (
    <ol className="leaderboard-list">
      {board.map((e, i) => (
        <li key={i}>
          <span className="lb-rank">{i + 1}</span>
          <span className="lb-name">{e.name}</span>
          <span className="lb-score">{e.score}</span>
        </li>
      ))}
    </ol>
  );
}
