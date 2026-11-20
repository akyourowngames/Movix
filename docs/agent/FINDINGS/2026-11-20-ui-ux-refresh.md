# RUN 9 — Premium UI/UX, authentication, skeletons and cache correctness — 2026-11-20

## Scope and preservation

- Workspace: `C:\Users\anime\movix`, existing dirty `main` with earlier user and RUN 1–8 changes.
- No reset, stash, clean, branch, broad staging, commit, PR or merge. Existing changed files were patched in place; pre-existing source, lockfile and historical findings were preserved.
- Chrome PID 8644 remained running and owned CDP 9227. Previously recorded Next server PID 21288 and port 3000 were absent during this continuation; no replacement app server was started. No browser/profile/debug port was created and no build was run into shared `.next`.

## Design and application changes

### Shared design system

- `src/app/globals.css`: refined the dark charcoal and restrained gold palette; removed global film-grain background and text-glow utility; made glass utility less translucent; added shared `page-shell`, `section-space`, `eyebrow`, `surface-panel`, `auth-input` and `skeleton-surface` utilities.
- Skeleton sheen is restrained and uses a global `prefers-reduced-motion` override to collapse animation/transitions.
- Established shared page gutters rather than route-specific arbitrary widths.

### Navigation and home/catalog

- `src/components/Navbar.tsx`: compacted navbar height, simplified logo, tightened responsive spacing, reduced search expansion width and simplified the scrolled background; account loading uses the shared skeleton surface.
- `src/components/HeroSection.tsx`: reduced excessive hero sizing and animated title shimmer; left-aligned the content, restrained typography/CTA effects, strengthened left-to-right artwork readability, tightened arrows and slide controls, and reserved top space for the fixed navigation.
- `src/app/page.tsx`: removed the large negative row overlap that caused the hero/navbar collision seen in the user-provided screenshot.
- `src/components/MovieCard.tsx`: replaced large entrance/tilt animation and always-mounted overlay with a poster-first 2:3 card, metadata below, and action controls revealed on hover or keyboard focus. Removed unused index prop.
- `src/components/MovieCarousel.tsx`: shared shell gutters, smaller editorial headings, consistent rail spacing and always-visible accessible arrow controls; removed unused map index.

### Browse, search and profile

- `src/app/browse/page.tsx`: shared shell, solid editorial header and wider large-screen grid; skeleton now uses shared `MediaSkeleton`.
- `src/app/search/page.tsx`: shared shell, solid search/filter surfaces and shared search-results skeleton; existing query/filter state and cache key behavior retained.
- `src/app/profile/page.tsx`: shared shell, more restrained stat panels and skeleton surfaces with the actual 2:3 poster ratio; account/profile reads and user-specific storage untouched.
- `src/components/PersonalRows.tsx`: shared media skeleton in the personalization loading state. Existing 10-minute in-memory cache remains keyed by the full query derived from the local user profile; it was not replaced by a cross-user cache.

### Authentication

- `src/components/AuthForm.tsx`: Login and Signup use the same desktop split editorial/form composition and mobile single-column form. Removed the generic blur/glow background and oversized rounded glass card. Improved labels, input size, spacing, focus/feedback styles and disabled/loading submit presentation. Added explicit password visibility toggle, correct existing `email`/`current-password`/`new-password` autocomplete semantics and privacy reassurance.
- Kept `safeNext`, same-origin path validation, `signIn`, `signUp`, confirmation handling, `router.push` and redirect behavior. No change to Supabase security policy, AuthProvider race handling, account isolation or RLS.

### Skeleton system

- Added `src/components/ui/MediaSkeleton.tsx` with reusable poster/landscape variants, configurable count, status/busy semantics and shared 2:3 poster geometry; added a dimensionally planned `HeroSkeleton` for a future streaming boundary.
- Wired `MediaSkeleton` into Browse, Search and PersonalRows. `DetailSkeleton` now matches the real detail layout (poster/metadata/player) and uses shared skeleton surfaces. Profile uses matching shared sheen/poster geometry.
- `HeroSkeleton` is currently exported but not wired: Home fetches its server feed before rendering. No new artificial delay/loading boundary was added.

