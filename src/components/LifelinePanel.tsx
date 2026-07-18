import { LIFELINES, type LifelineKey } from '../config/lifelines';

type Props = {
  /** Earned, unspent lifelines the player holds. */
  inventory: LifelineKey[];
  /** Solves remaining until the next lifeline is earned. */
  nextRewardIn: number;
  /** Extra Life is armed (survives the next wrong guess). */
  shield: boolean;
  /** Free reveals banked from Refund. */
  freeReveals: number;
  /** True while the movie is resolved (can't spend lifelines). */
  disabled: boolean;
  onUse: (key: LifelineKey) => void;
};

/** Right-hand panel: earned lifelines + active buffs + progress to the next. */
export function LifelinePanel({
  inventory,
  nextRewardIn,
  shield,
  freeReveals,
  disabled,
  onUse,
}: Props) {
  return (
    <div className="lifeline-panel">
      <h2 className="panel-title">
        Lifelines
        <span className="clue-note">next in {nextRewardIn}</span>
      </h2>

      {(shield || freeReveals > 0) && (
        <div className="lifeline-active">
          {shield && <span className="lifeline-badge">🛡️ Shield ready</span>}
          {freeReveals > 0 && (
            <span className="lifeline-badge">💸 {freeReveals} free reveal{freeReveals === 1 ? '' : 's'}</span>
          )}
        </div>
      )}

      {inventory.length === 0 ? (
        <p className="lifeline-empty">
          Solve {nextRewardIn} more to earn a lifeline.
        </p>
      ) : (
        <ul className="lifeline-list">
          {inventory.map((key, i) => {
            const def = LIFELINES[key];
            return (
              <li key={`${key}-${i}`}>
                <button
                  type="button"
                  className="lifeline-chip"
                  title={def.blurb}
                  disabled={disabled}
                  onClick={() => onUse(key)}
                >
                  <span className="lifeline-icon" aria-hidden="true">
                    {def.icon}
                  </span>
                  <span className="lifeline-label">{def.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
