// Supabase connection for the shared leaderboard.
//
// These two values are PUBLISHABLE — the "anon" key is designed to be exposed
// in a browser bundle. It is safe to commit and ship. Security does NOT come
// from hiding this key; it comes from the Row Level Security (RLS) policies on
// the `scores` table, which only allow inserting a score and reading the board
// (no updates, no deletes). See the README ("Shared leaderboard") for setup.
//
// Paste your project's values below. Until both are filled in, the app falls
// back to a local (per-browser) leaderboard, so the game still works.
//
//   Project URL:  Supabase dashboard -> Project Settings -> Data API -> Project URL
//   anon key:     Supabase dashboard -> Project Settings -> API Keys -> anon / public

export const SUPABASE_URL = 'https://aokpokndegwgfahjbqae.supabase.co/rest/v1/';
export const SUPABASE_ANON_KEY = 'sb_publishable_yCaFgnp65nMu01Ami9dnzg_AVEaPkFl';

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
