const STREAK_KEY = 'fg:streak';

type StreakData = { streak: number; lastDate: string | null; lastWon: boolean };

const empty: StreakData = { streak: 0, lastDate: null, lastWon: false };

function read(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as StreakData) } : empty;
  } catch {
    return empty;
  }
}

/** dateKey (yyyy-mm-dd) minus one day, in the same format. */
function previousDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Record the result for a given day and return the updated streak. Idempotent
 * per day: calling again for the same date (e.g. after a reload) is a no-op.
 */
export function recordResult(dateKey: string, won: boolean): number {
  const data = read();
  if (data.lastDate === dateKey) return data.streak;

  let streak: number;
  if (won) {
    streak = data.lastDate === previousDay(dateKey) && data.lastWon ? data.streak + 1 : 1;
  } else {
    streak = 0;
  }

  const next: StreakData = { streak, lastDate: dateKey, lastWon: won };
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {
    /* non-fatal */
  }
  return streak;
}
