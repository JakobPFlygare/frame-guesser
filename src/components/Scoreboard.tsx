import { STARTING_LIVES } from '../config/scoring';

type Props = {
  /** Whole-run total score. */
  totalScore: number;
  /** Remaining lives in the run. */
  lives: number;
  /** Live score on offer for the current frame. */
  frameScore: number;
};

/** Single compact stat row shown above the frame: Score · Lives · This frame. */
export function Scoreboard({ totalScore, lives, frameScore }: Props) {
  return (
    <div className="statbar">
      <div className="stat">
        <span className="stat-value">{totalScore}</span>
        <span className="stat-label">Score</span>
      </div>
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
      <div className="stat stat-frame">
        <span className="stat-value">{frameScore}</span>
        <span className="stat-label">This frame</span>
      </div>
    </div>
  );
}
