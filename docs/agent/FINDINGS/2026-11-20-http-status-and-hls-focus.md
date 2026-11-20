# RUN 8 — HTTP status investigation and HLS focus protection — 2026-11-20

## Scope and preservation

- Continued in `C:\Users\anime\movix` on existing `main...origin/main` with extensive pre-existing dirty user work.
- No reset, stash, clean, branch, broad stage, commit, PR, merge, dependency install/update, server restart, browser restart or process termination.
- Existing Next server PID 21288 / port 3000 and Chromium PID 8644 / CDP 9227 were preserved.

## HTTP status reproduction

Requests to the existing production server returned:

| Path | HTTP | Response evidence |
|---|---:|---|
| `/movie/not-a-number` | 200 | `NEXT_NOT_FOUND`, `noindex` |
| `/movie/0` | 200 | `NEXT_NOT_FOUND`, `noindex` |
| `/movie/999999999` | 200 | not-found page body |
| `/tv/not-a-number` | 200 | not-found page body |
| `/tv/0` | 200 | not-found page body |
| `/tv/999999999` | 200 | not-found page body |
| `/genre/not-a-number` | 200 | not-found page body |
| `/genre/99999` | 200 | not-found page body |
| `/movie/550` | 200 | valid movie HTML |
| `/tv/1396` | 200 | valid TV HTML |
| `/browse` | 200 | valid browse HTML |

The first two HTML bodies were further inspected: the stream ends with `E{"digest":"NEXT_NOT_FOUND"}`; the zero-ID case also includes `<meta name="robots" content="noindex"/>`. This proves the route invokes the not-found flow while the HTTP status remains 200.

## Next.js 14.2.35 implementation inspection

- `node_modules/next/dist/client/components/not-found.js`: `notFound()` throws an Error with digest `NEXT_NOT_FOUND`.
- `node_modules/next/dist/server/app-render/app-render.js`: its renderer catch checks `isNotFoundError(err)` and sets `res.statusCode = 404`.
- `node_modules/next/dist/server/app-render/static/static-renderer.js`: dynamic requests use `ServerRenderer` / React `renderToReadableStream`; the app renderer then pipes/continues the Fizz stream.
- `node_modules/next/dist/server/base-server.js`: dynamic App Page responses are allowed to stream; the response sender pipes a dynamic render result into the Node response. Once the first bytes commit headers, the later not-found status assignment cannot affect the HTTP response.
- Compiled `.next/server/app/movie/[id]/page.js` includes the expected `notFound()` call after awaited `getMovieDetails`.
- Route-level loading boundaries exist for Movie, TV and Genre. The route data request is awaited inside the page. Removing the loading boundaries risks losing the established skeleton experience. No supported per-route no-stream export was found in Next 14.2.35.

## Decision / remaining work

HTTP status fix remains OPEN. Do not use middleware status rewriting, blanket 404 mapping, request-global mutable caches or removal of loading boundaries. A safe fix needs the primary existence decision before the first HTML byte, reuse of request-scoped data without duplicate provider requests or cross-request cache leakage, preserved metadata/navigation/loading UX and clear separation of upstream provider outage from resource not-found. It must test direct HTML plus RSC/client navigation and valid routes.

## HLS accessibility implementation

`src/components/HLSPlayer.tsx`:

1. Removed `aria-haspopup="dialog"`; the controlled popup is a labelled `role="group"`, not a dialog.
2. Auto-hide timeout now only starts when playback controls are visible, settings are closed and the settings panel does not contain active focus.
3. Added a player-scoped document `focusin` listener while playing. Focus entering the player reveals the controls, which prevents keyboard focus being hidden/unmounted by the three-second timer. Listener is removed on effect cleanup.

Score: impact 4 × confidence 5 ÷ effort 1.5 = 13.3. Status DONE at source/gate level only; no live player fixture was available.

## Verification

- `npx tsc --noEmit`: PASS.
- `npx eslint src/components/HLSPlayer.tsx`: PASS.
- `npm run lint`: PASS, zero warnings/errors.
- Six targeted source assertions: PASS (popup semantics removed; settings open prevents hiding; focus listener exists and cleans up; group role and aria-controls retained).
- `git diff --check`: PASS before the final documentation appends; re-run required at closeout.
- Valid detail and Browse HTTP smoke: PASS (200).
- Invalid detail/genre expected HTTP status: FAIL (all eight returned 200; sentinel and noindex present).
- Production build: NOT RUN in this continuation. Existing `next start` PID 21288 shares `.next`; the prior RUN 7 build result remains INCONSISTENT because trace collection reported `ENOENT` during concurrent use. Do not rebuild in place.
- Browser visual/axe, live HLS playback, settings DOM keyboard interaction: NOT VERIFIED. Existing CDP endpoint previously returned an empty target listing; no browser/profile/port was created.
- Fresh audit closeout and final tree/process review remain required.

## External provider trust follow-on

- `src/components/VideoPlayer.tsx` previously set `reliable: true` for all six server entries and rendered a green dot with copy saying those providers were “tested & reliable”. No controlled iframe playback evidence supports those claims, and the cross-origin frame does not expose its internal playback state.
- Removed the `reliable` property from the server contract and all entries, removed the green dots, and replaced the status copy with: “Provider availability can vary. A loaded provider page does not confirm that playback works.” Existing `frameLoaded` UI continues to say provider page loaded only.
- Score: impact 4 × confidence 5 ÷ effort 1.5 = 13.3. Six provider/HLS assertions in the combined script: all PASS (10 total). TypeScript, focused ESLint, project lint and `git diff --check` PASS. No live provider playback was attempted or claimed.
