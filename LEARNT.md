# Learnt

Technical lessons and gotchas discovered while building Chalupa. Kept here so future work doesn't rediscover them the hard way.

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

Fix applied: stopped embedding it. `VoiceChat.jsx` now just links to `https://meet.jit.si/<room>` with `target="_blank"`, opening it in its own tab — not subject to the iframe anti-abuse restriction, so it actually connects. Tradeoff: voice no longer lives inside the game UI.

An inline embed is still possible via **JaaS (8x8.vc)**, Jitsi's own hosted embedding product — embeds are authenticated with a signed JWT, which isn't subject to the anonymous-embed restriction. Not implemented (needs a JaaS account + a Supabase Edge Function to mint tokens server-side); revisit if the new-tab UX becomes a real problem.

## "Free tier" services often still require a card on file

Daily.co's free tier (10,000 participant-minutes/month) required a payment method before the API would even create a room — the free allowance exists, but the anti-abuse gate is a card, not usage. Worth checking upfront before building integration around a service's free tier.

## Supabase CLI needs `--token` in non-interactive environments

`supabase login`'s normal flow opens a browser for OAuth, which fails in a non-TTY shell (`Cannot use automatic login flow inside non-TTY environments`). The workaround is generating a personal access token from the Supabase dashboard and passing `--token <token>` directly. Note: that token can manage *all* of the account's projects, not just one — worth revoking after one-off setup tasks.

## GitHub Pages needs both a base path and hash routing

A Vite React SPA deployed to a GitHub Pages *project* site (not a custom domain) needs `base: '/<repo-name>/'` in `vite.config.js` so asset URLs resolve correctly, and a `HashRouter` instead of `BrowserRouter` since Pages can't do arbitrary server-side rewrites for client-side routes — a full page refresh on `/room/ABC12` would 404 otherwise.

## Public-domain art still has a trademark angle

The 1913 Don Clemente Lotería card illustrations are old enough to be copyright-public-domain in the US, but "Don Clemente" is still an active, trademarked commercial product line. Scraping/reproducing their exact card scans for a public site sits in a gray area even though the underlying images are copyright-free. Went with OpenMoji (CC BY-SA 4.0, unrelated to the Lotería brand) instead — same visual upgrade over plain emoji, no trademark question.
