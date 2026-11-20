# Completed Iterations

## 2026-11-19 — RUN 1: public API input hardening

- Focus: Validate untrusted search and season query parameters and safely encode provider search URLs.
- Files changed: `src/lib/tmdb.ts`, `src/app/api/search/route.ts`, `src/app/api/season/route.ts`.
- Effect: Search provider queries use `URLSearchParams`; search input is capped at 100 characters; season requests require a numeric TV ID of 1–9 digits and an integer season from 0 through 500; invalid requests receive a no-store 400 response.
- Score: 10 (impact 4 × confidence 5 ÷ effort 2).
- Verification: TypeScript, focused ESLint, production build and all 15 generated routes passed.
- Browser metrics/screenshots: not collected.
- Commit/PR: none; extensive unrelated pre-existing user changes were present.

## 2026-11-19 — RUN 2: mobile search and filter experience

- Focus: Replace the fixed-width always-open filter sidebar with a responsive desktop rail and mobile modal bottom sheet.
- Score: 9 (impact 3 × confidence 5 ÷ effort 1.7; impact includes +3 for mobile core-flow usability).
- Files changed: `src/app/search/page.tsx`.
- Changes: one shared filter-control fragment drives desktop and mobile; mobile filters open from a 44px trigger; sheet is max 85dvh with internal scrolling and safe-area padding; sticky Reset/Show Results actions; Escape closes; Tab is trapped; focus moves into the sheet and returns to its trigger; body scroll locks while open; reduced-motion duration is zero; focus-visible states and semantic status announcements are present; query input capped at the server's 100-character limit.
- Before/after: before, `w-72 flex-shrink-0` inside a permanent horizontal flex layout squeezed results at mobile widths. After, grid switches to a bottom sheet below 1024px and a desktop sidebar from 1024px. Browser measured no horizontal overflow at 320, 375, 414, 768, 1024, 1440 and 1920 CSS px.
- Browser verification: production Chromium; mobile sheet open/close, scroll lock, Escape, Tab trap, focus restore, 320px viewport, 2× device scale, seven breakpoints. No runtime console exceptions in the fresh Chromium target.
- Accessibility: axe-core scoped to the open sheet: 0 violations, 23 passing rule groups, one incomplete duplicate-ID review. Whole-page axe earlier found missing H1 and four unnamed links outside the sheet; logged separately.
- Visual/performance: /search first-load JS 142 kB before → 144 kB after (+2 kB, +1.4%); no new dependency. Site is currently dark-only, so light-mode comparison is unavailable. Lighthouse runner was not installed/available.
- Verification: `npx tsc --noEmit` PASS; `npx eslint src/app/search/page.tsx` PASS; `npm run build` PASS (15 routes); `git diff --check` PASS. No existing test script or Playwright/Puppeteer runner exists.
- Screenshots: no persisted screenshot artifact; machine-readable browser evidence is under `.qoder/run2-browser-final.json` (local diagnostic file, untracked).
- Commit/PR: none; branch remains `main` with pre-existing unrelated dirty files. Avoided staging or committing user changes.
- Known external blocker: framework dependency advisories remain unresolved; see `OPEN_QUESTIONS.md` and `FINDINGS/2026-11-19-run-2.md`.

## 2026-11-19 — Follow-on dependency classification cleanup

- Focus: remove a development-only CLI dependency from the production install graph.
- Score: 12 (impact 4 × confidence 5 ÷ effort 1.7).
- Files changed: `package.json`, `package-lock.json`.
- Change: moved `shadcn@4.0.0` from `dependencies` to `devDependencies`; retained the CLI and lockfile dependency tree for component-generation workflows.
- Security effect: `proxy-addr@2.0.7` and the CLI's Hono/Express/MCP subtree are now marked development-only. `npm audit --omit=dev` fell from 26 (2 critical, 15 high, 8 moderate, 1 low) to 6 (1 critical, 4 high, 1 moderate): 20 fewer production audit finding records and one fewer critical. Remaining critical is `next@14.2.35`.
- Verification: package-lock-only install completed; lockfile confirms `shadcn` and `proxy-addr` have `dev: true`; `npx tsc --noEmit`, `npm run lint`, `npm run build` (15 pages), and `git diff --check` passed.
- No app code or runtime feature changed. Full audit still includes dev-only findings; no attempt was made to patch unrelated dev tools in this small follow-on.
- Commit/PR: none; preserved pre-existing user-owned dirty tree.

