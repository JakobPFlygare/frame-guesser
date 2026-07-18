import { STARTING_LIVES, type GameMode } from '../config/scoring';

type Props = {
  mode: GameMode;
  /** Whole-run total score (Frames: movies solved; Classic: banked points). */
  totalScore: number;
  /** Remaining lives (both modes). */
  lives: number;
  /** Remaining frames (Frames mode). */
  framesLeft: number;
  /** Live budget on offer for the current frame (Classic mode). */
  frameScore: number;
};

/** A row of pips showing lives remaining vs spent. */
function Lives({ lives }: { lives: number }) {
  return (
    <span className="stat-value lives">
      {Array.from({ length: STARTING_LIVES }, (_, i) => (
        <span key={i} className={i < lives ? 'life' : 'life spent'} aria-hidden="true" />
      ))}
      <span className="sr-only">
        {lives} of {STARTING_LIVES} lives left
      </span>
    </span>
  );
}

/** Compact stat row above the frame. The middle/third stats are mode-specific. */
export function Scoreboard({ mode, totalScore, lives, framesLeft, frameScore }: Props) {
  return (
    <div className="statbar">
      <div className="stat">
        <span className="stat-value">{totalScore}</span>
        <span className="stat-label">Score</span>
      </div>

      {mode === 'classic' ? (
        <div className="stat">
          <Lives lives={lives} />
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
        <div className="stat">
          <Lives lives={lives} />
          <span className="stat-label">Lives</span>
        </div>
      )}
    </div>
  );
}