## Cache audit and implementation

- Home feed: `src/app/page.tsx` already revalidates the public server feed every 900 seconds; existing TMDB fetch helper TTLs (e.g. discover/catalog 1800s, trending day 900s, detail 3600s) retained.
- Catalog API: public success uses `max-age=60, s-maxage=3600, stale-while-revalidate=86400`; total upstream failure is 503/no-store; retained.
- Search API: public successful query is short-cacheable, invalid/too-long input 400/no-store and total provider failure 503/no-store; retained.
- Season API: public episode success cached; invalid and failed fetch no-store; retained.
- Personal recommendation client: full profile-derived query key and 10-minute in-memory cache retained; not moved into a global account-agnostic cache.
- Fixed actual recommendation failure cache issue: `src/app/api/recommend/route.ts` now emits 503 + `no-store` when its upstream/recommendation computation throws, rather than a cacheable 200 unavailable result. No-seed/no-genre state is explicitly `no_personalization`, distinct from failure. `PersonalRows` rejects explicit `reason: unavailable` before cache insertion. Successful responses retain existing public cache headers.

## Verification

- `npx tsc --noEmit`: PASS.
- Focused ESLint over changed UI components/routes and recommendation API: PASS (exit 0).
- `npm run lint`: PASS, zero warnings/errors after removing now-unused list index props from MovieCard/MovieCarousel.
- Eight focused source assertions: PASS (auth redirect and Supabase handler calls preserved; password visibility and autocomplete; 2:3 skeleton geometry/status semantics; recommendation 503/no-store and client failure exclusion).
- `git diff --check`: PASS before the final six-document update; re-run at closeout.
- Production audit snapshot at start of RUN 9: 1 critical, 2 high, 0 moderate. No dependency changes.
- Production build: NOT RUN; no existing server on port 3000/PID 21288, and user explicitly prohibits rebuilding the shared `.next` directory.
- Browser/axe/screenshot/200% zoom/responsive live validation: NOT RUN; CDP 9227 owner exists but no usable page target was re-established. No screenshot inspection or WCAG image-gradient certification claimed.
- No live auth submission, HLS/iframe playback or injected recommendation upstream failure was performed. The recommendation cache fix has source assertions only, not a runtime fault fixture.

## Remaining work

- Re-run browser verification when existing CDP has an accessible page target: changed Home/Navbar/Login/Signup/Browse/Search/Profile and card rails at 320, 375, 414, 768, 1024, 1440 and 1920 CSS px, focus/touch/reduced-motion, actual screenshots, axe and 200% zoom.
- HTTP 404 semantics on eight invalid/missing Movie/TV/Genre requests remain OPEN from RUN 8; must fix and verify direct HTML and RSC/client navigation without corrupting provider failure semantics or loading UX.
- Next dependency remediation remains BLOCKED; Vercel Node/build settings unconfirmed, dirty `main` not safe to migrate in place. Do not force upgrade.
- Rendered image-dependent WCAG contrast, cloud/account fault injection, real player playback and full responsive coverage remain IN_PROGRESS.

## Final shared-surface follow-on

- Movie and TV detail page main content now uses the shared `page-shell` gutters and aligned 240px/280px poster column at desktop breakpoints; poster radius is consistent with the redesigned card language. Data and playback props remain unchanged.
- Footer now uses the shared page shell, responsive editorial grid, calmer surface and consistent typography/spacing.
- Navbar bookmark shortcut now uses a bookmark icon and the truthful accessible name “My list” instead of a bell/notification visual and label implying a notification feature that is not implemented.
- Re-ran closeout after these refinements: TypeScript PASS; focused ESLint PASS; project lint PASS with zero warnings/errors; eight source assertions PASS; `git diff --check` PASS. Fresh `npm audit --omit=dev`: 1 critical + 2 high, 0 moderate. Existing Chrome PID 8644 remained active. Next PID 21288/port 3000 absent; no process started/stopped and no production build/browser visual run.
