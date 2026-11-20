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
- Current migration target from npm audit: Next 16.4.6 plus matching eslint-config-next 16.4.6 and ESLint 9. Next 15.5.29 remains in the current critical advisory range and is not a safe endpoint. Next 16 peers permit React 18.2+ or React 19; keep React 18 only if the real package graph and app behavior validate it.
- Migrate only in an isolated worktree after the Vercel production Node/build settings are confirmed. Replace the removed `next lint` script with compatible direct ESLint 9 invocation/config and audit App Router, middleware, images, cache, Supabase SSR and callback behavior.
- Contrast: keep the dark-only design and shared 72% neutral muted foreground for flat surfaces. Do not claim WCAG AA for image/gradient compositions until composited rendered colors and interactive states are measured.
- Route inventory must be reconciled from `src/app`; route-local loading/error boundaries currently exist for Movie, TV and Genre, with a root `not-found.tsx`.
- Search query parameters are encoded at the provider URL boundary with `URLSearchParams`.
- Public API validation failures return 400 and `Cache-Control: no-store`.
- Season 0 remains accepted because TMDB uses it for specials, even though the current selector filters it out in the UI.
- Agent run records live in `docs/agent/` and are updated after each iteration.

- Next 14.2.35 streamed App Router pages can commit HTTP 200 before `notFound()` is raised after awaited data. Do not add middleware status rewriting, force a 404 for all detail errors, remove route loading boundaries, or introduce a request-global result cache as a workaround. A future fix must decide resource existence before the first HTML byte, reuse request-scoped data safely, preserve valid-page metadata/loading/error UX and distinguish provider outages.
- HLS settings content is a labelled `role="group"`, not a dialog. Its trigger must not expose `aria-haspopup="dialog"`; focused/open settings must keep controls mounted and visible regardless of auto-hide timing.
- External streaming provider reliability must not be inferred from a provider iframe document `load` event. Do not show “tested/reliable” labels or green reliability markers without controlled playback evidence; explicitly distinguish provider-page load from actual video playback.

- CineHindi visual direction: dark charcoal base and restrained gold accent; prefer editorial artwork hierarchy, typography and spacing over decorative blur, global glow/noise, animated title shimmer or permanent hover overlays. Shared layout utilities should define content gutters; cards retain poster-first 2:3 geometry.
- Authentication routes share a split editorial/form presentation. Preserve Supabase methods, account isolation, auth session-race logic and same-origin `safeNext` when editing visual presentation. Password visibility remains an explicit user-controlled toggle; autocomplete attributes are context-specific.
- Public TMDB/catalog content may use documented TTLs and stale-while-revalidate. User library/profile state remains user-scoped/private and must not enter shared response caches. Recommendation provider failure is 503/no-store; no-personalization is a distinct normal empty response; only successful data is cacheable.
- Reusable skeletons must match actual poster/detail aspect ratios, expose status/busy semantics and honor reduced motion; failure/error and empty states must remain distinct and retryable.
