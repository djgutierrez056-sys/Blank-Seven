# Session log

Chronological record of what got built and what's still open. Update this as work continues.

## 2026-08-13 — Initial build and iteration

Built Chalupa (Lotería / Mexican Bingo) as a React + Vite frontend with Supabase (Postgres + Realtime) as the multiplayer backend, deployed to GitHub Pages.

**Shipped this session:**
- Core game: 54-card deck, random 16-card tablas, room create/join by code, caller auto-draws cards on a timer (now every 4s, was 6s), tap-to-mark board, server-verified ¡Chalupa! win claim.
- Pause/resume for the caller. Play again (reshuffles, fresh boards, keeps the room). **🔀 Change my board** lets any player reshuffle their own tabla before calling starts.
- Realtime text chat per room. Win leaderboard. Called-cards history panel. Live-sync indicator badge.
- **← Menu** button (top-left of room header) to return to the home screen.
- **Card-call narrator**: announces each called card out loud in Spanish. Went through several iterations — browser `SpeechSynthesis` (inconsistent per-device voices) → ElevenLabs pre-generated character voices (Daniel/Jessica/Bill/Callum/Lily-goth, 216 static `.mp3` clips, no runtime API calls) → restored the browser-voice option too ("Browser default", defaults to Google español when available) so both are selectable. Mute toggle (🔔) next to the picker.
- **Voice chat**: iterated through Jitsi (iframe → dark screen, anti-embed policy) → Daily.co (blocked, requires a card even on the free tier) → Jitsi again as a new-tab link (worked, but left the game UI) → landed on **LiveKit Cloud** (real WebRTC SFU, free tier, no card, embeds inline via `livekit-client`). Shows connected participants by name, not just a count.
- Real card illustrations: replaced emoji placeholders with OpenMoji SVGs (CC BY-SA 4.0), then sized them up ~40% across the board/caller-strip/history. Two later attempts to get closer to the authentic classic-card look (AI-generated recreation, then hunting for a clean scan of the real deck) both turned out to be dead ends — see `LEARNT.md`.
- **Room expiry**: rooms auto-delete after 24h of no activity (`pg_cron` + `last_active_at` triggers on `rooms`/`players`/`messages`).
- **Inactive-player cleanup**: players auto-removed after 1h of no activity (same pattern, caller exempt).
- Fixed a race condition where two players claiming ¡Chalupa! at the same moment crashed with a raw Postgres error instead of showing "someone already won" (`.single()` → `.maybeSingle()`, also applied to `drawNextCard`).
- GitHub Pages deploy workflow (`.github/workflows/deploy.yml`), hash-based routing, base path config.

**Repo / infra state:**
- Supabase project: `oomksfvgrkrbjhngeigp`. Schema lives in `supabase/schema.sql`. It's grown into several append-only blocks (room expiry, inactive-player cleanup) rather than a single flat schema — the file's header comments explain which parts are safe to re-run on an existing project vs. only for a fresh one. Two `pg_cron` jobs are live: `chalupa-room-expiry` (hourly) and `chalupa-inactive-player-cleanup` (every 15 min).
- GitHub Pages: live at `https://djgutierrez056-sys.github.io/Blank-Seven/` (repo itself later renamed/moved to `Blank-Seven` on GitHub's end — git remote still resolves via redirect).
- Supabase Edge Functions deployed: `livekit-token` (active, mints LiveKit access tokens), `create-voice-room` (Daily.co room creation — still deployed but **unused**, left over from the abandoned Daily.co path).
- LiveKit Cloud project configured with `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` set as Supabase Edge Function secrets.
- An ElevenLabs API key was used twice (once for the 4 main narrator voices, once for the goth voice) to batch-generate the 216 static `.mp3` clips under `public/audio/narrators/`. Not needed at runtime — only needed again if regenerating/adding voices.
- Several Supabase personal access tokens were generated for one-off CLI setup (secrets, function deploys) over the course of this session — each was meant to be revoked after use; worth double-checking none are still live in Account → Access Tokens.

## Pending / open items

- **Leaderboard needs a real test.** Wins only increment on a genuine, server-verified Chalupa claim — worth confirming a full round actually completes and increments correctly now that the claim race-condition bug is fixed.
- **Icon substitutes worth a sanity check:** "El Bandolón" (mandolin) uses a banjo icon, "El Violoncello" uses a violin icon, "El Arpa" (harp) uses a musical-score icon, "El Apache" uses a feather icon — none of these have exact Unicode/OpenMoji equivalents, so they're the closest reasonable substitutes rather than literal matches.
- **Docker not installed** in this environment — `supabase functions deploy` warned about it but deployed successfully anyway (Docker is only needed for local function serving/testing, not for deploying to Supabase's hosted runtime).
- **`create-voice-room` Edge Function is dead code.** Safe to delete along with its `DAILY_API_KEY` secret if the Daily.co path is never getting revisited.
- **Card art**: still OpenMoji, just bigger. If the "look more authentic" itch comes back, `LEARNT.md` has a concrete lead (the Posada 1910s public-domain lottery sheet) that only got partially explored — 11 of 54 subjects matched by name, the other ~43 would each need individual public-domain sourcing.
