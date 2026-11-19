# Libros en Casa

Personal (non-work) webapp cataloging the home book and vinyl collection. Single user.
Static frontend (vanilla HTML/CSS/JS, **no build step, no npm**) + Supabase (Postgres + Auth).

- Repo: `github.com/demianlicht/bookish` (branch `main`)
- Live: https://bookish-topaz-tau.vercel.app/ (Vercel, auto-deploys on push to `main`)

## Git: personal key only

This is a personal repo. Every git network operation must use the personal SSH key:

```
export GIT_SSH_COMMAND="ssh -o IdentitiesOnly=yes -i ~/.ssh/id_Z_ed25519"
```

Commit as `demianlicht` (local git config is already set). Never commit under the work identity.

## Layout

| File | Purpose |
|------|---------|
| `index.html` | All markup: login view, app view with Books/Vinyl tabs, two modals |
| `app.js` | Auth (Supabase email+password), books CRUD/search/filter/render. Defines `supabaseClient` |
| `vinyl.js` | Vinyl tab: tabs switching, vinyl CRUD/search/genre filter, sleeve+disc cards. Wrapped in an IIFE; exposes `window.loadVinyl` |
| `style.css` | All styles (CSS variables in `:root`) |
| `config.js` | `window.SUPABASE_URL` / `SUPABASE_ANON_KEY`. Committed on purpose: publishable key, safe client-side |
| `schema.sql` / `schema-vinyl.sql` | Tables + RLS. Run manually in the Supabase SQL editor |
| `seed.sql` | The book collection (run once after `schema.sql`) |
| `vendor/supabase.min.js` | Vendored supabase-js (no CDN) |

## Run locally

`python3 -m http.server` or `npx serve .` in the repo root; log in with the user created in
Supabase → Authentication → Users. There is no signup screen on purpose.

## Data model and security

- `books(id, title, author, category, created_at)`
- `vinyl_records(id, title, artist, year, genre, created_at)`
- RLS is on for both: any `authenticated` user may select/insert/update/delete. Access control is
  the login plus RLS, not key secrecy. Don't add public-read policies.
- Schema changes are **manual**: edit the `.sql` file, and tell the user to run it in the Supabase SQL
  editor. Nothing applies them automatically.

## Gotchas

- **Never name a top-level variable `supabase`.** The vendored library defines `window.supabase`,
  and `const supabase = ...` throws "Can't create duplicate variable that shadows a global property".
  The client is `supabaseClient`.
- Script order matters in `index.html`: `supabase.min.js` → `config.js` → `vinyl.js` → `app.js`.
  `app.js` calls `loadVinyl()` from `showApp()`; `vinyl.js` uses `supabaseClient` lazily.
- Render user data with `textContent`, never `innerHTML` (only static strings go through `innerHTML`).
- The selected tab is remembered in `localStorage` (`activeTab`), wrapped in try/catch.

## Deploying

Push to `main` (with the personal key above); Vercel builds it with no build command and output
directory `.`. No environment variables. After a new domain or first deploy, set Supabase →
Authentication → URL Configuration → Site URL to the Vercel URL.
