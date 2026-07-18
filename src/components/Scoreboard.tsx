import { STARTING_LIVES, type GameMode } from '../config/scoring';

type Props = {
  mode: GameMode;
  /** Whole-run total score (Frames: movies solved; Classic: banked points). */
  totalScore: number;
  /** Remaining lives (Classic mode). */
  lives: number;
  /** Remaining frames (Frames mode). */
  framesLeft: number;
  /** Live budget on offer for the current frame (Classic mode). */
  frameScore: number;
  /** Solves until the next lifeline (Frames mode). */
  nextRewardIn: number;
};

/** Compact stat row above the frame. Third stat is mode-specific. */
export function Scoreboard({ mode, totalScore, lives, framesLeft, frameScore, nextRewardIn }: Props) {
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

      {mode === 'classic' ? (
        <div className="stat stat-frame">
          <span className="stat-value">{frameScore}</span>
          <span className="stat-label">This frame</span>
        </div>
      ) : (
        <div className="stat stat-frame">
          <span className="stat-value">{nextRewardIn}</span>
          <span className="stat-label">Next reward</span>
        </div>
      )}
    </div>
  );
}
