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

Each room has an optional **Join voice** button that connects players to a
shared audio-only [LiveKit](https://livekit.io) room scoped to that game,
embedded directly in the game UI (no iframe, no new tab). LiveKit is a
self-served WebRTC SFU — LiveKit Cloud's free tier includes 5,000 WebRTC
minutes/month with **no credit card required**.

### Set up LiveKit

1. Create a free account at [cloud.livekit.io](https://cloud.livekit.io) (no
   payment method required).
2. Create a project. Note its **WebSocket URL** (`wss://your-project.livekit.cloud`)
   and generate an **API Key** + **API Secret** from **Settings → Keys**.
3. Add three secrets to your Supabase project (**Edge Functions → Secrets**,
   or via CLI: `supabase secrets set --project-ref your-project-ref
   LIVEKIT_URL=wss://your-project.livekit.cloud LIVEKIT_API_KEY=... LIVEKIT_API_SECRET=...`):
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
4. Deploy the Edge Function: `supabase functions deploy livekit-token
   --project-ref your-project-ref`. It mints a short-lived (4h) per-player
   access token; the API key/secret never reach the browser.

No client-side env vars are needed for voice — `VoiceChat.jsx` calls the
`livekit-token` function to get a token + room URL, then connects with the
`livekit-client` SDK and plays remote participants' audio directly.

### Why not Jitsi?

An earlier version tried embedding plain `meet.jit.si`, which actively
restricts iframe embedding from third-party domains (anti-abuse policy) —
the call got stuck on a dark screen and never actually connected, so no
audio flowed even though the frame "loaded" (see `LEARNT.md`). A working
interim fix opened Jitsi in a new tab instead of embedding it, which
avoided the restriction but meant leaving the game UI to talk. LiveKit
replaces that: it's a real SFU you control access to via signed tokens,
so it embeds inline and doesn't hit an anti-abuse wall.

(An even earlier version used Daily.co with a Supabase Edge Function for
per-room isolation, but Daily now requires a payment method on file even
for its free tier, so that was dropped. The Edge Function code is still in
`supabase/functions/create-voice-room` if you want to revisit that path —
you'd need to redeploy `VoiceChat.jsx` to call it again and add a card to
your Daily account.)

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
