import { GRID_COLS, GRID_ROWS, TILE_COUNT } from '../config/scoring';

type Props = {
  imageUrl: string | null;
  revealed: number[];
  onReveal: (index: number) => void;
  /** When true (game over), every tile is uncovered regardless of state. */
  revealAll: boolean;
};

export function TileGrid({ imageUrl, revealed, onReveal, revealAll }: Props) {
  const revealedSet = new Set(revealed);

  return (
    <div className="frame">
      {imageUrl ? (
        <img className="frame-img" src={imageUrl} alt="Hidden movie frame" />
      ) : (
        <div className="frame-img frame-placeholder">
          <span>No image — add a TMDB token or a backdropPath to this puzzle.</span>
        </div>
      )}

      <div
        className="tile-grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: TILE_COUNT }, (_, i) => {
          const isOpen = revealAll || revealedSet.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`tile${isOpen ? ' tile-open' : ''}`}
              onClick={() => onReveal(i)}
              disabled={isOpen}
              aria-label={isOpen ? `Tile ${i + 1} revealed` : `Reveal tile ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