## 2026-11-19 — Follow-on compatible PostCSS patch

- Focus: update the direct build-tool PostCSS package to the patched current 8.5.x release.
- Files changed: `package.json`, `package-lock.json`.
- Change: `postcss` range updated from `^8` to `^8.5.33`; package lock regenerated with `npm install --package-lock-only --ignore-scripts`. Installed root is 8.5.33; Node engine requirement (`^10 || ^12 || >=14`) is compatible with project tooling.
- Security effect: root PostCSS advisories resolved. Next.js still pins a nested `postcss@8.4.31` copy and retains an outstanding advisory.
- Production audit progression: 26 findings (2 critical) before `shadcn` classification cleanup → 6 (1 critical) after CLI is dev-only → 4 (1 critical) after root PostCSS patch. Remaining: Next.js critical, nested PostCSS high, picomatch high, postcss-selector-parser moderate.
- Verification: typecheck PASS; lint PASS; production build generated all 15 routes and build command section exited 0; `git diff --check` PASS. Audit command exits 1 because remaining advisories are unresolved.
- No app runtime behavior changed. Commit/PR not created because existing branch contains unrelated user changes.

## 2026-11-19 — Season selector accessibility implementation (verification partially blocked)

- Focus: custom season dropdown keyboard and assistive-technology semantics, plus episode selector expanded state.
- Score: 8 (impact 4 × confidence 4 ÷ effort 2).
- Files changed: `src/app/tv/[id]/SeasonSelector.tsx`.
- Changes: season trigger now has `aria-haspopup=listbox`, `aria-expanded`, `aria-controls`; dropdown uses labelled `role=listbox` and season options expose `role=option` and `aria-selected`; focus moves to the selected season on open; ArrowUp/ArrowDown, Home/End, typeahead, Enter/Space selection, Escape dismissal and focus return; outside pointer closes; Tab closes without trapping normal document tab order; empty season lists disable the trigger. Dropdown animation respects reduced motion, scroll is bounded by viewport, options use 48px minimum rows and visible focus. Episode toggle now exposes expanded/controls state; episode panel has a label and `aria-busy`; both controls have focus-visible rings.
- Existing URL/cloud resume, episode fetch/caching, selected season/episode, and VideoPlayer props were left unchanged.
- Verification: `npx tsc --noEmit` PASS; focused ESLint PASS; `git diff --check` PASS; `npm run build` PASS, all 15 routes generated; `/tv/[id]` first-load JS 221 kB → 222 kB (+1 kB).
- Browser/axe: NOT RUN for the selector. A TV detail page could not be loaded in the local test environment (no local server was running, and `.env.example` has placeholder TMDB credentials). No interaction or axe result is claimed for this component.
- Commit/PR: none; preserved existing dirty `main` worktree.

## 2026-11-20 — RUN 3 and RUN 4 implementation follow-ons

