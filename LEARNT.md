# Learnt

Technical lessons and gotchas discovered while building Chalupa. Kept here so future work doesn't rediscover them the hard way.

## Pre-generate TTS instead of calling it live, when the text is a fixed set

The card-call narrator started as the browser's Web Speech API (`SpeechSynthesis`), which only offers whatever voices happen to be installed on each player's own device — inconsistent, and not "different people's voices" so much as different languages/accents of whatever the OS ships. Real character voices meant a cloud TTS provider (ElevenLabs — free tier, no card, see the room README's "Voice chat" section for the pattern used to find that out for LiveKit too). The naive approach would call the API live every time a card is called, once per client — for an 8-player room that's 8x the API usage for the same announcement, and would burn through a free-tier quota fast.

Instead: since the announcement text is always one of the same 54 fixed Spanish card names, every clip was generated **once**, per narrator persona, as a batch job, and committed as static `.mp3` files under `public/audio/narrators/<slug>/<card-id>.mp3`. The deployed game just plays the right static file — zero TTS API calls happen during actual gameplay, so there's no runtime dependency on ElevenLabs at all, no key in the browser, and no risk of hitting rate limits mid-game. Total one-time cost for 4 voices × 54 cards was a few thousand characters, well under the free tier's ~10,000 credit/month allowance. Regenerating (new voice, edited card list) means re-running the batch script with a fresh API key — not something the deployed app ever needs to do itself.

## Windows filesystem is case-insensitive

`Room.jsx` and `room.js` collided at build time — Vite/Rolldown resolved imports to the wrong file because Windows treats them as the same path. Renamed the API module to `roomApi.js`. Lesson: never name a file the same as another differing only by case, even across extensions, on this platform.

## Flexbox children default to `min-height: auto`

The chat and called-cards panels kept growing taller instead of scrolling internally, even with `max-height` and `overflow-y: auto` set on the scrollable child. Root cause: a flex child's default `min-height: auto` lets it refuse to shrink below its content size, so it overflows the parent instead of activating the scrollbar. Fix: `min-height: 0` on the scrolling flex child, plus `overflow: hidden` on the fixed-height parent.

## Don't reuse one error state for fatal vs. inline errors

Early on, a single `error` state powered both "the whole room failed to load" (an early `return <ErrorScreen/>`) and "your Chalupa claim was rejected" (meant to show inline without interrupting play). Since both code paths wrote to the same state, a rejected claim replaced the entire game screen. Split into `loadError` (screen-blocking) and `actionError` (inline, dismissible).

## Client-side game state needs server-side verification

Players can mark cards on their board that haven't actually been called (either by mistake or by cheating). The win claim (`claimChalupa`) re-checks server-side that every card on the tabla is actually in the drawn deck before declaring a winner — never trust the client's "I've won" signal at face value.

## Iframe embeds need explicit mic permission delegation

A cross-origin iframe can't access `getUserMedia` (camera/mic) unless the parent page's Permissions Policy explicitly delegates it via the `allow="microphone"` attribute on the `<iframe>` tag. Missing this is a likely cause of an embedded video-call widget silently getting stuck (dark screen, no visible error) rather than failing loudly.

## Jitsi's public server actively restricts iframe embedding

`meet.jit.si`'s script-driven External API embed (`JitsiMeetExternalAPI`) got stuck on a dark screen with just the logo when embedded from an external domain — likely Jitsi's anti-abuse policy for third-party embeds, separate from the mic-permission issue above. A plain declarative `<iframe src="https://meet.jit.si/...">` also got stuck the same way (confirmed: dark screen, just the logo, no toolbar) — the restriction applies to both embedding methods, not just the scripted one. This is why "no one can hear me" happened even though the mic-permission and `allow=` attribute setup was correct: the call never actually connected, so there was nothing to hear regardless of mic state.

Interim fix: stopped embedding it. `VoiceChat.jsx` briefly just linked to `https://meet.jit.si/<room>` with `target="_blank"`, opening it in its own tab — not subject to the iframe anti-abuse restriction, so it actually connected. Tradeoff: voice didn't live inside the game UI.

Final fix: switched providers entirely to **LiveKit Cloud** — a real WebRTC SFU you connect to directly with the `livekit-client` SDK (no iframe involved at all, so the embed-restriction problem doesn't apply). Access tokens are minted server-side by `supabase/functions/livekit-token` using `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` secrets; the secret never reaches the browser. LiveKit Cloud's free tier (5,000 WebRTC minutes/month) requires no credit card, unlike Daily.co. See the "Voice chat" section in `README.md` for setup.

## "Free tier" services often still require a card on file

Daily.co's free tier (10,000 participant-minutes/month) required a payment method before the API would even create a room — the free allowance exists, but the anti-abuse gate is a card, not usage. Worth checking upfront before building integration around a service's free tier.

## Supabase CLI needs `--token` in non-interactive environments

`supabase login`'s normal flow opens a browser for OAuth, which fails in a non-TTY shell (`Cannot use automatic login flow inside non-TTY environments`). The workaround is generating a personal access token from the Supabase dashboard. Note: on CLI v2.114.0, `supabase functions deploy --token <token>` was rejected as an unrecognized flag — the working form is setting the `SUPABASE_ACCESS_TOKEN` environment variable instead (`SUPABASE_ACCESS_TOKEN=<token> supabase functions deploy ...`). That token can manage *all* of the account's projects, not just one — worth revoking after one-off setup tasks.

## GitHub Pages needs both a base path and hash routing

A Vite React SPA deployed to a GitHub Pages *project* site (not a custom domain) needs `base: '/<repo-name>/'` in `vite.config.js` so asset URLs resolve correctly, and a `HashRouter` instead of `BrowserRouter` since Pages can't do arbitrary server-side rewrites for client-side routes — a full page refresh on `/room/ABC12` would 404 otherwise.

## Public-domain art still has a trademark angle

The 1913 Don Clemente Lotería card illustrations are old enough to be copyright-public-domain in the US, but "Don Clemente" is still an active, trademarked commercial product line. Scraping/reproducing their exact card scans for a public site sits in a gray area even though the underlying images are copyright-free. Went with OpenMoji (CC BY-SA 4.0, unrelated to the Lotería brand) instead — same visual upgrade over plain emoji, no trademark question.

## Room expiry belongs in the database, not the client

Rooms live forever by default since nothing ever deletes a `rooms` row — no TTL, no cleanup. There's no long-running server process to worry about here (Supabase Realtime and LiveKit don't cost anything for an idle/empty room), but the Postgres rows themselves accumulate indefinitely. Handled it entirely server-side: a `last_active_at` column on `rooms`, kept fresh by triggers that fire on any `rooms` update or any `players`/`messages` insert/update for that room (so calling a card, marking a board, joining, and chatting all count as activity), plus an hourly `pg_cron` job that deletes rooms whose `last_active_at` is over 24h old. Doing it via triggers instead of updating `last_active_at` from the client on every action means it can't drift out of sync with whatever mutations get added later — any new write to `rooms`/`players`/`messages` is automatically "activity" with no extra code. `pg_cron` needs enabling once via **Database → Extensions** in the Supabase dashboard.
