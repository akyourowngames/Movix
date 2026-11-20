# Open Questions and Blocked Work

## BLOCKED — Next.js critical dependency migration

- Installed: `next@14.2.35`, `eslint-config-next@14.2.35`, `react@18.3.1`, `react-dom@18.3.1`, `@types/react@18`, `@types/react-dom@18`.
- Audit finding: current Next.js 14.2.35 is in affected range for critical and high Next.js advisories. npm's `audit fix --force` resolves `next@16.4.6` and `eslint-config-next@16.4.6`, which is a direct major jump and should not be applied blindly.
- Current npm audit fix target: `next@16.4.6` and matching `eslint-config-next@16.4.6`. The current production audit groups include 1 critical Next.js and 2 high groups (nested PostCSS and picomatch); do not treat `next@15.5.29` as safe because the current advisory range still includes it. Registry metadata reports Next 16.4.6 supports Node >=20.9.0 and peers with React 18.2+ or React 19; matching eslint-config-next requires ESLint >=9.
- Concrete migration plan:
  1. Confirm production Node runtime and Vercel build/install settings (the local environment uses Node 24.16.0; Supabase JS 2.119.0 has Node `>=22`, but deployment runtime has not been confirmed).
  2. Create a clean migration branch/worktree from the committed base when the pre-existing user-owned changes have been preserved or committed by their owner.
  3. Upgrade Next and eslint-config-next to 16.4.6 together; upgrade ESLint 8 to 9 and replace the removed `next lint` script with a direct ESLint invocation/config compatible with ESLint 9.
  4. Audit Next 16 App Router/request APIs, caching, metadata, middleware, images, fonts and build output; keep React 18 only if actual peers and app behavior remain compatible.
  5. Validate Supabase SSR/client and auth callback/cookies, login/signup, all routes, lint, TypeScript, production build, preview deployment and production audit.
- Keep BLOCKED with score 15 until (a) deployed Vercel Node/build settings are confirmed by the project owner/dashboard and (b) user-owned dirty `main` changes are safely preserved in an isolated migration worktree. Local Node 24.16.0 alone does not prove deployment compatibility. Never force-install.

## Routine next steps — no user decision required

- Completed: `shadcn` CLI moved to `devDependencies`; its `proxy-addr` vulnerability is now dev-only, and production audit reduced from 26 to 6 findings.
- Completed: root PostCSS dependency patched to 8.5.33. Nested Next.js PostCSS 8.4.31 remains until framework upgrade.
- Next 14 nested PostCSS 8.4.31 remains until the framework migration. Root PostCSS 8.5.33 is already patched.

## Product and environment questions

- Is an edge-level rate limiter configured at Vercel for the public API routes? No application-level rate limiting was found in the source audit.
- Which analytics and error-tracking products, if any, are configured in production?
- A light theme token set does not exist; current browser comparisons cover dark only.
- Lighthouse is not installed; browser screenshot/axe was performed with local Chromium and axe-core instead.

## Remaining verification limits

