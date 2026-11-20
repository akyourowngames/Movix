# RUN 7 — player recovery, controls accessibility and provider status semantics — 2026-11-20

## Workspace preservation and reconciliation

- Repo `C:\Users\anime\movix`; `main...origin/main` remains dirty with ongoing source/docs/package-lock changes. Existing untracked RUN 3/5/6 findings and route error/loading files are preserved.
- Existing server PID 21288 remains on `127.0.0.1:3000`; Chrome PID 8644 still owns CDP `127.0.0.1:9227`. CDP `/json/list` returned no page targets during this run, so no new browser/profile/debug port was created.
- No reset, stash, clean, broad staging, commit, branch, PR, merge or process termination.
- Latest production audit remains 1 critical + 2 high; npm fix still points to major `next@16.4.6`. No dependency migration attempted.

## Backlog scoring

Impact × confidence ÷ effort; all factors 1–5.

| Candidate | Impact | Confidence | Effort | Score | Status |
|---|---:|---:|---:|---:|---|
| Manual HLS Retry must reset the bounded automatic recovery budgets | 4 | 5 | 2.5 | 8 | DONE |
| HLS settings/range controls keyboard focus and dismissal behavior | 4 | 5 | 2.5 | 8 | DONE at source level; no live player fixture |
| External iframe `load` must not claim playback success; media identity must reset provider state | 4 | 5 | 2.5 | 8 | DONE at app-level semantics; provider playback not verified |
| Rendered image/gradient contrast | 4 | 5 | 2.2 | 9.1 | IN_PROGRESS; valid rendered screenshots/targets unavailable |

## Source changes

### `src/components/HLSPlayer.tsx`

- Moved automatic network/media recovery counters into `recoveryRef` so a user-triggered Retry can reset them.
- Budgets reset both at source initialization and manual Retry. A manual retry therefore receives one new bounded network restart and one media recovery attempt instead of immediately exhausting an old source-local budget.
- The custom settings group receives focus when opened; Escape closes it and restores focus to the settings trigger. Playback-rate and quality selections close the group and restore focus.
- Settings trigger now identifies its controlled group and exposes expanded state; the group is labelled, bounded to `70dvh`, and scrollable.
- Seek range exposes a visible keyboard focus outline. Volume range expands on keyboard focus and exposes a focus outline.
- Native `<video>` is removed from tab order and hidden from the accessibility tree because the custom controls are the authoritative interaction layer; no duplicate native controls are exposed.

### `src/components/VideoPlayer.tsx`

- A cross-origin iframe's `load` event only confirms document navigation, not that a video stream can play. UI now reports `Provider page loaded. Playback availability and controls are managed by <provider>.` rather than claiming playback success.
- Info bar says `Provider:` rather than `Playing on:`.
- State tracks whether the provider document has loaded and clears that state when changing server or retrying.
- Current media identity includes TMDB ID, type, season and episode; iframe key uses that identity so media changes cause a remount and stale provider status is not carried across episodes/titles.
- Provider page `onError` remains the only parent-visible iframe failure signal; cross-origin playback/readiness cannot be observed by the app.

## Focused regression assertions

Twelve source-level assertions passed:

1. HLS latest `onError` is held in a ref.
2. HLS initialization effect depends only on `src`.
3. Bounded network and media recovery use `startLoad` and `recoverMediaError`.
4. Manual Retry resets both recovery budgets.
5. Source initialization resets both recovery budgets.
6. Manual HLS Retry calls stop/load/start in order.
7. Settings open/focus and Escape/focus restoration paths are present.
8. Seek and volume inputs expose visible focus styles.
9. Video element is out of tab order and hidden to assistive technology.
10. Iframe load status is described as provider-page load, not playback success.
11. Iframe identity contains media ID/type/season/episode.
12. Server change and Retry clear provider loaded status.

These are source-level assertions only, not a React DOM/component test suite. No Vitest/Jest/Testing Library/JSDOM/Happy DOM is installed; no dependency was added.

## Verification

- `npx tsc --noEmit`: PASS.
- Focused `npx eslint src/components/HLSPlayer.tsx src/components/VideoPlayer.tsx`: PASS.
- `npm run lint`: PASS, zero warnings/errors.
- `npm run build`: PASS, all 15 routes generated.
- Build sizes: Home 8.66 kB / 217 kB first load; Browse 8.01 /104; Search 7.62 /144; Profile 7.47 /216; Movie 3.06 /217; TV 9.25 /224; shared JS 87.3 kB.
- `git diff --check`: PASS.
- Existing production server: `/movie/550` HTTP 200, 84,685 bytes; `/tv/1396` HTTP 200, 83,937 bytes. These are route HTML smoke checks, not playback evidence.

## Limitations and next priorities

- HLSPlayer is not mounted by current app routes; no controlled HLS URL/media fixture or Safari/native-HLS device was available. Real playback, source-change behavior, recovery injection, captions, seeking, fullscreen, playback rate, quality and buffering announcements remain unverified.
- Movie/TV routes use a cross-origin provider iframe. The app cannot inspect the frame's internal player state or prove playback from `iframe.onload`; provider-side controls, keyboard, captions, error UI and actual playback remain unverified.
- CDP endpoint is active but `/json/list` returned no page targets; no browser was launched.
- Screenshot viewer had previously emitted no image content; no visual screenshot inspection or new axe results are claimed.
- Image-dependent contrast remains open; RUN 5 fixed-surface ratios are not proof for arbitrary poster/hero gradients.
- Home seven-width matrix, OS 200% zoom, Lighthouse, auth/provider failure injection and Next 16 migration remain outstanding/external.
- Dirty main and all existing work preserved; no commit/PR.
