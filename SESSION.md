# Session log

Chronological record of what got built and what's still open. Update this as work continues.

## 2026-08-13 — Initial build and iteration

Built Chalupa (Lotería / Mexican Bingo) as a React + Vite frontend with Supabase (Postgres + Realtime) as the multiplayer backend, deployed to GitHub Pages.

**Shipped this session:**
- Core game: 54-card deck, random 16-card tablas, room create/join by code, caller auto-draws cards on a timer, tap-to-mark board, server-verified ¡Chalupa! win claim.
- Pause/resume for the caller.
- Play again (reshuffles, fresh boards, keeps the room).
- Realtime text chat per room.
- Win leaderboard (`players.wins`, incremented server-side on a verified claim).
- Called-cards history panel.
- Live-sync indicator badge in the header.
- Voice chat: tried Jitsi (JS API embed → dark screen, likely anti-embed policy), then Daily.co with a Supabase Edge Function for per-room isolation (blocked by Daily requiring a card on file), landed back on a plain Jitsi `<iframe allow="microphone">` embed.
- Real card illustrations: replaced emoji placeholders with OpenMoji SVGs (CC BY-SA 4.0), mapped and verified per card, avoiding the Don Clemente trademark question.
- GitHub Pages deploy workflow (`.github/workflows/deploy.yml`), hash-based routing, base path config.

**Repo / infra state:**
- Supabase project: `oomksfvgrkrbjhngeigp`. Schema lives in `supabase/schema.sql` — note it reflects the *current* schema, but several columns (`paused`, `wins`) were added via manual `alter table` statements run directly in the SQL editor rather than as separate migration files. If this project is ever rebuilt from scratch, running `schema.sql` fresh should be sufficient since it's kept up to date, but there's no formal migration history.
- GitHub Pages: live at `https://djgutierrez056-sys.github.io/Blank-Seven/`.
- Supabase Edge Function `create-voice-room` (Daily.co room creation) is deployed and has a working `DAILY_API_KEY` secret set, but is currently **unused** by the frontend since voice chat reverted to Jitsi. Left in place in case Daily gets revisited.

## Pending / open items

- **Voice chat not fully confirmed working.** The current Jitsi iframe version (with `allow="microphone"`) was pushed but not yet verified end-to-end by the user actually joining a call. If it's still broken, the next fallback discussed was a Discord voice channel link (simplest, zero infra) or revisiting Daily.co if a card gets added to that account.
- **Leaderboard needs a real test.** Wins only increment on a genuine, server-verified Chalupa claim made *after* the `wins` column existed — as of last check, no completed round had happened since that migration, so all players still show 0 wins.
- **Icon substitutes worth a sanity check:** "El Bandolón" (mandolin) uses a banjo icon, "El Violoncello" uses a violin icon, "El Arpa" (harp) uses a musical-score icon, "El Apache" uses a feather icon — none of these have exact Unicode/OpenMoji equivalents, so they're the closest reasonable substitutes rather than literal matches.
- **Supabase personal access token.** A token was generated to run one-off CLI setup (login, link, secrets, deploy) — should be revoked from the Supabase dashboard (Account → Access Tokens) since it grants account-wide project access and isn't needed for day-to-day use.
- **Docker not installed** in this environment — `supabase functions deploy` warned about it but deployed successfully anyway (Docker is only needed for local function serving/testing, not for deploying to Supabase's hosted runtime).
