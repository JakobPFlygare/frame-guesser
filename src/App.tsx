import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { PUZZLES } from './data/puzzles';
import { loadPuzzleData } from './lib/tmdb';
import { drawNext } from './lib/deck';
import {
  DEFAULT_MODE,
  MODE_LABELS,
  START_FRAMES,
  STARTING_LIVES,
  TILE_COUNT,
  type ClueKey,
  type GameMode,
} from './config/scoring';
import {
  LIFELINE_EVERY,
  LIFELINE_POOL,
  PLUS_FRAMES_AMOUNT,
  REFUND_TILES,
  shuffle,
  type LifelineKey,
} from './config/lifelines';
import { Game } from './components/Game';
import { RunOverScreen } from './components/RunOverScreen';
import { LeaderboardModal } from './components/LeaderboardModal';

const randomTile = () => Math.floor(Math.random() * TILE_COUNT);

const puzzleById = new Map(PUZZLES.map((p) => [p.id, p]));
const puzzleFor = (id: string) => puzzleById.get(id) ?? PUZZLES[0];

const MODE_KEY = 'fg:mode';
function loadMode(): GameMode {
  try {
    const m = localStorage.getItem(MODE_KEY);
    if (m === 'frames' || m === 'classic') return m;
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}
function saveMode(m: GameMode) {
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {
    /* ignore */
  }
}

/** Remove the first occurrence of `key` from a lifeline inventory. */
function removeFirst(list: LifelineKey[], key: LifelineKey): LifelineKey[] {
  const i = list.indexOf(key);
  if (i < 0) return list;
  return [...list.slice(0, i), ...list.slice(i + 1)];
}

export default function App() {
  const [mode, setMode] = useState<GameMode>(loadMode);

  // The persistent deck (lib/deck) hands out ids without repeating until the
  // whole pool is exhausted — across runs and reloads, not just within one run.
  const [currentId, setCurrentId] = useState(() => drawNext());
  const [round, setRound] = useState(0); // bumps every movie -> remounts <Game>
  const [startTile, setStartTile] = useState(() => randomTile());

  // Run-level resources.
  const [lives, setLives] = useState(STARTING_LIVES); // Classic
  const [framesLeft, setFramesLeft] = useState(START_FRAMES); // Frames
  const [runCluesUsed, setRunCluesUsed] = useState<ClueKey[]>([]); // Frames

  // Frames-mode lifelines: a shuffled bag drawn from every LIFELINE_EVERY solves.
  const [bag, setBag] = useState<LifelineKey[]>(() => shuffle(LIFELINE_POOL));
  const [earned, setEarned] = useState(0); // how many drawn from the bag so far
  const [inventory, setInventory] = useState<LifelineKey[]>([]); // held, unspent
  const [freeReveals, setFreeReveals] = useState(0); // banked from Refund
  const [shield, setShield] = useState(false); // Extra Life armed

  const [totalScore, setTotalScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'runover'>('playing');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const puzzle = puzzleFor(currentId);
  const data = useMemo(() => loadPuzzleData(puzzle), [puzzle]);
  const nextRewardIn = LIFELINE_EVERY - (solved % LIFELINE_EVERY);

  // Jump back to the top whenever a new frame starts or the run ends.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [round, phase]);

  // Start a fresh run in the given mode (resets every run-level resource).
  function beginRun() {
    setLives(STARTING_LIVES);
    setFramesLeft(START_FRAMES);
    setRunCluesUsed([]);
    setBag(shuffle(LIFELINE_POOL));
    setEarned(0);
    setInventory([]);
    setFreeReveals(0);
    setShield(false);
    setTotalScore(0);
    setSolved(0);
    setCurrentId(drawNext());
    setRound((r) => r + 1);
    setStartTile(randomTile());
    setPhase('playing');
  }

  function changeMode(m: GameMode) {
    if (m === mode) return;
    setMode(m);
    saveMode(m);
    beginRun(); // different rules -> restart the run
  }

  // Move to the next movie, keeping run-level resources.
  function advance() {
    setRound((r) => r + 1);
    setStartTile(randomTile());
    setCurrentId(drawNext());
  }

  // Draw the next lifeline from the bag into the inventory (Frames mode).
  function earnLifeline() {
    let b = bag;
    if (earned >= b.length) {
      b = [...b, ...shuffle(LIFELINE_POOL)]; // exhausted the bag -> refill
      setBag(b);
    }
    const key = b[earned];
    setEarned((n) => n + 1);
    setInventory((inv) => [...inv, key]);
  }

  function handleWin(movieScore: number) {
    const nextSolved = solved + 1;
    setTotalScore((s) => s + movieScore);
    setSolved(nextSolved);
    if (mode === 'frames' && nextSolved % LIFELINE_EVERY === 0) earnLifeline();
  }

  // A miss: costs a life in Classic; in Frames it ends the run (handled by the
  // Game's "See results" button routing to finish()).
  function handleLose() {
    if (mode === 'classic') setLives((l) => l - 1);
  }

  // Spend a lifeline. Tile-reveal effects are applied inside <Game>; the run-
  // level ones happen here. Either way the lifeline is removed from inventory.
  function handleLifeline(key: LifelineKey) {
    switch (key) {
      case 'plusFrames':
        setFramesLeft((f) => f + PLUS_FRAMES_AMOUNT);
        break;
      case 'refund':
        setFreeReveals((f) => f + REFUND_TILES);
        break;
      case 'extraLife':
        setShield(true);
        break;
      case 'clueReset':
        setRunCluesUsed([]);
        break;
      case 'skip':
        advance();
        break;
      default:
        break; // reveal effects handled in <Game>
    }
    setInventory((inv) => removeFirst(inv, key));
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>
          Frame <span className="fg-mark">Guesser</span>
        </h1>
        <button
          type="button"
          className="lb-nav"
          onClick={() => setShowLeaderboard(true)}
          aria-label="View leaderboard"
        >
          <span className="lb-nav-icon" aria-hidden="true" />
          Leaderboard
        </button>
      </header>

      <div className="mode-switch" role="tablist" aria-label="Game mode">
        {(['frames', 'classic'] as GameMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={`mode-tab${mode === m ? ' active' : ''}`}
            onClick={() => changeMode(m)}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {phase === 'runover' ? (
        <RunOverScreen
          mode={mode}
          totalScore={totalScore}
          solved={solved}
          onPlayAgain={beginRun}
        />
      ) : (
        <Game
          key={round}
          puzzle={puzzle}
          data={data}
          initialReveal={startTile}
          mode={mode}
          lives={lives}
          framesLeft={framesLeft}
          runCluesUsed={runCluesUsed}
          totalScore={totalScore}
          nextRewardIn={nextRewardIn}
          inventory={inventory}
          freeReveals={freeReveals}
          shield={shield}
          onWin={handleWin}
          onLose={handleLose}
          onSpendFrame={() => setFramesLeft((f) => Math.max(0, f - 1))}
          onConsumeFreeReveal={() => setFreeReveals((f) => Math.max(0, f - 1))}
          onConsumeShield={() => setShield(false)}
          onUseRunClue={(clue) => setRunCluesUsed((cs) => (cs.includes(clue) ? cs : [...cs, clue]))}
          onLifeline={handleLifeline}
          onAdvance={advance}
          onFinish={() => setPhase('runover')}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal initialMode={mode} onClose={() => setShowLeaderboard(false)} />
      )}

      <footer className="app-footer">
        <p className="attribution">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </main>
  );
}
