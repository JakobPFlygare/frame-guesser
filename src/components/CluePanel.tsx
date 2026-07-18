import { CLUE_COSTS, CLUE_LABELS, CLUE_ORDER, type ClueKey } from '../config/scoring';

type Props = {
  clues: Record<ClueKey, string | undefined>;
  used: ClueKey[];
  onUseClue: (clue: ClueKey) => void;
  disabled: boolean;
};

export function CluePanel({ clues, used, onUseClue, disabled }: Props) {
  return (
    <div className="clue-panel">
      <h2 className="panel-title">Clues</h2>
      <ul className="clue-list">
        {CLUE_ORDER.map((key) => {
          const isUsed = used.includes(key);
          const value = clues[key];
          return (
            <li key={key} className="clue-item">
              <span className="clue-name">{CLUE_LABELS[key]}</span>
              {isUsed ? (
                <span className="clue-value">{value ?? 'Unknown'}</span>
              ) : (
                <button
                  type="button"
                  className="clue-button"
                  disabled={disabled}
                  onClick={() => onUseClue(key)}
                >
                  Reveal (−{CLUE_COSTS[key]})
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
