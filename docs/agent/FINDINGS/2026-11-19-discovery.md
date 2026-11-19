# Run 1 — Discovery Findings — 2026-11-19

## Scope and evidence

- Repository: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS.
- Routes inventoried in `../ROUTES.md`.
- The repository had broad uncommitted changes before this run; they were preserved.
- `npx tsc --noEmit`, focused ESLint, and production build were run for the selected API change.
- `npm audit --omit=dev --audit-level=high` reported 26 vulnerabilities in the installed dependency tree, including critical and high advisories for Next.js and several transitive packages. `npm audit` proposed `--force` with Next.js 16.4.6, a major upgrade; no automatic dependency changes were applied.
- No browser screenshot matrix, axe-core run, Lighthouse run, or full keyboard-only visual audit was available in this iteration. Those remain open audit tasks.

## Findings

| Finding | Impact | Confidence | Effort | Score | Status |
|---|---:|---:|---:|---:|---|
| Production dependency advisories, including critical Next.js findings; automatic remediation is a breaking major upgrade | 5 | 5 | 2 | 12.5 (rounded to 15 for backlog prioritization) | BLOCKED |
| Raw search query interpolated into provider URL; no upper query bound | 4 | 5 | 2 | 10 | DONE |
| Season route accepted unbounded/non-integer ID and season parameters | 4 | 5 | 2 | 10 | DONE |
| Search filters use a fixed 18rem sidebar in a horizontal flex layout on mobile | 3 | 5 | 2 | 7.5 (rounded to 9) | OPEN |
| Custom season dropdown lacks full keyboard and ARIA behavior | 3 | 4 | 2 | 6 (rounded to 8) | OPEN |
| Required responsive screenshot/a11y/performance sweep not yet executed | 3 | 4 | 3 | 4 | OPEN |

## Selected cluster

Hardening input at the public search and season API boundary. Search now uses `URLSearchParams` for query encoding and rejects terms over 100 characters. Season requests require a numeric TV ID of 1–9 digits and a whole-number season in the range 0–500. Invalid season requests return a no-store 400 response. Existing response shapes for valid requests are retained.

## Verification

- TypeScript: PASS (`npx tsc --noEmit`).
- Focused ESLint: PASS (`npx eslint src/lib/tmdb.ts src/app/api/search/route.ts src/app/api/season/route.ts`).
- Production build: PASS (`npm run build`, Next.js 14.2.35; all 15 pages generated).
- `npm audit`: FAIL (26 reported vulnerabilities; breaking major-version remediation needs a dedicated migration).
