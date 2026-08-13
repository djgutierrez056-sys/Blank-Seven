# Learnt

Technical lessons and gotchas discovered while building Chalupa. Kept here so future work doesn't rediscover them the hard way.

## Pre-generate TTS instead of calling it live, when the text is a fixed set

The card-call narrator started as the browser's Web Speech API (`SpeechSynthesis`), which only offers whatever voices happen to be installed on each player's own device — inconsistent, and not "different people's voices" so much as different languages/accents of whatever the OS ships. Real character voices meant a cloud TTS provider (ElevenLabs — free tier, no card, see the room README's "Voice chat" section for the pattern used to find that out for LiveKit too). The naive approach would call the API live every time a card is called, once per client — for an 8-player room that's 8x the API usage for the same announcement, and would burn through a free-tier quota fast.

Instead: since the announcement text is always one of the same 54 fixed Spanish card names, every clip was generated **once**, per narrator persona, as a batch job, and committed as static `.mp3` files under `public/audio/narrators/<slug>/<card-id>.mp3`. The deployed game just plays the right static file — zero TTS API calls happen during actual gameplay, so there's no runtime dependency on ElevenLabs at all, no key in the browser, and no risk of hitting rate limits mid-game. Total one-time cost for 4 voices × 54 cards was a few thousand characters, well under the free tier's ~10,000 credit/month allowance. Regenerating (new voice, edited card list) means re-running the batch script with a fresh API key — not something the deployed app ever needs to do itself.

## ElevenLabs free tier can't use community/shared voices via the API at all

Wanted a "goth girl" narrator persona. ElevenLabs' community voice library (`/v1/shared-voices`) has plenty of well-matched options — "Vivien - Mysterious Witch", "Lilith - Sensual and Scary", etc. — and some are even flagged `free_users_allowed: true` in the search response. That flag is misleading: calling `/v1/text-to-speech/{voice_id}` on any shared-library voice from a free account returns `402 payment_required` / `"Free users cannot use library voices via the API"`, regardless of that flag. Free tier is restricted to the ~21 voices in the account's own default premade library (the same ones used for the other narrators). Worked around it by picking the closest-fitting premade voice ("Lily - Velvety Actress") and pushing `voice_settings` (`stability: 0.3`, `style: 0.75`) for a moodier, more dramatic delivery instead of getting the exact character voice.

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

Same pattern reused for per-player cleanup: a `last_active_at` column on `players`, bumped by a `before update` trigger, with its own `pg_cron` job (every 15 min, tighter than the 1h window) deleting players inactive over an hour. The **caller is exempt** from this one specifically — cards auto-advance via the `rooms` table during a round, not the caller's own `players` row, so a caller who's quietly hosting without clicking anything would otherwise look inactive and get wrongly kicked mid-game.

## `.single()` throws instead of returning null on zero rows

`claimChalupa`'s optimistic-concurrency update (`.eq('status', 'playing')` guarding against two players claiming at once) correctly matches 0 rows for whoever loses the race — but `.select().single()` doesn't return `null` for that, it throws `PGRST116` ("Cannot coerce the result to a single JSON object"). The existing `if (!nextRoom) throw new Error('Someone already won this round.')` fallback never ran because `roomError` was already set to the raw Postgres error first. Fix: `.maybeSingle()` instead of `.single()` — returns `null` on zero rows with no error, which is what the surrounding code already expected. `drawNextCard` has the same optimistic-concurrency shape (`.eq('draw_index', room.draw_index)`) and got the same fix, falling back to returning the caller's stale `room` object on a lost race (harmless — Realtime delivers the real state moments later) instead of crashing.

## Sourcing real Lotería card art turned out to be a dead end, twice

Tried getting closer to the authentic Don Clemente look after OpenMoji felt too generic. Two different attempts both failed for different reasons, worth remembering before trying again:

- **An AI-generated "recreation" of the classic deck is not a safe alternative to the real thing.** A Gemini-generated sheet mimicking the exact Don Clemente visual identity (same per-card background-color convention, same character poses like the rooster's stance) is arguably a more obvious derivative work than a straight photo would be — "AI generated" doesn't launder trademark/copyright risk. It was also internally inconsistent (duplicate card numbers, duplicate names, wrong labels), so unusable as data even ignoring the legal question.
- **A clean, complete, redistributable scan of the real 54-card deck doesn't seem to exist anywhere accessible.** The only full-deck photo found (Wikipedia/Commons "Loteria boards.jpg") is shot at an angle — perspective-distorted, overlapping boards, ~24 of 54 cards not visible at all. Etsy/Amazon listings with better photography load images dynamically via JS (can't be scraped by a simple fetch) or are paid downloads carrying their own personal-use-only license on top of the underlying trademark question. Wikimedia Commons has no individual card uploads, unsurprising since Commons requires freely-licensed content and this material doesn't qualify.

Landed back on OpenMoji (just sized up ~40% across the board/caller-strip/history) rather than spend more effort chasing either path. If this gets revisited: an independent public-domain source depicting the same *subjects* (not the same card compositions) is the only route that's both authentic-feeling and actually safe — see the José Guadalupe Posada 1910s lottery sheet on loc.gov (item 99615953, "no known restrictions") as one real example; it only covers ~11 of the 54 subjects by name match, so it'd need combining with other individually-verified public-domain sources for full coverage.
