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

  const [totalScore, setTotalScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'runover'>('playing');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const puzzle = puzzleFor(currentId);
  const data = useMemo(() => loadPuzzleData(puzzle), [puzzle]);

  // Jump back to the top whenever a new frame starts or the run ends.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [round, phase]);

  // Start a fresh run in the given mode (resets every run-level resource).
  function beginRun(m: GameMode) {
    setLives(STARTING_LIVES);
    setFramesLeft(START_FRAMES);
    setRunCluesUsed([]);
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
    beginRun(m); // different rules -> restart the run
  }

  // Move to the next movie, keeping run-level resources.
  function advance() {
    setRound((r) => r + 1);
    setStartTile(randomTile());
    setCurrentId(drawNext());
  }

  function handleWin(movieScore: number) {
    setTotalScore((s) => s + movieScore);
    setSolved((n) => n + 1);
  }

  // A miss: costs a life in Classic; in Frames it ends the run (handled by the
  // Game's "See results" button routing to finish()).
  function handleLose() {
    if (mode === 'classic') setLives((l) => l - 1);
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
          onPlayAgain={() => beginRun(mode)}
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
          onWin={handleWin}
          onLose={handleLose}
          onSpendFrame={() => setFramesLeft((f) => Math.max(0, f - 1))}
          onUseRunClue={(clue) => setRunCluesUsed((cs) => (cs.includes(clue) ? cs : [...cs, clue]))}
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
