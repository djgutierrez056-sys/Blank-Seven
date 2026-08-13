# Chalupa 🛶

Online Lotería (Mexican Bingo) — play "Chalupa" with friends in real time.

Each player gets a random 4×4 board (tabla) of the 54 traditional Lotería cards.
The room creator is the caller and draws cards one at a time. Everyone marks
matching cards on their own board, and the first player to fill their whole
board shouts **¡Chalupa!** to win.

## Stack

- React + Vite (frontend)
- Supabase (Postgres + Realtime, as the multiplayer backend)

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates the `rooms` and `players` tables, permissive policies (no
   login required — anyone with a room code can play), and enables Realtime
   on both tables.
3. In **Project Settings → API**, copy your **Project URL** and **anon public key**.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run it

```bash
npm install
npm run dev
```

Open the printed URL, enter your name, and either **create a room** (you
become the caller) or **join a room** with the code someone shares with you.

## How a round works

- The caller clicks **Start calling**, then cards call themselves
  automatically every 6 seconds from a shuffled 54-card deck.
- Players tap cards directly on their own board to mark them — nothing on
  screen tells you which cards have actually been called, so you have to
  pay attention to the caller like in the real game.
- Once your board is fully marked, the **¡Chalupa!** button lights up. The
  server re-validates that every card on your board was really drawn before
  declaring you the winner. If you jumped the gun, the claim is rejected and
  any marks that weren't actually called get cleared automatically.
- After a round ends, the caller can hit **Play again** to reshuffle and deal
  fresh boards without leaving the room.

## Voice chat

Each room has an optional **Join voice** button that opens an audio call
scoped to that room, powered by [Daily.co](https://daily.co)'s free tier
(10,000 participant-minutes/month). Daily is built for third-party
embedding, so it stays inline in the sidebar instead of opening a new tab.

A separate Daily room is created per Chalupa game room, via a Supabase Edge
Function that holds the Daily API key server-side — the key never reaches
the browser. Setup:

1. Sign up free at [daily.co](https://dashboard.daily.co/signup) and grab
   an API key from **Developers** in the dashboard.
2. Install the Supabase CLI if you don't have it (`npm install -g supabase`
   or use `npx supabase` for one-off commands).
3. Log in and link this repo to your Supabase project:
   ```bash
   npx supabase login
   npx supabase link --project-ref oomksfvgrkrbjhngeigp
   ```
4. Store your Daily API key as a secret (never committed to the repo) and
   deploy the function:
   ```bash
   npx supabase secrets set DAILY_API_KEY=your-daily-api-key
   npx supabase functions deploy create-voice-room
   ```
5. That's it — the app calls this function automatically when someone clicks
   **Join voice**. Rooms expire and clean themselves up 6 hours after
   creation.

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds
and publishes the site automatically on every push to `main`.

1. In your repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions**, add two repository
   secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as
   your local `.env`). The anon key is meant to be public, but keeping it in
   secrets avoids hardcoding it into the repo.
3. Push to `main` — the workflow builds the app and deploys `dist/` to
   Pages. Your site will be live at
   `https://<your-username>.github.io/Blank-Seven/`.

The app uses a hash-based router (`/#/room/ABC12`) so refreshing a room URL
works correctly on Pages, which doesn't support arbitrary server-side route
rewriting.

## Notes / next steps

- Card art is emoji placeholders in [`src/cards.js`](src/cards.js) — swap in
  real illustrations whenever you want.
- The Supabase policies are intentionally open (no auth) to keep joining a
  room frictionless for a casual party game. Don't reuse this schema for
  anything that needs real access control.
- Deploy the frontend anywhere that serves a static Vite build (Vercel,
  Netlify, Cloudflare Pages, GitHub Pages, etc.) — just set the same two env
  vars in that host's dashboard.
