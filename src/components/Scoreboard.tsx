import { TILE_COUNT } from '../config/scoring';

type Props = {
  score: number;
  tilesRevealed: number;
};

export function Scoreboard({ score, tilesRevealed }: Props) {
  return (
    <div className="scoreboard">
      <div className="stat">
        <span className="stat-value">{score}</span>
        <span className="stat-label">This frame</span>
      </div>
      <div className="stat">
        <span className="stat-value">
          {tilesRevealed}/{TILE_COUNT}
        </span>
        <span className="stat-label">Tiles</span>
      </div>
    </div>
  );
}
