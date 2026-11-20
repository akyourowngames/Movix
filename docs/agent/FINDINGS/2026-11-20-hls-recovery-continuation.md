# RUN 6 continuation — bounded HLS recovery and player source audit — 2026-11-20

## Workspace reconciliation

- Repo: `C:\Users\anime\movix`; branch remains `main...origin/main` and the dirty source/docs/lockfile tree from RUN 5 is preserved.
- The RUN 5 implementation is present: fixed-surface contrast edits in Navbar/MovieCard/VideoPlayer/AuthForm; `HLSPlayer` stores the latest callback in `onErrorRef` and its source lifecycle effect depends only on `[src]`; RUN 5 docs and findings are present.
- No reset, stash, clean, broad stage, commit, branch, PR, merge, or process termination.
- Existing production server PID 21288 remains on `127.0.0.1:3000`; existing Chrome PID 8644 remains on CDP `127.0.0.1:9227`. No new browser/profile/debug port was created.
- Existing `/browse` smoke returned HTTP 200 (44,952 bytes). CDP exposes existing Home/Browse/Profile/Auth/Search/TV/Genre targets, but the local screenshot viewer returned no image content and a previous Home axe attempt returned an incomplete blank-like document; no new visual inspection or axe count is claimed.

## RUN 5 verification nuance

- The fixed-background calculations in `2026-11-20-contrast-player-continuation.md` are mathematically defensible only for the listed controlled solid/composited colors. In particular, the MovieCard genre caption ratio cannot be asserted for the actual card because the caption is rendered over a poster image and an 80%-dark gradient; that real background is still unmeasured.
- Local screenshot assets exist under `public/screenshots/`, but the available preview action emitted no image payload in this session. No claim of having visually inspected those images is made.
- `HLSPlayer` is not referenced by current application route components. Movie/TV routes use the separate third-party iframe `VideoPlayer`; these two player implementations must remain separate in reporting/testing.
- No installed Vitest/Jest/Testing Library/JSDOM/Happy DOM runner and no controlled media fixture were found. No test dependency was added.

## Backlog selection and implementation

Scoring: impact × confidence ÷ effort, with all factors 1–5.

| Finding | Impact | Confidence | Effort | Score | Status |
|---|---:|---:|---:|---:|---|
| Fatal hls.js network/media errors need bounded recovery before error UI | 4 | 5 | 2.5 | 8 | DONE at source/API level; real network/media injection remains unavailable |
| Rendered image/gradient contrast and interaction states | 4 | 5 | 2.2 | 9.1 | IN_PROGRESS; valid composited screenshot/browser sampling still needed |
| External provider iframe access, keyboard and error states | 4 | 4 | 2 | 8 | IN_PROGRESS; provider page access and real playback not verified |

Changed `src/components/HLSPlayer.tsx`:

- Fatal hls.js network errors now get one bounded `startLoad()` recovery attempt per source lifecycle.
- Fatal media-element errors get one bounded `recoverMediaError()` attempt per source lifecycle.
- Further fatal errors settle into the existing error/Retry UI and invoke the current `onError` callback.
- Explicit hls.js Retry now calls `stopLoad()`, reloads the source and calls `startLoad()`.
- Native HLS source assignment/`load()` are guarded against synchronous setup exceptions and route to the same error state.
- Existing `[src]`-only effect, latest callback ref, native event cleanup, source teardown and play/fullscreen promise handling remain intact.

Installed local `hls.js` typings confirm `ErrorTypes.NETWORK_ERROR`, `ErrorTypes.MEDIA_ERROR`, `startLoad()`, `stopLoad()` and `recoverMediaError()` exist.

## Focused regression assertions

Eleven source assertions passed:

1. Latest `onError` callback held in a ref.
2. Media effect depends only on `src`.
3. Fatal network error has at most one automatic restart.
4. Fatal media error has at most one automatic recovery.
5. Subsequent fatal error enters the announced error state.
6. Manual hls.js Retry stops, reloads and restarts loading.
7. Native source setup exceptions enter the error state.
8. Native metadata listener is removed.
9. Native error listener is removed.
10. Native source is removed on teardown.
11. Playback and fullscreen promise failures are handled.

These checks assert source structure and API usage; they do not substitute for a mounted player or controlled media tests.

## Verification

- `npx tsc --noEmit`: PASS.
- `npx eslint src/components/HLSPlayer.tsx`: PASS.
- `npm run lint`: PASS, zero warnings/errors.
- `npm run build`: PASS, all 15 routes generated.
- Current build sizes: Home 8.66 kB / 217 kB first load; Browse 8.01 /104; Search 7.62 /144; Profile 7.47 /216; Movie 2.94 /217; TV 9.15 /223; shared 87.3 kB.
- `git diff --check`: PASS.
- Existing server HTTP `/browse`: 200.
- Fresh `npm audit --omit=dev`: 3 groups, 1 critical + 2 high; npm still points to major `next@16.4.6`. No framework/dependency migration performed.

## Remaining limitations and priorities

- No real native HLS or hls.js playback, source switch, retry/error injection, captions, seek, volume, fullscreen, quality, rate, buffering or reduced-motion runtime verification.
- Current Movie/TV routes use cross-origin external iframe providers. Their internal controls, keyboard support, captions, origin reliability and playback are not app-audited.
- Full rendered contrast remains open for hero backdrop gradient/shimmer title, poster image composites, badges, card overlay interaction, HLS control gradients, translucent signed-in menu/failure message, and hover/focus/disabled states.
- Home width matrix remains 320/1440 only from prior evidence; do not repeat other seven-width matrices without regression evidence. OS 200% zoom and Lighthouse remain unavailable.
- Supabase authenticated failure injection, genuine account switching, partial cloud migration faults and provider failure injection remain unavailable.
- Next 16.4.6/ESLint 9 migration remains BLOCKED until Vercel Node/build settings are confirmed and a safe isolated worktree can preserve dirty `main`.
- Dirty `main` preserved; no commit/PR.
