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

Each room has an optional **Join voice** button that opens an audio-only
[Jitsi Meet](https://meet.jit.si) session for that room **in a new browser
tab**, rather than embedded inline. It's a free, public third-party
service — no signup, no API key, no payment method required.

It opens in a new tab rather than embedding because `meet.jit.si` actively
restricts iframe embedding from third-party domains (anti-abuse policy) —
an embedded call gets stuck on a dark screen with just the logo and never
actually connects, so no audio flows even though the frame "loads" (see
`LEARNT.md`). Opening the room directly isn't subject to that restriction
and reliably connects. The tradeoff is players have to switch tabs to talk
instead of it living in the game UI.

(There's a path back to an inline embed via **JaaS**, Jitsi's own hosted
embedding product, which authenticates embeds with a signed JWT and isn't
subject to the anti-abuse restriction — but it requires a JaaS account and
a Supabase Edge Function to mint tokens server-side, more setup than the
new-tab approach. An earlier version also used Daily.co with a Supabase
Edge Function for per-room isolation, but Daily now requires a payment
method on file even for its free tier, so that was dropped too. The Edge
Function code is still in `supabase/functions/create-voice-room` if you
want to revisit that path — you'd need to redeploy `VoiceChat.jsx` to call
it again and add a card to your Daily account.)

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

- Card illustrations are [OpenMoji](https://openmoji.org) (CC BY-SA 4.0),
  mapped per card in [`src/cards.js`](src/cards.js) and loaded from
  jsdelivr's CDN. Attribution: "Icons by OpenMoji — the open-source emoji
  and icon project. License: CC BY-SA 4.0". The classic Don Clemente
  Lotería card art wasn't used here — see the git history/PR discussion
  around this feature for the trademark reasoning.
- The Supabase policies are intentionally open (no auth) to keep joining a
  room frictionless for a casual party game. Don't reuse this schema for
  anything that needs real access control.
- Deploy the frontend anywhere that serves a static Vite build (Vercel,
  Netlify, Cloudflare Pages, GitHub Pages, etc.) — just set the same two env
  vars in that host's dashboard.