- Full implementation detail and verification history: `FINDINGS/2026-11-19-run-3.md` and `FINDINGS/2026-11-20-browser-security.md`. These reports preserve the detailed run chronology; this summary records final cluster status.
- Auth/profile/cloud lifecycle: request-generation and identity guards, profile ownership checks, checked reads/upserts, sign-out failure handling, account-scoped library state, retryable profile/library/cloud-sync errors, and keyboard-operable ARIA tabs implemented. Guest profile real keyboard behavior and seven-width layout were verified; authenticated Supabase fault injection and partial cross-table migration atomicity remain unverified/unsupported (no transaction/RPC).
- Auth redirects/forms: same-origin local `next` validation, callback redirect hardening, exception-safe sign-in/up, generic errors and retry, and accessible 44px navigation/submit controls implemented. Malicious redirect matrix was script checked; successful provider code exchange and live credentials were not tested.
- Browse/Search/Home/cards: shared contrast token raised to 72% neutral foreground on flat surfaces; Browse sticky sizing/scroll and category semantics; Hero reduced-motion and visibility-aware autoplay; MovieCard sibling interactive controls; carousel reduced-motion scrolling; missing metadata/poster and retry states hardened. Live Home reduced-motion, Search/Browse width, axe and card interaction evidence is in run reports.
- Movie/TV/Genre/API: detail grid/cast scroller containment; missing/invalid metadata fallbacks; route-local loading/error boundaries; TMDB failure distinguished from genuine empty/not-found where source supports it; catalog/search/season routes preserve partial success and return 503/no-store on total provider failure; healthy API smoke passed. Forced outage and malformed provider fixture tests remain open.
- HLS source accessibility: keyboard commands scoped to the player rather than global window, focusable named seek range, volume label, control labels/state/focus rings and >=44px targets, error/retry announcement and reduced-motion transitions. No actual media fixture was available, so live playback and keyboard interaction remain IN_PROGRESS rather than closed.
- HLS native source lifecycle follow-on: native `loadedmetadata`/`error` listeners now have effect-scoped cleanup; native media source is paused/removed/reloaded on teardown; native Retry resets time and reassigns/reloads the HLS source. Per-source playback state resets on `src` changes. Rejected `play()` and fullscreen promises are handled so browser permission/policy failures do not become unhandled rejections. TypeScript, project lint, focused ESLint, production build (15 routes) and `git diff --check` pass. Native Safari/HLS runtime and playback remain unverified without a controlled device/stream fixture.
- RUN 4 browser evidence: Movie 43, TV expanded 44, Browse 40, Search 39, Profile 44, Genre 40, Login 40 axe passes with zero violations; Home 38 at 320 and 41 at 1440. Seven-width check for Movie/TV/Genre/Browse/Search/Profile/Login/Signup; Home only at 320/1440. See browser report for incomplete contrast and other limitations.
- Verification after last source edit: TypeScript PASS, lint PASS (zero warnings/errors), production build PASS (15 routes), `npm ls` PASS. No commit/PR; dirty main preserved.
- HLS native source lifecycle follow-on: native `loadedmetadata`/`error` listeners have effect-scoped cleanup; native media source is paused/removed/reloaded on teardown; native Retry resets time and reassigns/reloads the HLS source. Per-source playback state resets on `src` changes. `video.play()`, `requestFullscreen()` and `exitFullscreen()` promise rejections are handled gracefully. TypeScript, project lint, focused ESLint, production build (15 routes) and `git diff --check` pass. Native Safari/HLS runtime and playback remain unverified without a controlled device/stream fixture.
- Fixed-surface contrast follow-on: Navbar 10px brand microcopy and account email moved from 40% white to shared `--muted-foreground`; MovieCard 12px genre caption moved from 70% white to the shared token; VideoPlayer notice/banner and localhost warning foregrounds/backgrounds strengthened; AuthForm warning/error/success feedback now uses high-contrast semantic text on a near-opaque panel. Solid/composited calculations passed normal-text AA: muted on app base 9.96:1; player orange 11.79:1; player blue 14.00:1; player amber notice 15.86:1; auth amber 15.97:1, red 13.75:1, green 16.41:1. These do not close the varying poster/hero/gradient image contrast audit.
- HLS callback lifecycle follow-on: `onError` is now stored in a ref and updated separately; the media initialization effect depends only on `src`, preventing callback identity changes from unnecessarily destroying/recreating a live HLS/native media instance. Ten focused source assertions passed for callback ref, `src`-only dependency, native event/source cleanup, retry and handled play/fullscreen promise rejections. No test framework or DOM harness is installed, so no new dependency/test runner was introduced.
- HLS fatal-error recovery follow-on: fatal hls.js network errors now receive one bounded `startLoad()` recovery attempt per source; fatal media errors receive one bounded `recoverMediaError()` attempt; subsequent fatal errors enter the existing announced error/retry UI. Manual hls.js Retry now calls `stopLoad()`, reloads the source, and calls `startLoad()` explicitly. Native `src` assignment and `load()` are guarded for synchronous setup failures. Eleven focused source assertions pass; TypeScript, focused ESLint, project lint (zero warnings), production build (15 routes), and `git diff --check` pass. This remains source/API/gate verification, not proof of real playback.
- RUN 7 player follow-on: fatal-error recovery counters moved to a ref and reset on source change and manual Retry, so a user retry gets a fresh bounded attempt. Custom HLS settings now move focus into the settings group, support Escape, restore focus to the trigger after selection/close, use an accessible expanded/controls relationship and bounded scrolling. Seek/volume ranges have explicit keyboard focus visibility; volume expands on focus; the underlying video element is removed from tab order because the custom controls own interaction.
- RUN 7 external player follow-on: `VideoPlayer` no longer implies a successful iframe `load` means playback is working. It announces only that the provider page loaded and explains that actual playback/controls are managed by the provider. Media identity changes reset status and key the iframe by TMDB ID/type/season/episode; server change/retry clear prior provider-page state. No iframe internal playback is claimed.
- RUN 7 checks: 12 focused source assertions PASS; `npx tsc --noEmit` PASS; focused ESLint for HLSPlayer/VideoPlayer PASS; `npm run lint` PASS (0 warnings); `npm run build` PASS (15 routes); `git diff --check` PASS. Movie/TV HTTP route smoke returned 200. Build chunks: Movie 3.06 kB / first load 217 kB; TV 9.25 /224; shared 87.3 kB. Actual HLS and iframe playback remain untested.
- RUN 7 auth/cloud follow-on: Supabase `getSession()` finalizer now clears initial loading only if no auth event superseded the restore operation. Cloud user resolution rejects auth errors; `isCurrentCloudUser` compares Supabase `getUser()` with the captured user and in-memory owner; watch-history/playback/likes/watchlist mutations check identity before writing; playback and library reads reject stale results; sign-in cloud hydration checks in-memory owner again before replacing local storage. Existing migration RLS policies explicitly enforce owner-only select/insert/update/delete for `watch_history`, `watchlist`, `likes`, `playback`, and profiles. Nine focused source/RLS assertions pass. Live multi-account switching/failure injection remains unverified. TypeScript and ESLint passes; project lint zero warnings; build generated 15 routes and route-size table, but an earlier trace-collection run emitted ENOENT for `.next/server/pages/_app.js.nft.json` during the same session. Treat final build gate as INCONSISTENT rather than unequivocally clean; server remained alive and route smoke succeeded.

