# Agent State

- Current focus: SeasonSelector accessibility cluster implemented and build-verified; interactive browser verification is blocked by unavailable live TV data/TMDB configuration.
- Latest completed iteration: 2026-11-19, RUN 2, two dependency cleanups, and SeasonSelector accessibility implementation.
- In-progress work: none.
- High-priority security issue: Next.js 14.2.35 is affected by current critical advisories. There is no patched 14.x version; candidate upgrade is Next.js 15.5.29 with React 19 and a compatibility migration. Do not force-install Next.js 16 or apply broad automatic audit fixes.
- Completed dependency cleanup: moved `shadcn` CLI from `dependencies` to `devDependencies`. Lockfile now marks both `shadcn@4.0.0` and its `proxy-addr@2.0.7` child as dev-only. Production audit dropped 26 findings / 2 critical to 6 findings / 1 critical. Full audit still contains the dev-only advisories.
- Completed compatible dependency patch: root PostCSS moved from 8.5.8 to 8.5.33. Next.js 14.2.35 still nests PostCSS 8.4.31; only framework migration removes this final PostCSS production advisory.
- Latest production audit: 4 records (1 critical Next.js, 2 high, 1 moderate); `npm audit --omit=dev` exits 1 while these known issues remain.
- Browser validation: production Chromium verified /search at 320, 375, 414, 768, 1024, 1440, and 1920 CSS px with no horizontal overflow. Mobile sheet keyboard path and focus restoration passed. Axe scoped to sheet reported zero violations. Overall page has existing missing-H1 and unnamed-link violations.
- Known tooling limitation: Lighthouse was not available. Project has no Playwright/Puppeteer test runner or existing automated tests. Existing app currently has only a dark theme; light/dark comparison is not meaningful until a light theme is implemented.
- Working-tree note: extensive pre-existing uncommitted user changes were present before RUN 2. Preserve them; do not reset, stash, or broadly stage. No branch/commit made because the base branch is dirty with unrelated user changes.
- Next focus: once a valid TMDB environment is available, run live TV page keyboard/axe verification; then fix shared shell H1/unnamed links and inspect browse viewport sizing.