- `FINDINGS/2026-11-20-browser-security.md` records live responsive and axe measurements. Image/gradient contrast remains incomplete; axe zero-violation summaries are not full WCAG AA certification.
- HLS actual media playback/keyboard, captions, seek/volume/fullscreen behavior are not verified against a controlled legitimate stream fixture.
- Supabase authenticated account switching, sign-out failure and partial cloud-migration failure need controlled fixtures; current multi-table cloud migration has no transaction guarantee.
- Catalog/search/season all-provider and partial-provider failure behavior need injected provider fixtures. Healthy smoke tests do not verify outage semantics.
- Home was width-tested only at 320 and 1440; Signup has no separate axe count. OS 200% text zoom and Lighthouse were not run.
- No application-side rate limiter was identified; confirm Vercel edge protections with the project owner before changing rate-limiting behavior.
- Rendered contrast remains open for hero backdrop gradients and shimmer text, MovieCard poster composites when artwork is visible, HLS player black-video/control gradients, keyboard-focus/hover/disabled states, and the signed-in Navbar menu's failure message over translucent glass. Fixed-surface calculations in the current findings report do not prove these varying backgrounds.
- Browser axe evidence during the latest continuation was discarded because the existing Home target returned an incomplete document lacking the app shell/title/lang, inconsistent with `src/app/layout.tsx`; this is treated as a stale/blank CDP target, not a source regression. No clean axe result was captured after this contrast pass.
- No controlled HLS media fixture or local test runner (Vitest/Jest/Testing Library/JSDOM/Happy DOM) is installed. Actual native-HLS and hls.js playback, captions, seek, focus, settings, fullscreen and source retry remain unverified. External iframe content is cross-origin and was not inspected or tested for keyboard/captions/accessibility.
- Latest HLS source recovery now makes one automatic retry attempt for fatal network errors and one media-element recovery attempt for fatal media errors; further fatal errors settle in the user-visible error state. This is defensive source behavior only; no controlled network/media failure was injected into a real player session.
- RUN 7 auth/cloud code now rejects a captured cloud user if Supabase `getUser()` or the in-memory cloud owner no longer matches, and rejects cloud reads before returning stale data. Existing migration defines owner-only RLS on all user library tables. Still no live authenticated account-switch, sign-out failure or partial migration failure injection; client guards are defense-in-depth and do not replace server-side RLS.
- RUN 7 production build had one trace-collection `ENOENT` for `.next/server/pages/_app.js.nft.json` while Next `start` server PID 21288 was concurrently reading the shared `.next` directory. The command later emitted a complete 15-route table, but the recorded exit status was inconsistent. TypeScript/lint passed; repeat a build only after safely isolating the output directory or stopping the app server with explicit owner consent. Do not kill the existing user server in this session.
- RUN 7 fixed a retry-state bug: user Retry now resets the one-attempt network/media recovery budgets. HLS settings/seek/volume keyboard focus behavior received source-level improvements. `VideoPlayer` iframe `load` is explicitly provider-document load only. No controlled stream or provider runtime was available, so HLS/iframe playback and provider-side captions/keyboard remain unverified.

- **HTTP 404 status for streamed detail routes � OPEN (verified reproduction):** eight invalid/nonexistent Movie/TV/Genre URLs return HTTP 200 even though the HTML stream contains `NEXT_NOT_FOUND` and `noindex`. Installed Next.js 14.2.35 catches the sentinel and sets status 404, but dynamic HTML may already have committed headers before the detail fetch resolves. Route-level loading boundaries are present and must retain useful loading UX. No supported per-route disable-streaming option was established. Next step: evaluate a route architecture where primary existence is resolved before returning the streamed page (without duplicate TMDB requests or cross-request caches), or an appropriately tested framework migration. Keep provider 5xx/network errors in retry/error boundaries, not 404. Required evidence: invalid IDs, provider 404, provider 5xx/timeout, valid detail metadata/navigation, loading transitions, direct HTML and RSC client navigation status semantics.

- RUN 9 UI visual verification is pending: source, TypeScript and lint checks pass, but no clean CDP page target/browser screenshot/axe responsive retest was available. Reuse existing seven-width evidence for unchanged routes, but recheck Home/Login/Signup and materially changed Navbar/cards/Browse/Search/Profile at 320, 375, 414, 768, 1024, 1440 and 1920 CSS px when browser target is available; inspect actual screenshots and 200% zoom.
- Auth visual changes preserve existing auth calls and redirect protections, but successful login/signup, password visibility interaction, mobile layout, keyboard flow, contrast and provider confirmation were not runtime tested in this continuation.
- New skeletons were source/type/lint checked; loading transitions and CLS are unmeasured. New `HeroSkeleton` is available but no route currently uses it because the home route fetches its server feed before rendering; wire it only if an actual streaming/loading boundary is introduced without regressing page response semantics.
- Recommendation failure caching fix is source verified; injected provider outage and live HTTP 503/Cache-Control response were not exercised in this run.
