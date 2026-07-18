import { LIFELINES, type LifelineKey } from '../config/lifelines';

type Props = {
  /** The lifeline just earned, or null when nothing is playing. */
  reward: LifelineKey | null;
  /** Called when the pop animation finishes so the parent can clear it. */
  onDone: () => void;
};

/**
 * A one-shot celebration that pops the earned lifeline over the frame and then
 * drifts it downward toward the Lifelines panel (which glows to receive it), so
 * the player can see WHAT they got and WHERE it now lives. Mount-triggered CSS:
 * rendering it (reward != null) plays the animation once; `onAnimationEnd`
 * fires when the card settles, and the parent unmounts it by clearing `reward`.
 */
export function RewardPop({ reward, onDone }: Props) {
  if (!reward) return null;
  const def = LIFELINES[reward];
  return (
    <div className="reward-pop" role="status" aria-live="polite">
      <div className="reward-pop-card" onAnimationEnd={onDone}>
        <span className="reward-pop-icon" aria-hidden="true">
          {def.icon}
        </span>
        <span className="reward-pop-title">Lifeline earned!</span>
        <span className="reward-pop-name">{def.label}</span>
      </div>
    </div>
  );
}
