# Libros en Casa

A small personal webapp for cataloging our home book collection. Static
frontend + Supabase (Postgres + Auth) backend, no server to run or maintain.

## Features

- Books grouped by category, sorted alphabetically by title within each group
- Live search across title and author
- Category filter
- Add / edit / delete books
- **Vinyl tab**: record collection shown as sleeve-and-disc cards, with search and genre filter
- Single login gate (Supabase Auth) — only you can view or edit

## One-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. **Run the schema**: open the SQL Editor in your Supabase project, paste the
   contents of `schema.sql`, and run it.
3. **Seed your books**: run `seed.sql` the same way to load the full collection.
   Then run `schema-vinyl.sql` to add the vinyl records table.
4. **Create yourself a user**: Supabase dashboard → Authentication → Users →
   Add user. Enter your email and a password. (There's no signup screen in
   the app on purpose — this is a single-user app.)
5. **Get your API keys**: Supabase dashboard → Project Settings → API. Copy
   the Project URL and the `anon` public key.
6. **Configure the frontend**:
   ```
   cp config.example.js config.js
   ```
   then edit `config.js` and paste in your Project URL and anon key. The
   anon key is safe to expose client-side — access is enforced by the Row
   Level Security policies in `schema.sql`, not by hiding the key.

## Running locally

This is a static site with no build step. Serve it with any static file
server, e.g.:

```
npx serve .
```

Then open the printed URL and log in with the user you created in step 4.

## Deploying (free)

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com) (free tier) as a new project.
   Framework preset: "Other" — no build command, output directory `.`.
3. Deploy. `config.js` ships with the built site, so no environment
   variables need to be set in Vercel.

## Adding more books later

Use the "+ Add book" / "+ Add record" buttons in the app, or insert rows directly into the
`books` table from the Supabase dashboard/SQL editor.
