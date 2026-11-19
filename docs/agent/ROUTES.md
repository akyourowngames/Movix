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
| `/_not-found` | Static | Not-found page |

## API routes

| Route | Responsibility |
|---|---|
| `GET /api/catalog` | Category/media catalog pagination |
| `GET /api/search` | Search movies and TV |
| `GET /api/season` | TV season episodes |
| `GET /api/recommend` | Personalized recommendations |

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
- Search screen responsive breakpoints browser-checked at 320, 375, 414, 768, 1024, 1440 and 1920 CSS px.
- Analytics/error tracking: not located during the audit.
