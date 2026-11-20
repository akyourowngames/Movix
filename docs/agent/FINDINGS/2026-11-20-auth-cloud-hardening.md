# RUN 7 continuation — auth bootstrap and cloud account-boundary hardening — 2026-11-20

## Workspace and preservation

- Repo `C:\Users\anime\movix`; branch `main...origin/main`, existing dirty user/source/docs/lockfile tree preserved.
- Original app server PID 21288 remains `next start --hostname 127.0.0.1`; original Chrome PID 8644 remains headless Chromium with `.qoder\chrome-profile` and CDP port 9227. No process killed and no browser/profile/debug port created.
- Existing `/browse` smoke remained HTTP 200 (44,952 bytes) during this iteration.
- No reset/stash/clean/overwrite/broad stage/commit/branch/PR/merge.

## Backlog scoring

Impact × confidence ÷ effort (factor scale 1–5).

| Candidate | Impact | Confidence | Effort | Score | Status |
|---|---:|---:|---:|---:|---|
| Auth bootstrap completion must not override newer auth-state event | 4 | 5 | 2.5 | 8 | DONE at source level |
| Cloud mutations/reads/local hydration must reject stale account identity | 5 | 5 | 2.5 | 10 | DONE at client/RLS evidence level; real multi-account injection remains open |
| Supabase session switch and cloud migration failure fixture testing | 4 | 4 | 2 | 8 | IN_PROGRESS; no authenticated controlled fixture available |

## Changes

### `src/components/AuthProvider.tsx`

- Fixed initial session restore race: `getSession()` `.finally()` now clears the initial loading state only when the component is still mounted and no `onAuthStateChange` event has superseded the restore promise.
- The auth event handler remains the authority when an event arrives first; it updates the user and clears loading, and stale restore fulfillment/rejection no longer changes that state.

### `src/lib/cloud.ts`

- `resolveUserId()` now treats `supabase.auth.getUser()` errors as no authenticated user instead of using a potentially absent `data` value.
- Added `isCurrentCloudUser(supabase, userId)` which validates the authenticated `getUser()` ID and ensures the module-level `cloudUserId` is either unset (initial hydration) or the same captured user.
- `pushView`, `pushPlayback`, `pushLike` and `pushWatchlist` check the captured identity before issuing mutations; deletes now also handle returned errors via generic console warnings.
- `fetchPlayback` checks the identity again after the read and returns `null` when the account changed during the request.
- `fetchLibrary(userId)` rejects after its four parallel reads if authenticated/module identity no longer matches; stale data is not returned to page state.
- `syncOnSignIn` verifies the Supabase user at the beginning, after the initial library read, after merge writes and before local hydration. It now also checks the in-memory `cloudUserId` immediately before `hydrateLocal()`/`replaceProfile()`, preventing a late user-A sync from replacing device-local state after AuthProvider has moved to user B.

### Existing server-side authorization evidence

Inspected `supabase/migrations/20261115000000_user_library.sql`. It declares owner-only policies for profiles and all library tables:

- `profiles`: select/insert/update require `auth.uid() = id`.
- `watch_history`, `watchlist`, `likes`, `playback`: owner-only select/insert/update/delete use `auth.uid() = user_id` (likes has select/insert/delete policies; no update operation is used by the app, because it upserts into the unique key and policies constrain insert/delete).

Client identity checks are defense-in-depth for stale operations and stale returned data; they do not replace these Supabase RLS policies. A tiny interval remains between the final client check and database request, so RLS is the hard authorization boundary.

## Regression assertions

Nine source/migration assertions passed:

1. Session restore finalizer ignores completion after an auth event.
2. Auth event handler owns the current session/loading state.
3. Auth subscription is unsubscribed on cleanup.
4. Cloud identity resolution rejects `getUser()` errors.
5. Identity guard checks Supabase identity and in-memory owner.
6. All four cloud mutation helpers use the identity guard.
7. Playback and library reads reject stale account results.
8. Cloud hydration checks the active owner immediately before local replacement.
9. RLS owner-only policies exist for profiles and all library tables.

These are focused source/migration assertions, not live Supabase integration tests.

## Verification

- `npx tsc --noEmit`: PASS.
- Focused ESLint for AuthProvider/cloud/HLSPlayer/VideoPlayer: PASS.
- `npm run lint`: PASS, zero warnings/errors.
- `npm run build`: compilation, type/lint validation and all 15 static/dynamic route generations completed. One run then emitted `ENOENT` for `.next/server/pages/_app.js.nft.json` while the existing `next start` server was concurrently reading the same `.next` output. A second output stream emitted the full route-size table, but the connector did not expose a consistent clean exit code. Record the production build gate as INCONSISTENT, not as a clean pass. Do not stop the user's running server to retry in-place.
- Route sizes in the emitted table: Movie 3.06 kB / 218 kB first load; TV 9.25 / 224; Home 8.66 /217; Browse 8.01 /104; Search 7.62 /144; Profile 7.47 /216; shared JS 87.3 kB.
- `git diff --check`: PASS on prior final check before auth documentation append; re-run at closeout.
- The existing server remained alive and `/browse` returned HTTP 200.

## Limitations and next priorities

- No live authenticated Supabase session/account switch, sign-out failure, cloud migration partial-write or RLS denial injection was performed. The code/migration evidence is static; do not describe as live cross-account proof.
- Guest local profile remains intentionally device-wide; cloud user isolation is enforced by RLS plus the new identity checks. No data model/schema change made.
- Cloud merge remains multi-table/non-transactional; successful earlier writes can remain if a later table write fails. Retry is designed to be idempotent but atomic rollback is not provided.
- Production build trace completion is inconsistent because the running Next server shares the `.next` directory; repeat only with a safe isolated output strategy or explicit owner approval to stop the server.
- Next 16.4.6 / ESLint 9 dependency migration remains BLOCKED pending deployed Vercel Node/build settings and a safe isolated worktree from dirty main.
- Dirty `main` preserved; no commit/PR.
