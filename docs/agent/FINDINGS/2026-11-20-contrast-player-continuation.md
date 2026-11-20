# RUN 5 continuation — fixed-surface contrast and HLS lifecycle stability — 2026-11-20

## Workspace and preservation

- Workspace `C:\Users\anime\movix`; branch remains `main...origin/main` with the same existing dirty source/docs/lockfile tree and six untracked history/route files. No reset, stash, clean, stage, commit, branch, PR or merge.
- Existing Next production server PID `21288` remains bound to `127.0.0.1:3000`; existing Chromium PID `8644` remains bound to CDP `127.0.0.1:9227`. No process was killed and no browser/profile/debug port was created.
- Existing Home/Browse/Profile/Login/Search/TV/Genre CDP targets were enumerated. A targeted Home axe attempt returned an incomplete blank-like document (missing title/lang/main/H1), inconsistent with `src/app/layout.tsx`, so its four findings were rejected as stale-target evidence. No post-change axe count or screenshot visual inspection is claimed.
- Fresh HTTP smoke: `GET /browse` returned 200, 44,952 bytes from the existing app server.

## Backlog scoring and implementation

Scoring continues to use impact × confidence ÷ effort (factor scale 1–5).

| Cluster | Impact | Confidence | Effort | Score | Status |
|---|---:|---:|---:|---:|---|
| Fixed-surface contrast on Navbar, MovieCard, player banners and auth feedback | 4 | 5 | 2.5 | 8 | DONE for the listed combinations; image overlays remain IN_PROGRESS |
| HLS media engine should not be recreated when parent `onError` callback identity changes | 4 | 5 | 2.5 | 8 | DONE; source assertions and project gates pass |
| Image/gradient/player/hover/focus/disabled contrast audit | 4 | 5 | 2.2 | 9.1 | IN_PROGRESS; requires valid live rendered samples at actual states |
| Live HLS playback, keyboard, captions and external iframe operation | 4 | 4 | 2 | 8 | IN_PROGRESS; controlled fixture/provider access unavailable |

## Changed implementation files

- `src/components/Navbar.tsx`: tiny brand microcopy and account email switched from 40% white to `text-muted-foreground` shared token.
- `src/components/MovieCard.tsx`: 12px genre caption switched from 70% white to the shared muted token; this foreground remains on a poster gradient surface, so the resulting image-composited ratio is still not certified.
- `src/components/VideoPlayer.tsx`: AutoEmbed/Hindi notice banners changed to an almost opaque dark surface with stronger amber/blue foregrounds and border contrast; small amber explanatory notices strengthened.
- `src/components/AuthForm.tsx`: configuration, error and success feedback panels changed to near-opaque dark surfaces with stronger semantic amber/red/green foregrounds and clearer borders.
- `src/components/HLSPlayer.tsx`: `onError` callback stored in a ref and updated by a separate effect; media initialization effect now depends only on `src`. Callback prop identity changes no longer destroy/recreate the native/HLS media engine. Existing native listeners/source teardown, retry behavior, source-state reset and promise handling remain intact.

## Contrast calculations

Calculated with WCAG sRGB relative luminance from the foreground and specified solid/composited background colors; normal-text AA threshold is 4.5:1.

| Combination | Calculated ratio |
|---|---:|
| `rgb(184,184,184)` shared muted foreground on `#0A0A0F` | 9.96:1 |
| Player orange banner (`#FDBA74`) on 95% `#09090B` over app base | 11.79:1 |
| Player blue banner (`#BFDBFE`) on 95% `#09090B` over app base | 14.00:1 |
| Player amber notice (`#FDE68A`) on app base | 15.86:1 |
| Auth amber (`#FDE68A`) on 95% `#09090B` over app base | 15.97:1 |
| Auth red (`#FECACA`) on 95% `#09090B` over app base | 13.75:1 |
| Auth green (`#BBF7D0`) on 95% `#09090B` over app base | 16.41:1 |

These results apply only to the controlled backgrounds above. They do not complete contrast for Hero backdrop gradients/shimmer title, MovieCard text over arbitrary poster images, HLS black-video controls, gradients, translucent navbar menu/failure state, or hover/focus/disabled variations.

## HLS regression assertions

No Vitest/Jest/Testing Library/JSDOM/Happy DOM or existing app test harness is installed. No testing dependency was added. Ten targeted source assertions passed:

- latest error callback held in a ref;
- callback ref updates without recreating the media-source effect;
- source effect depends only on `src`;
- native metadata and error listeners removed on cleanup;
- native `src` removed on teardown;
- native Retry reassigns and reloads the source;
- rejected `video.play()`, `requestFullscreen()` and `exitFullscreen()` promises are handled.

This is static source/gate evidence, not live playback proof. No legitimate controlled HLS source or Safari/native-HLS environment was available in the existing browser session. External iframe providers are cross-origin and were not inspected; their internal keyboard/captions/controls remain unverified.

## Verification

- `npx tsc --noEmit`: PASS.
- Focused `npx eslint src/components/HLSPlayer.tsx src/components/Navbar.tsx src/components/MovieCard.tsx src/components/VideoPlayer.tsx src/components/AuthForm.tsx`: PASS.
- `npm run lint`: PASS, zero warnings/errors.
- `npm run build`: PASS, all 15 routes generated. Current build sizes: Home 8.66 kB / first-load 217 kB; Browse 8.01 /104; Search 7.62 /144; Profile 7.47 /216; Movie 2.94 /217; TV 9.15 /223; shared JS 87.3 kB.
- Build warning: outdated `caniuse-lite` Browserslist metadata; non-fatal.
- `git diff --check`: PASS.
- Fresh `npm audit --omit=dev`: exits 1 with 3 vulnerability groups (1 critical, 2 high); npm's available fix remains major `next@16.4.6`. No dependency migration performed.

## Remaining limitations and next priorities

- Image-dependent contrast requires real valid rendered targets and sampling of actual composited pixels/states; current CDP target for Home was stale/blank. Do not call image/gradient contrast done.
- HLS runtime/playback, captions, seek, focus, settings, volume, quality, fullscreen, reduced motion, buffering/error announcements and native Safari path remain unverified. External iframe testing is separate.
- No 200% text zoom or Lighthouse evidence. Home responsive width coverage remains only 320/1440 from prior report; existing seven-width evidence for other routes should not be repeated without a changed route or regression.
- Supabase and provider fault injection remain pending controlled fixtures.
- Next 16.4.6 / ESLint 9 migration remains BLOCKED until Vercel Node/build settings are confirmed and an isolated worktree can safely preserve dirty `main`. Current audit still reports critical/high findings.
- Dirty `main` and all prior user-owned modifications preserved; no stage/commit/PR.
