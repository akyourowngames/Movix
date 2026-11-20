# UI/UX and Security Backlog

Scores use impact × confidence ÷ effort, with each input from 1–5. Status values: OPEN, IN_PROGRESS, BLOCKED, DONE.

| Finding | Score | Location | Status |
|---|---:|---|---|
| Replace vulnerable Next 14 stack with currently patched Next 16.4.6 + eslint-config-next 16.4.6 / ESLint 9 and validate deployment/runtime compatibility | 15 (5×5÷1.7) | package.json, package-lock.json, App Router, middleware, auth, lint config, Vercel runtime | BLOCKED |
| Correct HTTP status for streamed Movie/TV/Genre not-found responses | 12 (4×5÷1.7) | src/app/movie/[id], src/app/tv/[id], src/app/genre/[id], Next 14 App Router rendering | OPEN — eight live 200 responses contain NEXT_NOT_FOUND/noindex; renderer sets 404 after stream starts; no safe per-route no-stream control established |
| Move `shadcn` CLI out of production dependencies to remove development-only Express/Hono/MCP tree from production audit | 12 (4×5÷1.7) | package.json, package-lock.json | DONE — verified follow-on |
| Patch root PostCSS 8.5.8 to 8.5.33; Next 14 nested PostCSS still requires framework migration | 8 (3×5÷2) | package.json, package-lock.json | DONE — follow-on |
| SeasonSelector keyboard/ARIA/focus and episode loading/error states | 8 (4×4÷2) | src/app/tv/[id]/SeasonSelector.tsx | DONE — live keyboard interaction and axe verified |
| Shared shell headings/links and Browse sticky viewport sizing | 8 (4×4÷2) | Search, Navbar/Footer, Browse | DONE — live axe and responsive checks; gradient contrast remains separate |
| Auth/profile lifecycle, account-scoped library and keyboard tabs | 8 (4×5÷2.5) | AuthProvider, profile, cloud.ts, AuthForm, Navbar | DONE — implementation and guest UI verified; Supabase failure injection remains open |
| Manual WCAG AA review for rendered poster/hero/player gradients, hover/focus/disabled and auth error states | 9 (4×5÷2.2) | shared design tokens, MovieCard, HeroSection, HLSPlayer, VideoPlayer, AuthForm | IN_PROGRESS — flat surfaces improved; image/gradient results remain incomplete |
| Fixed-surface contrast for navbar microcopy, poster caption text, player banners and auth feedback | 8 (4×5÷2.5) | Navbar, MovieCard, VideoPlayer, AuthForm, globals.css tokens | DONE — solid/composited test surfaces calculated at 9.96:1–16.41:1; poster/hero image overlays remain open |
| HLS playback keyboard/control verification with a controlled stream fixture | 8 (4×4÷2) | src/components/HLSPlayer.tsx, src/components/VideoPlayer.tsx | IN_PROGRESS — source controls improved; live media fixture not available |
| HLS native-source cleanup and retry behavior | 8 (4×5÷2.5) | src/components/HLSPlayer.tsx | DONE — native listeners/source cleanup and retry implemented; TypeScript/lint/build verified; no live native-HLS device fixture |
| HLS media effect should not restart on parent callback identity changes | 8 (4×5÷2.5) | src/components/HLSPlayer.tsx | DONE — callback ref separates `onError` updates from `src` lifecycle; focused static assertions and full project gates pass |
| Bounded recovery for fatal hls.js network/media errors and native setup failures | 8 (4×5÷2.5) | src/components/HLSPlayer.tsx | DONE — one recovery attempt per error class/source, explicit stop/restart on Retry, native setup exception fallback; source assertions and build gates pass |
| External iframe and real HLS playback/player accessibility verification | 8 (4×4÷2) | src/components/HLSPlayer.tsx, src/components/VideoPlayer.tsx | IN_PROGRESS — no controlled media fixture; iframe is cross-origin and route player is distinct from custom HLS component |
| Provider iframe load must not be represented as verified playback; reset status on media identity changes | 8 (4×5÷2.5) | src/components/VideoPlayer.tsx | DONE — provider-page status is explicit; media identity controls remount; playback remains external/unverified |
| Do not present external providers as tested/reliable without playback evidence | 13.3 (4×5÷1.5) | src/components/VideoPlayer.tsx | DONE — removed hard-coded reliability flags/green dots and clarified that provider page load does not confirm playback; source assertion PASS |
| HLS retry should reset bounded recovery budgets and settings/focus controls should be keyboard operable | 8 (4×5÷2.5) | src/components/HLSPlayer.tsx | DONE — retry budgets reset; settings open/focus/Escape/restore, range focus and source-level assertions pass |
| Auth restore event must take precedence over a late `getSession()` completion | 8 (4×5÷2.5) | src/components/AuthProvider.tsx | DONE — `.finally()` no longer clears loading after a newer auth event; source assertion passes |
| Reject stale cloud writes/reads and stale local hydration after account changes | 10 (5×5÷2.5) | src/lib/cloud.ts, AuthProvider, Supabase owner policies | DONE at source/RLS evidence level — identity checks guard CRUD/read/hydration; no live multi-account fault-injection performed |
| Controlled Auth/Profile account-switch, logout and partial cloud-migration failure tests | 8 (4×4÷2) | AuthProvider, AuthForm, Navbar, cloud.ts, profile | IN_PROGRESS — implementation present; Supabase fault injection unverified |
| Missing/invalid provider metadata and all/partial provider outage fixtures | 8 (4×4÷2) | src/lib/tmdb.ts, API routes, MovieCard, Browse, Search, PersonalRows | IN_PROGRESS — healthy semantics hardened; forced failure fixtures unverified |
| Remaining route/state + accessibility matrix, Home widths, OS 200% zoom and Lighthouse | 7 (4×4÷2.3) | all routes and shared components | IN_PROGRESS — core width/axe sweep done; Home only two widths; zoom/Lighthouse unavailable |
| Reconcile route inventory and explicit HTTP not-found semantics | 6 (3×4÷2) | src/app route tree, ROUTES.md, not-found handlers | OPEN |
| Search mobile filter sidebar overflow and touch usability | 9 (3×5÷1.7) | src/app/search/page.tsx | DONE — RUN 2 |
| SeasonSelector keyboard/ARIA/focus and episode states | 8 (4×4÷2) | src/app/tv/[id]/SeasonSelector.tsx | DONE — source, live keyboard and axe verified |
| Search shared H1/unnamed links and Browse sticky viewport sizing | 8 (4×4÷2) | Search, Navbar/Footer, Browse | DONE — live axe and seven-width checks; contrast incomplete separately |
| Auth/profile bootstrap, account-scoped library, retries and keyboard tabs | 8 (4×5÷2.5) | AuthProvider, profile, cloud.ts, AuthForm, Navbar | DONE — implementation and guest keyboard/touch evidence; Supabase fault injection remains open |
| Public search and season API input validation | 10 (4×5÷2) | src/app/api/search/route.ts, src/app/api/season/route.ts, src/lib/tmdb.ts | DONE — RUN 1 |

