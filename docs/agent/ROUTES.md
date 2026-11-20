# Route and Component Inventory

## App routes

| Route | Rendering | Main responsibility |
|---|---|---|
| `/` | Static | Home feed, hero, carousels, personal recommendations |
| `/browse` | Static | Category and media browsing with pagination |
| `/search` | Static shell + client search | Search, desktop filters, mobile filter sheet, local filters |
| `/movie/[id]` | Dynamic | Movie details and playback |
| `/tv/[id]` | Dynamic | TV details, season/episode selection and playback |
| `/genre/[id]` | Dynamic | Genre listing |
| `/profile` | Static shell + client profile | Watchlist, history, profile settings |
| `/login` | Static | Sign-in |
| `/signup` | Static | Account registration |
| `/auth/callback` | Dynamic route handler | Supabase auth callback |

## API routes

The root `src/app/not-found.tsx` is Next.js special not-found UI, not a public `/not-found` URL. The build emits its internal `/_not-found` entry.

| Route | Responsibility |
|---|---|
| `GET /api/catalog` | Category/media catalog pagination |
| `GET /api/search` | Search movies and TV |
| `GET /api/season` | TV season episodes |
| `GET /api/recommend` | Personalized recommendations |

## Route-local loading and error boundaries

| Route segment | Loading UI | Error boundary | Notes |
|---|---|---|---|
| `/movie/[id]` | `loading.tsx` | `error.tsx` | Dynamic movie details/playback |
| `/tv/[id]` | `loading.tsx` | `error.tsx` | Dynamic show details/episodes/playback |
| `/genre/[id]` | `loading.tsx` | `error.tsx` | Dynamic genre catalog |

Other route segments use the root-level `app/not-found.tsx`; no route-local loading/error file was found for Search, Browse, Profile, Login, Signup or Auth callback.

## Shared components

- Shell: `Navbar`, `Footer`, `AuthProvider`, `AuthForm`.
- Discovery: `HeroSection`, `MovieCarousel`, `MovieCard`, `PersonalRows`, `DetailSkeleton`.
- Playback: `VideoPlayer`, `HLSPlayer`, `TrackView`, `SeasonSelector`.
- UI primitives: `src/components/ui/*` (button, badge, card, dialog, input, avatar).
- Data/auth: `src/lib/tmdb.ts`, `catalog.ts`, `homeFeed.ts`, `recommend.ts`, `cloud.ts`, `profileActions.ts`, `streamApi.ts`, `src/lib/supabase/*`.

## Runtime and design notes

- Framework: Next.js 14.2.35 App Router, React 18.3.1, TypeScript, Tailwind CSS.
- Deployment identity: Vercel project metadata exists at `.vercel/project.json`; Railway documentation appears associated with the separate 8Stream service. Actual production Node runtime remains unconfirmed.
- Build: `npm run build`; typecheck: `npx tsc --noEmit`; lint: `npm run lint`.
- Design tokens: CSS custom properties in `src/app/globals.css`, mapped through `tailwind.config.ts`; no standalone tokens file exists.
- Theme: root document is explicitly dark. No light theme token set or toggle exists.
- Live Chromium widths: Movie, TV, Genre, Browse, Search, Profile, Login and Signup checked at 320, 375, 414, 768, 1024, 1440 and 1920 CSS px; Home checked at 320 and 1440 only. Intentional horizontal rails were tested separately for reachability.
- API route handlers: `/api/catalog`, `/api/recommend`, `/api/search`, `/api/season`; input/healthy response and provider failure semantics are summarized in RUN 1/RUN 3 findings. Forced upstream outage tests remain pending.
- Player distinction: `/movie/[id]` and `/tv/[id]` currently render the external multi-provider `VideoPlayer` iframe flow. `HLSPlayer` is a separate custom component and is not wired into those routes in the current source tree; test and report those two player implementations separately.
- Analytics/error tracking: not located during the audit.

## HTTP status regression evidence � 2026-11-20

- Live production server checks: `/movie/not-a-number`, `/movie/0`, `/movie/999999999`, `/tv/not-a-number`, `/tv/0`, `/tv/999999999`, `/genre/not-a-number`, and `/genre/99999` all returned HTTP 200 while the HTML response contains `NEXT_NOT_FOUND` and `noindex` metadata.
- Valid `/movie/550`, `/tv/1396`, and `/browse` return HTTP 200.
- Installed Next 14.2.35 renderer applies 404 when the not-found sentinel is caught, but response headers are already committed for these dynamic routes. A safe architecture-level fix remains OPEN; do not mislabel upstream provider failures as not-found.

## RUN 9 layout/loading changes - 2026-11-20

- Home (`/`): shared shell hero/carousel composition tightened; hero no longer relies on negative 128px overlap to position first row; card poster geometry and metadata hierarchy changed. Existing server feed revalidation remains 900 seconds.
- Browse (`/browse`): shared `page-shell`, roomier six-column large-screen grid and shared poster skeleton component.
- Search (`/search`): shared `page-shell`, coherent search/filter surfaces and shared result skeleton component. Existing client query cache remains five minutes and query-specific.
- Profile (`/profile`): shared `page-shell`, refined stat panels and shared skeleton surface/poster ratio; cloud/account isolation unchanged.
- Login/Signup: shared `AuthForm` split editorial/credential layout; Supabase auth handler, safe local `next` and callback flow unchanged. Actual submission not browser-tested in RUN 9.
- Shared Navbar, HeroSection, MovieCard, MovieCarousel and PersonalRows updated for new spacing/type/animation direction. `MediaSkeleton`/`HeroSkeleton` added; only MediaSkeleton wired to existing data loading components in this run.
- `GET /api/recommend`: upstream failure now 503/no-store. Success remains public-cache; no-personalization remains a distinct normal empty state. Other API route cache policy unchanged.
