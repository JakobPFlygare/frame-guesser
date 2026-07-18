# Frame Guesser

Guess the movie or TV show from a hidden frame. Each frame is covered by a grid of tiles;
uncover tiles to reveal parts of the image, then guess the title. The fewer tiles you
reveal, the higher your score.

## Gameplay

Two modes, each with its own leaderboard. Switch between them with the toggle under the
header. One tile starts uncovered for free every movie, and it's always one guess per frame.

**Frames (default) — survival.** You get a shared pool of frames (`START_FRAMES`, default 30)
for the *whole run*. Every tile you uncover spends one frame; frames persist across movies and
never come back, so late in a run you're guessing on little. A wrong guess or give-up ends the
run. Clues (year / genre / director / lead actor) are **free**, but each can be used only
**once per run** — spend them wisely. Your **score is simply how many movies you solve** — it's
a survival streak, not a points tally.

Every `LIFELINE_EVERY` solves (default 5) you earn a **lifeline**, drawn from a shuffled bag so
the order is a surprise each run. Each is a one-time consumable held in a panel next to your
clues: **The Bomb** (reveal a 3×3 block free), **+5 Frames**, **Refund** (next 3 reveals free),
**Corners** / **Crosshair** / **X-Ray** (free tile reveals), **Extra Life** (survive one wrong
guess), **Skip** (skip a movie, no solve/no miss) and **Clue Reset** (refresh all clues). The
pool lives in `src/config/lifelines.ts`.

**Lives — budget.** 3 lives per run; a wrong guess or give-up costs one. Here points are a
*spendable budget*: every movie starts at `MAX_SCORE`, and each tile (escalating cost) and each
clue (flat cost) is deducted from it. **You can't buy what you can't afford** — so you can't
just reveal everything to de-risk a guess. Whatever budget survives is what a correct guess banks.

**Leaderboard.** Reachable any time from the header. Scores are per-mode, saved locally by
default or shared via Supabase (see below).

Built with Vite + React + TypeScript. Fully static — no backend, no API calls at runtime.

## Develop

```bash
npm install
npm run dev
```

## Puzzle data

`src/data/puzzles.ts` is **auto-generated** — don't hand-edit it. It's produced by:

```bash
node scripts/generate-puzzles.mjs
```

The generator pulls the most-voted (famous, non-obscure) movies + TV shows from TMDB,
collapses each franchise to a single entry (so "Thor" is the only Thor — no
"Thor: Ragnarok"), and **bakes** the title, backdrop path, and clues into the file. Because
everything is baked in, the app needs **no TMDB token at runtime** and makes no API calls —
images come from TMDB's public image CDN. Tune the counts / vote thresholds at the top of
the script.

Generating requires a token: create a free account at themoviedb.org, and put your API
Read Access Token (or v3 key) in `.env.local` as `VITE_TMDB_TOKEN=...`. This file is
git-ignored and only used by the generator — it never ships to the deployed site.

## Deploy to GitHub Pages

The repo includes `.github/workflows/deploy.yml`, which builds and publishes on every push
to `main`. One-time setup:

1. Create a GitHub repo named **frame-guesser** and push this project to it.
   (If you name it differently, update `base` in `vite.config.ts` to `/<repo-name>/`.)
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The Actions tab shows the deploy; when it's green the site is live at
   `https://<your-username>.github.io/frame-guesser/`.

No secrets are needed — the puzzle data is already baked into the committed source.

## Shared leaderboard (Supabase)

Out of the box the leaderboard is **local** (per browser, via `localStorage`). To make it
**shared** — so you and your friends all see the same scores — connect a free Supabase
project. No server code and no extra npm dependency: the app talks to Supabase's REST API
directly, and falls back to the local board whenever it isn't configured.

**1. Create the table.** In your Supabase project open **SQL Editor** and run:

```sql
create table public.scores (
  id     bigint generated always as identity primary key,
  name   text    not null check (char_length(name) between 1 and 20),
  score  integer not null check (score >= 0),
  solved integer not null default 0 check (solved >= 0),
  -- Per-mode boards. Named `game_mode` (not `mode`) because `mode` collides with
  -- a built-in Postgres aggregate and confuses the REST layer.
  game_mode text not null default 'classic' check (game_mode in ('frames', 'classic')),
  created_at timestamptz not null default now()
);

-- Lock it down: anyone may READ the board and INSERT a score, nothing else.
alter table public.scores enable row level security;

create policy "read scores"   on public.scores for select using (true);
create policy "insert scores" on public.scores for insert with check (
  char_length(name) between 1 and 20 and score >= 0 and score <= 1000000
  and game_mode in ('frames', 'classic')
);
```

**Already have a `scores` table from an earlier version?** Add the mode column instead —
existing rows become Classic (they were the old lives-based scores):

```sql
alter table public.scores
  add column game_mode text not null default 'classic'
  check (game_mode in ('frames', 'classic'));
```

Because RLS is on and only `select` + `insert` policies exist, visitors can't update or
delete anyone's scores — which is why shipping the public key below is safe.

**2. Wire up the keys.** Open `src/config/supabase.ts` and paste in your project's:

- **Project URL** — Project Settings → Data API → Project URL
- **anon / public key** — Project Settings → API Keys → `anon` `public`

The `anon` key is *publishable* by design; it's meant to live in the browser bundle. Commit
the file — the GitHub Pages build needs these values, and no secret configuration is required.

**3. Push.** The deploy workflow rebuilds and the shared board goes live. To reset the board,
delete rows in the Supabase **Table Editor**.

## Notes

- Tuning knobs live in `src/config/scoring.ts`: grid size, `MAX_SCORE`, `STARTING_LIVES`,
  `START_FRAMES`, tile costs (`TILE_BASE_COST` / `TILE_COST_STEP`), clue costs, and
  `DEFAULT_MODE`. Frames-mode lifelines are in `src/config/lifelines.ts`: the `LIFELINE_POOL`,
  `LIFELINE_EVERY` (solves per reward), `PLUS_FRAMES_AMOUNT`, and `REFUND_TILES`.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