## 2026-11-20 follow-on � HLS keyboard focus and auto-hide

- `HLSPlayer.tsx`: removed the inaccurate `aria-haspopup="dialog"` from the settings trigger because the popup is a labelled `role="group"`; controls auto-hide is suspended while settings are open or contain focus; focus entering the player reveals controls during playback.
- Six targeted source assertions PASS. `npx tsc --noEmit`, focused ESLint, `npm run lint` (zero warnings/errors), and `git diff --check` PASS. No controlled stream/browser fixture; live playback and runtime keyboard interactions are not claimed.

## 2026-11-20 follow-on - External provider reliability claims

- `VideoPlayer.tsx`: removed the hard-coded `reliable` flag from all six providers and removed the green-dot UI plus the claim that the dots meant tested/reliable. The info bar now states that provider availability can vary and a loaded provider page does not confirm playback. Existing explicit provider-page-loaded status remains.
- Score: impact 4 x confidence 5 / effort 1.5 = 13.3. Ten combined HLS/provider source assertions PASS; TypeScript, focused ESLint, project lint (zero warnings/errors) and `git diff --check` PASS. No real provider playback was available, so provider reliability remains unverified.

## 2026-11-20 - RUN 9 premium UI/UX and cache correctness follow-on

- Implemented shared charcoal/gold design tokens and layout primitives; reduced decorative glow/noise, compacted Navbar, refined home hero, poster-first MovieCards and carousel gutters/typography, and aligned Browse/Search/Profile page shells.
- Redesigned shared Login/Signup presentation as an editorial split layout on desktop and compact responsive form on mobile. Added password visibility control, larger labelled inputs, improved validation/loading/error/success treatments and privacy note. Existing auth handler, Supabase calls and safe local redirect logic are unchanged.
- Added shared `MediaSkeleton`/`HeroSkeleton`; wired shared media skeleton into Browse, Search and PersonalRows; updated detail/profile skeleton dimensions to match real content.
- Recommendation cache correction: provider/exception failure returns 503/no-store; no-personalization is a distinct cacheable empty reason; client refuses to cache explicit unavailable responses. Public success cache behavior remains intact and account-specific data is not moved into a shared cache.
- Eight focused source assertions PASS; TypeScript, focused ESLint, project lint (zero warnings/errors) and `git diff --check` PASS. No production build or live screenshot/axe/browser retest performed because existing server/usable CDP target is not available; do not claim those gates passed. Actual login/signup submission and responsive browser render remain unverified in this run.
