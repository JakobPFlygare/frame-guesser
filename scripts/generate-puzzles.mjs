// Regenerates src/data/puzzles.ts from TMDB's most-voted (famous) titles.
// Usage:  node scripts/generate-puzzles.mjs
//
// - Reads the TMDB token from .env.local (only needed HERE, at build time).
// - Collapses each movie franchise to a single base entry (via TMDB
//   collections), so "Thor" is the only Thor, no "Thor: Ragnarok" etc.
// - Bakes title + backdrop + clues (year/genre/director/actor) into the file,
//   so the app itself needs NO token and makes NO API calls at runtime — images
//   come from the public image CDN. That makes it safe to host statically.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- config: tune these to taste ----
const MOVIE_PAGES = 45; // 20 per page; deeper = more variety (candidates before dedup)
const TV_PAGES = 20;
const MAX_MOVIES = 450;
const MAX_TV = 150;
const MOVIE_MIN_VOTES = 250; // higher = more mainstream / less obscure
const TV_MIN_VOTES = 100;
const CONCURRENCY = 12;
// --------------------------------------

const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
const token = (env.match(/^VITE_TMDB_TOKEN=(.*)$/m)?.[1] ?? '').trim();
if (!token) throw new Error('No VITE_TMDB_TOKEN found in .env.local');
const useBearer = token.includes('.');

async function tmdb(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const headers = { accept: 'application/json' };
  if (useBearer) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set('api_key', token);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function fetchPages(path, pages, params) {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    const data = await tmdb(path, { ...params, page: p });
    out.push(...data.results);
  }
  return out;
}

