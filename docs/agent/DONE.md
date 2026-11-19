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
