# Frame Guesser

Guess the movie or TV show from a hidden frame. Each frame is covered by a grid of tiles;
uncover tiles to reveal parts of the image, then guess the title. The fewer tiles you
reveal, the higher your score.

## Gameplay

- **3 lives per run.** A wrong guess or a give-up costs a life; at 0 lives the run ends.
- **One guess per frame.** Get it right to bank points and move on; miss (or give up) to
  see the answer and lose a life.
- **Score decays fast, then slow.** The first reveals cost far more than later ones
  (exponential: `MAX_SCORE * DECAY_RATE^tiles`), so identifying it early is rewarded.
- **One tile starts uncovered for free.** Clues (year / genre / director / lead actor) can
  be revealed for a point cost.
- **Leaderboard.** High scores for a run are saved locally (see note below) with your name.

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

## Notes

- **The leaderboard is local (per browser).** It uses `localStorage`, so scores aren't
  shared between people. A shared online leaderboard would need a small backend (e.g.
  Supabase / Firebase free tier) — a good future addition.
- Tuning knobs: grid size, starting score, decay rate, lives, and clue costs live in
  `src/config/scoring.ts`.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