## Security audit snapshot — 2026-11-19

- Full `npm audit`: 35 advisory records before dependency classification cleanup (1 low, 13 moderate, 19 high, 2 critical); development-only vulnerabilities remain in the full audit after cleanup.
- `next@14.2.35` is a direct critical/high vulnerability source. npm's automatic fix asks to install `next@16.4.6` and `eslint-config-next@16.4.6`, a breaking framework migration.
- `proxy-addr@2.0.7` critical advisory is transitive through the `shadcn@4.0.0` CLI. CLI is now correctly in dev dependencies, and `npm audit --omit=dev` no longer reports this critical advisory.
- Root PostCSS is now 8.5.33; Next 14 still nests vulnerable PostCSS 8.4.31, which is included in the framework migration blocker.
- After CLI classification cleanup, `npm audit --omit=dev`: 6 findings (1 critical, 4 high, 1 moderate).
- After root PostCSS patch, `npm audit --omit=dev`: 4 findings (1 critical, 2 high, 1 moderate); remaining records are Next.js critical, nested Next PostCSS, picomatch, and postcss-selector-parser.

| Premium application-wide UI/UX redesign, auth presentation, shared skeleton system and cache correctness | 20 (5x5/1.25) | globals.css, Navbar, HeroSection, MovieCard, MovieCarousel, AuthForm, Browse/Search/Profile, skeletons, recommendation route | DONE at source/TypeScript/lint/assertion level; browser/visual/accessibility measurements remain IN_PROGRESS |
| Responsive and rendered-WCAG verification of new UI design | 10 (5x5/2.5) | Navbar, Home, Login/Signup, Browse/Search/Profile, gradients and poster compositions | IN_PROGRESS - existing CDP 9227 has no usable current page target; no screenshot/axe/200% zoom results in this run |
