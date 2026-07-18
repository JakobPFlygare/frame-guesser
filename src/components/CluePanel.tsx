import {
  CLUE_COSTS,
  CLUE_LABELS,
  CLUE_ORDER,
  type ClueKey,
  type GameMode,
} from '../config/scoring';

type Props = {
  mode: GameMode;
  clues: Record<ClueKey, string | undefined>;
  /** Clues revealed on THIS movie (value is shown). */
  used: ClueKey[];
  /** Clues spent earlier this run (Frames mode only). */
  runUsed: ClueKey[];
  /** Current frame budget (Classic mode) — a clue you can't afford is locked. */
  budget: number;
  onUseClue: (clue: ClueKey) => void;
  disabled: boolean;
};

export function CluePanel({ mode, clues, used, runUsed, budget, onUseClue, disabled }: Props) {
  const frames = mode === 'frames';
  return (
    <div className="clue-panel">
      <h2 className="panel-title">
        Clues
        {frames && <span className="clue-note">free · once each per run</span>}
      </h2>
      <ul className="clue-list">
        {CLUE_ORDER.map((key) => {
          const isUsedHere = used.includes(key);
          const spentThisRun = frames && runUsed.includes(key) && !isUsedHere;
          const cost = CLUE_COSTS[key];
          const tooPoor = mode === 'classic' && budget < cost;
          const value = clues[key];

          return (
            <li key={key} className="clue-item">
              <span className="clue-name">{CLUE_LABELS[key]}</span>
              {isUsedHere ? (
                <span className="clue-value">{value ?? 'Unknown'}</span>
              ) : spentThisRun ? (
                <span className="clue-spent">Used this run</span>
              ) : (
                <button
                  type="button"
                  className="clue-button"
                  disabled={disabled || tooPoor}
                  onClick={() => onUseClue(key)}
                >
                  {frames ? 'Reveal (free)' : `Reveal (−${cost})`}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
