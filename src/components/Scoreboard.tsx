import { STARTING_LIVES, type GameMode } from '../config/scoring';

type Props = {
  mode: GameMode;
  /** Whole-run total score. */
  totalScore: number;
  /** Remaining lives (Classic mode). */
  lives: number;
  /** Remaining frames (Frames mode). */
  framesLeft: number;
  /** Live score on offer for the current frame. */
  frameScore: number;
};

/** Single compact stat row above the frame: Score · Lives/Frames · This frame. */
export function Scoreboard({ mode, totalScore, lives, framesLeft, frameScore }: Props) {
  return (
    <div className="statbar">
      <div className="stat">
        <span className="stat-value">{totalScore}</span>
        <span className="stat-label">Score</span>
      </div>

      {mode === 'classic' ? (
        <div className="stat">
          <span className="stat-value lives">
            {Array.from({ length: STARTING_LIVES }, (_, i) => (
              <span key={i} className={i < lives ? 'life' : 'life spent'} aria-hidden="true" />
            ))}
            <span className="sr-only">
              {lives} of {STARTING_LIVES} lives left
            </span>
          </span>
          <span className="stat-label">Lives</span>
        </div>
      ) : (
        <div className="stat">
          <span className="stat-value">{framesLeft}</span>
          <span className="stat-label">Frames</span>
        </div>
      )}

      <div className="stat stat-frame">
        <span className="stat-value">{frameScore}</span>
        <span className="stat-label">This frame</span>
      </div>
    </div>
  );
}
