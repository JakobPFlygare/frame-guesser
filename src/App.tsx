import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { PUZZLES } from './data/puzzles';
import { loadPuzzleData } from './lib/tmdb';
import { drawNext } from './lib/deck';
import {
  DEFAULT_MODE,
  MODE_LABELS,
  START_FRAMES,
  solveFrameReward,
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
  STARTING_LIFELINE_POOL,
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

/** A random run-opening lifeline. */
function startingLifeline(): LifelineKey {
  return STARTING_LIFELINE_POOL[Math.floor(Math.random() * STARTING_LIFELINE_POOL.length)];
}

/** Frames runs open with one free lifeline; Classic uses no lifelines. */
function initialInventory(m: GameMode): LifelineKey[] {
  return m === 'frames' ? [startingLifeline()] : [];
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
  const [inventory, setInventory] = useState<LifelineKey[]>(() => initialInventory(mode)); // held, unspent
  const [freeReveals, setFreeReveals] = useState(0); // banked from Refund
  // The lifeline just drawn (drives the "reward earned" pop animation); cleared
  // once the animation finishes or the next movie starts. Seeded with the run's
  // opening lifeline so the player clearly sees what they start with.
  const [justEarned, setJustEarned] = useState<LifelineKey | null>(() => inventory[0] ?? null);

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
  // Defaults to the current mode; changeMode passes the new one explicitly since
  // the `mode` state hasn't flushed yet at that call site.
  function beginRun(m: GameMode = mode) {
    const opening = initialInventory(m);
    setLives(STARTING_LIVES);
    setFramesLeft(START_FRAMES);
    setRunCluesUsed([]);
    setBag(shuffle(LIFELINE_POOL));
    setEarned(0);
    setInventory(opening);
    setFreeReveals(0);
    setJustEarned(opening[0] ?? null); // pop the opener so it's clear what you start with
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
    beginRun(m); // different rules -> restart the run (m: mode state not flushed yet)
  }

  // Move to the next movie, keeping run-level resources.
  function advance() {
    setJustEarned(null);
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
    setJustEarned(key); // trigger the "reward earned" pop
  }

  function handleWin(movieScore: number, framesUsed: number) {
    const nextSolved = solved + 1;
    setTotalScore((s) => s + movieScore);
    setSolved(nextSolved);
    if (mode === 'frames') {
      // Reward the solve with frames back — more for a lean solve — so a good
      // streak can claw its way out of a near-empty pool instead of only draining.
      setFramesLeft((f) => f + solveFrameReward(framesUsed));
      if (nextSolved % LIFELINE_EVERY === 0) earnLifeline();
    }
  }

  // A miss costs a life in BOTH modes now; the run ends only when lives run out
  // (the Game routes the last miss's "See results" button to finish()).
  function handleLose() {
    setLives((l) => l - 1);
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
      // 'extraLife' is passive — it isn't "used"; it's consumed automatically by
      // a wrong guess (in <Game>), which just removes it from the inventory below.
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
          onPlayAgain={() => beginRun()}
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
          justEarned={justEarned}
          onWin={handleWin}
          onLose={handleLose}
          onSpendFrame={() => setFramesLeft((f) => Math.max(0, f - 1))}
          onConsumeFreeReveal={() => setFreeReveals((f) => Math.max(0, f - 1))}
          onRewardSeen={() => setJustEarned(null)}
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
