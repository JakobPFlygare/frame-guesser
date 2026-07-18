// Builds public/image-review.html — a contact sheet of every backdrop in
// puzzles.ts, grouped by title. Click an image to mark it for removal; marks are
// saved to localStorage['fg:removals'] (an array of "/path.jpg"). Then Claude
// reads that key from the browser and strips those paths from the data + adds
// them to scripts/backdrop-blocklist.json so they never return on regeneration.
//
// Usage:  node scripts/build-image-review.mjs
//         then open http://localhost:5173/image-review.html (vite dev server)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(ROOT, 'src/data/puzzles.ts'), 'utf8');

// Each puzzle is one object literal; pull id, title and the backdrop array.
const entries = [];
const re =
  /id:\s*"([^"]+)"[^}]*?title:\s*"((?:[^"\\]|\\.)*)"[^}]*?backdropPaths:\s*\[([^\]]*)\]/g;
let m;
while ((m = re.exec(src))) {
  const [, id, title, arr] = m;
  const paths = [...arr.matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  entries.push({ id, title: JSON.parse(`"${title}"`), paths });
}

const total = entries.reduce((n, e) => n + e.paths.length, 0);
const data = JSON.stringify(entries);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Frame Guesser — image review</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #0b0d13; color: #eef0f6; }
  .bar {
    position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; padding: 12px 16px; background: #11141dee; backdrop-filter: blur(8px);
    border-bottom: 1px solid #2b3142;
  }
  .bar h1 { font-size: 16px; margin: 0; margin-right: auto; }
  .bar input { padding: 8px 12px; border-radius: 8px; border: 1px solid #2b3142; background: #1d222e; color: #eef0f6; font-size: 14px; min-width: 220px; }
  .count { font-variant-numeric: tabular-nums; font-weight: 700; }
  .marked-count { color: #ff6b6b; }
  .btn { padding: 8px 14px; border-radius: 8px; border: 1px solid #2b3142; background: #1d222e; color: #eef0f6; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn:hover { border-color: #6ea8ff; }
  .hint { padding: 10px 16px; color: #9198a8; font-size: 13px; border-bottom: 1px solid #1d222e; }
  .movie { padding: 14px 16px; border-bottom: 1px solid #1d222e; }
  .movie h2 { font-size: 15px; margin: 0 0 10px; }
  .movie h2 small { color: #626a7b; font-weight: 400; }
  .row { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  figure { margin: 0; position: relative; cursor: pointer; border-radius: 10px; overflow: hidden; border: 2px solid transparent; background: #000; }
  figure img { display: block; width: 100%; aspect-ratio: 16/9; object-fit: cover; }
  figure figcaption { font-size: 10px; color: #626a7b; padding: 4px 6px; word-break: break-all; font-family: ui-monospace, monospace; }
  figure.marked { border-color: #ff6b6b; }
  figure.marked img { opacity: 0.35; filter: grayscale(0.6); }
  figure .x { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; font-size: 44px; color: #ff6b6b; text-shadow: 0 2px 8px #000; pointer-events: none; }
  figure.marked .x { display: flex; }
  .tag { position: absolute; top: 6px; left: 6px; background: #000a; color: #cbd3e2; font-size: 10px; padding: 2px 6px; border-radius: 999px; }
</style>
</head>
<body>
  <div class="bar">
    <h1>Image review</h1>
    <input id="search" type="search" placeholder="Filter by title…" />
    <span class="count"><span id="shown">0</span> shown</span>
    <span class="count marked-count"><span id="marked">0</span> marked</span>
    <button class="btn" id="export">Copy removals</button>
    <button class="btn" id="clear">Clear marks</button>
  </div>
  <div class="hint">Click any image to mark it for removal (red outline + ✗). Marks are saved automatically. Tell Claude when you're done — it reads your marks from the browser and strips them.</div>
  <div id="app"></div>

<script>
const DATA = ${data};
const KEY = 'fg:removals';
const removals = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
const app = document.getElementById('app');
const IMG = (p) => 'https://image.tmdb.org/t/p/w300' + p;

function save() {
  localStorage.setItem(KEY, JSON.stringify([...removals]));
  document.getElementById('marked').textContent = removals.size;
}

function render(filter = '') {
  const f = filter.trim().toLowerCase();
  app.innerHTML = '';
  let shown = 0;
  for (const e of DATA) {
    if (f && !e.title.toLowerCase().includes(f)) continue;
    shown++;
    const movie = document.createElement('div');
    movie.className = 'movie';
    const h2 = document.createElement('h2');
    h2.innerHTML = e.title + ' <small>· ' + e.paths.length + ' frames · ' + e.id + '</small>';
    movie.appendChild(h2);
    const row = document.createElement('div');
    row.className = 'row';
    e.paths.forEach((p, i) => {
      const fig = document.createElement('figure');
      if (removals.has(p)) fig.classList.add('marked');
      fig.innerHTML =
        '<span class="tag">#' + (i + 1) + '</span>' +
        '<span class="x">✗</span>' +
        '<img loading="lazy" src="' + IMG(p) + '" alt="" />' +
        '<figcaption>' + p + '</figcaption>';
      fig.addEventListener('click', () => {
        if (removals.has(p)) { removals.delete(p); fig.classList.remove('marked'); }
        else { removals.add(p); fig.classList.add('marked'); }
        save();
      });
      row.appendChild(fig);
    });
    movie.appendChild(row);
    app.appendChild(movie);
  }
  document.getElementById('shown').textContent = shown;
}

document.getElementById('search').addEventListener('input', (e) => render(e.target.value));
document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Clear all ' + removals.size + ' marks?')) { removals.clear(); save(); render(document.getElementById('search').value); }
});
document.getElementById('export').addEventListener('click', async () => {
  const text = JSON.stringify([...removals], null, 2);
  try { await navigator.clipboard.writeText(text); alert('Copied ' + removals.size + ' paths to clipboard.'); }
  catch { prompt('Copy these paths:', text); }
});

document.getElementById('marked').textContent = removals.size;
render();
</script>
</body>
</html>
`;

const outDir = join(ROOT, 'public');
if (!existsSync(outDir)) mkdirSync(outDir);
writeFileSync(join(outDir, 'image-review.html'), html);
console.log(`Wrote public/image-review.html — ${entries.length} titles, ${total} images.`);
