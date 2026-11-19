# Agent Decisions

- Treat all uncommitted changes predating the current focused iteration as user-owned. Do not reset, stash, broad-format, or broadly stage them.
- Run 1 API query hardening is complete. Do not redo it without regression evidence.
- RUN 2 selects the mobile search/filter cluster because the permanent 18rem sidebar and horizontal flex layout were directly observed in the current UI. The mobile sheet and desktop rail render the same local filter state through a shared JSX fragment.
- The mobile sheet manually implements Escape dismissal, Tab trapping, focus restoration, and background scroll lock. Sheet transition duration is zero when `prefers-reduced-motion` is enabled.
- Search query UI limit matches the server 100-character bound from RUN 1.
- The app currently supports only dark theme; no fake light-mode visual comparison should be reported.
- `shadcn` is a UI generation CLI used by development rather than runtime imports; it was moved to `devDependencies` and the production audit confirmed its vulnerable transitive tree is excluded from production installs.
- The direct PostCSS dependency was moved to `^8.5.33` (same major, Node engine-compatible) and the lockfile updated. Leave Next 14's nested PostCSS 8.4.31 for the framework migration rather than adding an unverified npm override.
- Don't use `npm audit fix --force`; Next.js and eslint-config-next currently resolve to 16.4.6 with that option.
- Candidate framework migration path: Next.js 15.5.29 with React 19, followed by middleware/auth, Next server and Vercel runtime validation. Keep it blocked until runtime/build assumptions are confirmed and migration is testable.
- Search query parameters are encoded at the provider URL boundary with `URLSearchParams`.
- Public API validation failures return 400 and `Cache-Control: no-store`.
- Season 0 remains accepted because TMDB uses it for specials, even though the current selector filters it out in the UI.
- Agent run records live in `docs/agent/` and are updated after each iteration.
