# UI/UX and Security Backlog

Scores use impact × confidence ÷ effort, with each input from 1–5. Status values: OPEN, IN_PROGRESS, BLOCKED, DONE.

| Finding | Score | Location | Status |
|---|---:|---|---|
| Patch critical Next.js 14 vulnerabilities; requires a supported major migration to patched Next 15.5.29 / React 19 and compatibility validation | 15 (5×5÷~1.7) | package.json, package-lock.json, App Router, middleware, auth, Vercel runtime | BLOCKED |
| Move `shadcn` CLI out of production dependencies to remove development-only Express/Hono/MCP tree from production audit | 12 (4×5÷1.7) | package.json, package-lock.json | DONE — verified follow-on |
| Patch root PostCSS 8.5.8 to 8.5.33; Next 14 nested PostCSS still requires framework migration | 8 (3×5÷2) | package.json, package-lock.json | DONE — follow-on |
| Season selector dropdown lacks keyboard dismissal, ARIA expanded state, and managed focus | 8 (4×4÷2) | src/app/tv/[id]/SeasonSelector.tsx | IN_PROGRESS — implementation done, live browser verification blocked |
| Search page overall axe audit: missing H1 and four unnamed links in shared app content | 8 (4×4÷2) | src/app/search/page.tsx, Navbar/Footer shared links | OPEN |
| Browse page has fixed viewport height arithmetic in sticky sidebar | 6 (3×4÷2) | src/app/browse/page.tsx | OPEN |
| Full route screenshot/state sweep and Lighthouse coverage across all routes | 5 (3×5÷3) | all routes | OPEN |
| Review auth profile bootstrap errors and async sync lifecycle | 5 (3×5÷3) | src/components/AuthProvider.tsx | OPEN |
| Search mobile filter sidebar overflow and touch usability | 9 (3×5÷1.7) | src/app/search/page.tsx | DONE — RUN 2 |
| Public search and season API input validation | 10 (4×5÷2) | src/app/api/search/route.ts, src/app/api/season/route.ts, src/lib/tmdb.ts | DONE — RUN 1 |

## Security audit snapshot — 2026-11-19

- Full `npm audit`: 35 advisory records before dependency classification cleanup (1 low, 13 moderate, 19 high, 2 critical); development-only vulnerabilities remain in the full audit after cleanup.
- `next@14.2.35` is a direct critical/high vulnerability source. npm's automatic fix asks to install `next@16.4.6` and `eslint-config-next@16.4.6`, a breaking framework migration.
- `proxy-addr@2.0.7` critical advisory is transitive through the `shadcn@4.0.0` CLI. CLI is now correctly in dev dependencies, and `npm audit --omit=dev` no longer reports this critical advisory.
- Root PostCSS is now 8.5.33; Next 14 still nests vulnerable PostCSS 8.4.31, which is included in the framework migration blocker.
- After CLI classification cleanup, `npm audit --omit=dev`: 6 findings (1 critical, 4 high, 1 moderate).
- After root PostCSS patch, `npm audit --omit=dev`: 4 findings (1 critical, 2 high, 1 moderate); remaining records are Next.js critical, nested Next PostCSS, picomatch, and postcss-selector-parser.
