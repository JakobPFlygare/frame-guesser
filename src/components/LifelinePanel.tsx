import { LIFELINES, type LifelineKey } from '../config/lifelines';

type Props = {
  /** Earned, unspent lifelines the player holds. */
  inventory: LifelineKey[];
  /** Solves remaining until the next lifeline is earned. */
  nextRewardIn: number;
  /** Free reveals banked from Refund. */
  freeReveals: number;
  /** A lifeline just landed — briefly glow the panel to draw the eye. */
  justLanded: boolean;
  /** True while the movie is resolved (can't spend lifelines). */
  disabled: boolean;
  onUse: (key: LifelineKey) => void;
};

/** Right-hand panel: earned lifelines + active buffs + progress to the next. */
export function LifelinePanel({
  inventory,
  nextRewardIn,
  freeReveals,
  justLanded,
  disabled,
  onUse,
}: Props) {
  // Extra Life is passive — it auto-saves you on a wrong guess, so it shows as an
  // active buff rather than a clickable chip. Everything else is spent on click.
  const extraLives = inventory.filter((k) => k === 'extraLife').length;
  const chips = inventory.filter((k) => k !== 'extraLife');
  const hasBuff = extraLives > 0 || freeReveals > 0;

  return (
    <div className={`lifeline-panel${justLanded ? ' just-landed' : ''}`}>
      <h2 className="panel-title">
        Lifelines
        <span className="clue-note">next in {nextRewardIn}</span>
      </h2>

      {hasBuff && (
        <div className="lifeline-active">
          {extraLives > 0 && (
            <span className="lifeline-badge" title={LIFELINES.extraLife.blurb}>
              🛡️ Extra Life{extraLives > 1 ? ` ×${extraLives}` : ''} — auto-saves you
            </span>
          )}
          {freeReveals > 0 && (
            <span className="lifeline-badge">
              💸 {freeReveals} free reveal{freeReveals === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {inventory.length === 0 ? (
        <p className="lifeline-empty">Solve {nextRewardIn} more to earn a lifeline.</p>
      ) : (
        chips.length > 0 && (
          <ul className="lifeline-list">
            {chips.map((key, i) => {
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
                    <span className="lifeline-text">
                      <span className="lifeline-label">{def.label}</span>
                      <span className="lifeline-desc">{def.blurb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
