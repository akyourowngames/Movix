# Open Questions and Blocked Work

## BLOCKED — Next.js critical dependency migration

- Installed: `next@14.2.35`, `eslint-config-next@14.2.35`, `react@18.3.1`, `react-dom@18.3.1`, `@types/react@18`, `@types/react-dom@18`.
- Audit finding: current Next.js 14.2.35 is in affected range for critical and high Next.js advisories. npm's `audit fix --force` resolves `next@16.4.6` and `eslint-config-next@16.4.6`, which is a direct major jump and should not be applied blindly.
- Candidate target: `next@15.5.29` and matching `eslint-config-next@15.5.29` are a smaller supported major migration path with current patched 15.x security fixes. Next.js 15 App Router migration requires React 19 and updated React type packages, so this still changes the React runtime.
- Concrete migration plan:
  1. Confirm production Node runtime and Vercel build/install settings (the local environment uses Node 24.16.0; Supabase JS 2.119.0 has Node `>=22`, but deployment runtime has not been confirmed).
  2. Create a clean migration branch/worktree from the committed base when the pre-existing user-owned changes have been preserved or committed by their owner.
  3. Upgrade `next` and `eslint-config-next` together to 15.5.29; upgrade React, React DOM, and both React type packages to compatible React 19 versions.
  4. Audit Next 15 breaking changes in App Router APIs, async request APIs, caching defaults, metadata, middleware runtime, `next/image`, font handling and build output.
  5. Validate Supabase SSR/client and auth callback, cookie refresh, login/signup, all routes, `next lint` script replacement, TypeScript, production build, Vercel deploy/preview, then run npm audit.
  6. If a 15.x package or transitive advisory still blocks remediation, evaluate Next 16 in a separate staged upgrade rather than using `npm audit fix --force`.
- No fixed Next 14.x release was identified for the current critical set. Keep this BLOCKED with score 15 until a controlled migration branch and deployment runtime are confirmed.

## Routine next steps — no user decision required

- Completed: `shadcn` CLI moved to `devDependencies`; its `proxy-addr` vulnerability is now dev-only, and production audit reduced from 26 to 6 findings.
- Completed: root PostCSS dependency patched to 8.5.33. Nested Next.js PostCSS 8.4.31 remains until framework upgrade.
- Upgrade direct/root PostCSS 8.5.8 to patched 8.5.33. Note Next 14's nested PostCSS 8.4.31 remains vulnerable until framework migration.

## Product and environment questions

- Is an edge-level rate limiter configured at Vercel for the public API routes? No application-level rate limiting was found in the source audit.
- Which analytics and error-tracking products, if any, are configured in production?
- A light theme token set does not exist; current browser comparisons cover dark only.
- Lighthouse is not installed; browser screenshot/axe was performed with local Chromium and axe-core instead.
