import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { PUZZLES } from './data/puzzles';
import { loadPuzzleData } from './lib/tmdb';
import { STARTING_LIVES, TILE_COUNT } from './config/scoring';
import { Game } from './components/Game';
import { RunOverScreen } from './components/RunOverScreen';
import { LeaderboardModal } from './components/LeaderboardModal';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const randomTile = () => Math.floor(Math.random() * TILE_COUNT);

export default function App() {
  const [order, setOrder] = useState(() => shuffle(PUZZLES.map((_, i) => i)));
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0); // bumps every movie -> remounts <Game>
  const [startTile, setStartTile] = useState(() => randomTile());
  const [lives, setLives] = useState(STARTING_LIVES);
  const [totalScore, setTotalScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'runover'>('playing');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const puzzle = PUZZLES[order[pos]];
  const data = useMemo(() => loadPuzzleData(puzzle), [puzzle]);

  // Jump back to the top whenever a new frame starts or the run ends, so the
  // player isn't left scrolled down where the keyboard/guess box just were.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [round, phase]);

  function advance() {
    setRound((r) => r + 1);
    setStartTile(randomTile());
    const np = pos + 1;
    if (np >= order.length) {
      setOrder(shuffle(order));
      setPos(0);
    } else {
      setPos(np);
    }
  }

  function handleWin(movieScore: number) {
    setTotalScore((s) => s + movieScore);
    setSolved((n) => n + 1);
  }

  function handleLose() {
    setLives((l) => l - 1);
  }

  function handleNext() {
    if (lives <= 0) setPhase('runover');
    else advance();
  }

  function playAgain() {
    setLives(STARTING_LIVES);
    setTotalScore(0);
    setSolved(0);
    setOrder(shuffle(order));
    setPos(0);
    setRound((r) => r + 1);
    setStartTile(randomTile());
    setPhase('playing');
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

      {phase === 'runover' ? (
        <RunOverScreen totalScore={totalScore} solved={solved} onPlayAgain={playAgain} />
      ) : (
        <Game
          key={round}
          puzzle={puzzle}
          data={data}
          initialReveal={startTile}
          lives={lives}
          totalScore={totalScore}
          onWin={handleWin}
          onLose={handleLose}
          onNext={handleNext}
        />
      )}

      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

      <footer className="app-footer">
        <p className="attribution">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </footer>
    </main>
  );
}