async function mapPool(items, fn, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch {
        results[idx] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// A title we'd rather not keep as a franchise's representative.
function isSequelish(title) {
  return (
    title.includes(':') || // subtitled sequel: "Thor: Ragnarok"
    /\b(?:part|vol|volume|chapter|episode|season)s?\.?\s+(?:\d+|one|two|three|four|five|i{1,3}|iv|v|vi{0,3}|ix|x)\b/i.test(
      title,
    ) ||
    /\s\d+$/.test(title) || // "Iron Man 2"
    /\s(?:II|III|IV|V|VI|VII|VIII|IX)$/.test(title)
  );
}

// Strip subtitle / number / "and the ..." to get the franchise base name.
// "Thor: Ragnarok" -> "Thor", "Harry Potter and the Goblet of Fire" -> "Harry
// Potter", "Iron Man 2" -> "Iron Man". Used to collapse a whole franchise to one.
function baseName(title) {
  let b = title.split(':')[0];
  b = b.replace(/\s+(?:part|vol|volume|chapter)\.?\s+.*/i, '');
  b = b.replace(/\s+and\s+the\s+.*/i, '');
  b = b.replace(/\s+\d+$/, '');
  b = b.replace(/\s+(?:II|III|IV|V|VI|VII|VIII|IX|X)$/, '');
  return b.trim();
}

function normalizeTitle(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Grouping key for a franchise: base title, minus a leading article, so
// "The Avengers" and "Avengers: Endgame" land in the same group.
function franchiseKey(title) {
  return normalizeTitle(baseName(title)).replace(/^(?:the|a|an)\s+/, '');
}

// Fetch details (collection + clues) for one discover result.
async function detail(item, mediaType) {
  const d = await tmdb(`${mediaType}/${item.id}`, { append_to_response: 'credits' });
  const title = mediaType === 'movie' ? d.title : d.name;
  const dateStr = (mediaType === 'movie' ? d.release_date : d.first_air_date) || '';
  const director =
    d.credits?.crew?.find((c) => c.job === 'Director')?.name || d.created_by?.[0]?.name;
  const backdropPath = item.backdrop_path || d.backdrop_path;
  if (!title || !backdropPath) return null;
  return {
    tmdbId: item.id,
    mediaType,
    title,
    backdropPath,
    collectionId: d.belongs_to_collection?.id ?? null,
    clues: {
      year: dateStr ? dateStr.slice(0, 4) : undefined,
      genre: d.genres?.[0]?.name,
      director,
      actor: d.credits?.cast?.[0]?.name,
    },
  };
}

// Pick the best representative for a franchise: prefer a clean base title.
function pickRepresentative(members) {
  return [...members].sort((a, b) => {
    const seq = (isSequelish(a.title) ? 1 : 0) - (isSequelish(b.title) ? 1 : 0);
    if (seq !== 0) return seq;
    if (a.title.length !== b.title.length) return a.title.length - b.title.length;
    return a.rank - b.rank; // tie -> higher vote count (earlier in list)
  })[0];
}

console.log('Fetching movies…');
const movieRaw = await fetchPages('discover/movie', MOVIE_PAGES, {
  include_adult: 'false',
  sort_by: 'vote_count.desc',
  'vote_count.gte': MOVIE_MIN_VOTES,
  language: 'en-US',
});
const movieDetailed = (await mapPool(movieRaw, (m) => detail(m, 'movie')))
  .filter(Boolean)
  .map((m, rank) => ({ ...m, rank }));

// Collapse each franchise to a single entry, grouped by base title.
function dedupeByFranchise(items, max) {
  const groups = new Map();
  for (const m of items) {
    const key = franchiseKey(m.title);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }
  return [...groups.values()]
    .map(pickRepresentative)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, max);
}

const movies = dedupeByFranchise(movieDetailed, MAX_MOVIES);

console.log('Fetching TV…');
const tvRaw = await fetchPages('discover/tv', TV_PAGES, {
  sort_by: 'vote_count.desc',
  'vote_count.gte': TV_MIN_VOTES,
  language: 'en-US',
});
const tvDetailed = (await mapPool(tvRaw, (t) => detail(t, 'tv')))
  .filter(Boolean)
  .map((t, rank) => ({ ...t, rank }));
const tv = dedupeByFranchise(tvDetailed, MAX_TV);

const usedIds = new Set();
function entryFor(m) {
  let id = slugify(m.title);
  if (usedIds.has(id)) id = `${id}-${m.clues.year ?? m.tmdbId}`;
  if (usedIds.has(id)) id = `${id}-${m.tmdbId}`;
  usedIds.add(id);
  const clueStr = Object.entries(m.clues)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ');
  // If the kept title is subtitled (e.g. "Captain America: Civil War"), accept
  // the franchise base ("Captain America") as a correct guess too.
  const base = baseName(m.title);
  const aliasPart =
    normalizeTitle(base) !== normalizeTitle(m.title)
      ? `answerAliases: [${JSON.stringify(base)}], `
      : '';
  return (
    `  { id: ${JSON.stringify(id)}, mediaType: ${JSON.stringify(m.mediaType)}, ` +
    `tmdbId: ${m.tmdbId}, title: ${JSON.stringify(m.title)}, ` +
    `backdropPath: ${JSON.stringify(m.backdropPath)}, ${aliasPart}clues: { ${clueStr} } },`
  );
}

const header = `import type { ClueKey } from '../config/scoring';

export type MediaType = 'movie' | 'tv';

export type Puzzle = {
  /** Stable slug. */
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  /** Canonical answer, used for guess matching. */
  title: string;
  /** Backdrop path like "/abc123.jpg" (served from the public image CDN). */
  backdropPath: string;
  /** Accepted alternate spellings for the guess matcher. */
  answerAliases?: string[];
  /** Baked clue values (year/genre/director/actor). */
  clues?: Partial<Record<ClueKey, string>>;
};

// Auto-generated by scripts/generate-puzzles.mjs from TMDB. Re-run
// \`node scripts/generate-puzzles.mjs\` to refresh. Hand-edits are overwritten —
// tweak the generator's config instead.
export const PUZZLES: Puzzle[] = [
`;

const body = [...movies, ...tv].map(entryFor).join('\n');
writeFileSync(join(ROOT, 'src/data/puzzles.ts'), `${header}${body}\n];\n`);
console.log(`Wrote ${movies.length + tv.length} puzzles (${movies.length} movies, ${tv.length} TV).`);
