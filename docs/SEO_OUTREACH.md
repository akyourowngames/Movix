# CineHindi — SEO & launch playbook

Maintained by **Krish Verma ([@akyourowngames](https://github.com/akyourowngames))**.
Live site: `https://cine-hindi.vercel.app`

This document is the working checklist for getting CineHindi indexed, discovered and shared.
It covers technical SEO already implemented in the codebase, Search Console setup, launch
copy you can post as-is, and a 30-day outreach plan.

---

## 1. Technical SEO already implemented

| Area | Implementation |
| --- | --- |
| Canonical URLs | Per page: `/`, `/browse?...`, `/movie/:id`, `/tv/:id`, `/genre/:id`, `/about` |
| Titles/descriptions | Template `%s \| CineHindi`, unique title + description per title, category and genre |
| Author identity | `authors`, `creator`, JSON-LD `Person` for Krish Verma / akyourowngames, footer credit, About page, `rel="me"` |
| Structured data | `WebSite` + `SearchAction`, `Person`, `Movie`, `TVSeries`, `AggregateRating`, `BreadcrumbList`, `CollectionPage`, `ItemList`, `AboutPage` |
| Social sharing | Dynamic 1200×630 Open Graph and Twitter images, per-title OG artwork |
| Crawling | `robots.txt` with private routes disallowed; `/search`, `/profile`, `/login`, `/signup` are `noindex` |
| Sitemap | Static pages + all 28 category URLs + 200 trending/top-rated movie and TV titles |
| Rendering | Category pages are server-rendered with real titles in the HTML (not an empty client shell) |
| Performance | Direct TMDB-sized images, responsive `sizes`, preconnect, lazy loading, optimized WebP artwork |
| App metadata | Web manifest, SVG icon, theme color, `humans.txt`, package/repo metadata |

### Environment variables

```env
NEXT_PUBLIC_SITE_URL=https://cine-hindi.vercel.app
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=        # optional, from Search Console
```

Set `NEXT_PUBLIC_SITE_URL` to the final custom domain if you move off `vercel.app`.
Canonical URLs, Open Graph URLs, the sitemap and robots all derive from it.

---

## 2. Search Console & indexing (do this first)

1. **Google Search Console** — add a URL-prefix property for `https://cine-hindi.vercel.app`.
   - Verify with the HTML tag method: copy the content token into
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel and redeploy.
2. Submit `https://cine-hindi.vercel.app/sitemap.xml`.
3. **Bing Webmaster Tools** — add the site and import from Google Search Console.
4. Use **URL Inspection → Request indexing** for:
   - `/`
   - `/browse`
   - `/browse?category=bollywood&type=all`
   - `/browse?category=indian-series&type=all`
   - `/browse?category=kdrama&type=all`
   - `/about`
   - 5–10 popular `/movie/:id` and `/tv/:id` pages
5. Re-submit the sitemap after adding or removing major sections.
6. Check **Page indexing → Why pages aren’t indexed** weekly for the first month.

Expected timing: brand queries can appear in a few days; category and long-tail queries take
weeks to months and depend heavily on backlinks and traffic signals.

---

## 3. Positioning & keyword targets

The site is a **cinematic discovery and tracking app**, not a licensed streaming service.
Keep messaging around discovery, watchlists and resume points.

| Intent | Keywords to target |
| --- | --- |
| Brand | `CineHindi`, `cine hindi app`, `Krish Verma developer`, `akyourowngames` |
| Category | `Bollywood movie discovery`, `Indian web series list`, `K-drama catalogue`, `anime movie catalogue` |
| Long tail | `[movie name] cast and where to watch`, `best Hindi web series 2026`, `best action movies to stream`, `K-dramas like [show]` |
| Product | `movie watchlist app`, `sync watch history across devices`, `resume TV episodes app` |

On-page title patterns already in place:

- `Movie Name (Year) — Synopsis, Cast & Streaming | CineHindi`
- `Web Series Name (Year) — Seasons, Cast & Streaming | CineHindi`
- `Bollywood — Movies | CineHindi`
- `K-Dramas — Movies & Series | CineHindi`

---

## 4. Ready-to-post launch copy

Replace links only if you move to a custom domain. Always disclose that you built it.

### Product Hunt

**Name:** CineHindi
**Tagline:** A cinematic way to discover and track movies & series
**Description:**
> CineHindi is a dark, cinema-first discovery app for Bollywood, Hollywood, Indian web
> series, K-dramas and anime. Browse 28 curated categories, build a watchlist, keep episode
> resume points in sync, and get recommendations tuned to what you actually watch. Guests
> can browse instantly; accounts are optional and sync across devices.

**First comment:**
> Hi Product Hunt! I built CineHindi because most “what should I watch” flows feel like
> spreadsheets. This one looks and feels like a cinema lobby: curated rows, a ticket-style
> sign-in, and a library that remembers where you stopped. It is a portfolio project built
> with Next.js, TypeScript, Supabase and TMDB. I would love feedback on the browse and
> resume flows — and on which categories you want next.

### Show HN

**Title:** Show HN: CineHindi – a cinematic discovery app with synced watchlists
**Body:**
> I built CineHindi as a portfolio project: a Next.js 14 app for discovering Indian and
> global film/series titles. It has 28 curated categories, server-rendered category pages,
> optional Supabase accounts, a guest-first local library that merges into the account on
> first sign-in, episode-level resume, and a recommendation row built from genre affinity
> and recency. The UI is intentionally editorial rather than dashboard-like.
>
> Tech: Next.js App Router, TypeScript, Tailwind, Framer Motion, Supabase/Postgres with RLS,
> TMDB. Happy to answer questions about the auth sync or the recommendation scoring.

### Reddit (adapt to each community’s rules)

- `r/SideProject`: “I built a cinema-style movie discovery app with synced watchlists”
- `r/webdev`: “Showoff Saturday: Next.js + Supabase movie discovery app”
- `r/reactjs`: focus on the server-rendered category pages and guest→account data merge
- `r/india` / `r/bollywood`: focus on the Bollywood / Indian series category experience;
  read the self-promotion rules first and post as a discussion, not a link drop.

Do not post the same link to many subreddits on the same day. Lead with the problem and ask
for feedback.

### X / Twitter thread

1. I built CineHindi — a cinema-first way to discover and track movies & series.
2. 28 curated categories: Bollywood, Indian web series, South Indian, Hollywood, K-dramas,
   anime + 18 genres. Category pages are server-rendered and shareable.
3. Guests get a full library on-device. Sign in and it merges into a Supabase-backed library
   with watch history, watchlist and episode resume.
4. The auth flow is a literal cinema ticket. The home page is a stage. The whole thing is
   Next.js + TypeScript + Tailwind.
5. Live: cine-hindi.vercel.app — feedback on the browse/resume flows is very welcome.
   Built by @akyourowngames.

### LinkedIn

> I just shipped CineHindi, a portfolio project exploring how a streaming catalogue can feel
> like cinema instead of a spreadsheet. It combines a curated discovery experience (28
> categories, personal rows) with optional accounts, a guest-to-cloud library merge, and
> episode-level resume. Built with Next.js, TypeScript, Supabase and TMDB. I wrote up the
> architecture and would appreciate feedback from product and frontend folks.

### Dev.to / Hashnode article ideas

1. “Guest-first data on a streaming app: merging localStorage into Supabase without losing user data.”
2. “Server-rendering filterable catalogue pages in Next.js 14 without giving up instant client filters.”
3. “Designing a cinema-ticket auth flow that is still accessible.”

Publish the article on your own domain or Dev.to and link back to CineHindi in the author bio
and a contextual paragraph. Use a canonical URL if cross-posting.

---

## 5. Backlink & listing checklist

- [ ] GitHub repository description, homepage URL and topics:
      `nextjs`, `react`, `typescript`, `tmdb`, `supabase`, `movie-app`, `streaming-ui`
- [ ] Add CineHindi to your GitHub profile README and portfolio.
- [ ] Vercel community / Next.js showcase / “Built with Next.js” directories.
- [ ] Product Hunt launch.
- [ ] Peerlist, Indie Hackers, MicroLaunch, Uneed (choose relevant ones; avoid link farms).
- [ ] DEV / Hashnode articles linking to the live app.
- [ ] Add the project to your LinkedIn Featured section and X bio.
- [ ] Ask 3–5 developer friends for honest feedback (not reciprocal link swaps).

Quality over quantity: one relevant, editorial backlink is worth more than dozens of
directory profiles.

---

## 6. Outreach templates

### To a newsletter or curator

> Subject: A cinematic movie-discovery app for your next issue
>
> Hi [Name],
>
> I’m Krish, a full-stack developer. I built CineHindi
> (https://cine-hindi.vercel.app), a Next.js app for discovering Bollywood, Hollywood,
> Indian series, K-dramas and anime. It has a ticket-style auth flow, a guest-to-cloud
> library merge and episode-level resume.
>
> If your readers like product design or Next.js case studies, I’d be glad to share the
> architecture decisions or provide screenshots. No pressure at all — happy to answer
> questions either way.
>
> Thanks,
> Krish Verma (akyourowngames)
> https://github.com/akyourowngames

### To a creator / reviewer

> Hi [Name], I saw your piece on [specific topic] and thought CineHindi might be relevant:
> it’s a cinema-first discovery app with synced watchlists and resume. Here’s a 30-second
> walkthrough: [link]. I’m the developer, so I can answer anything about the build. Would
> you like screenshots or a short demo?

Rules: personalise every message, mention the specific work you liked, never send bulk DMs,
and never ask for a link without offering something useful.

---

## 7. 30-day plan

| Days | Focus |
| --- | --- |
| 1–2 | Search Console + Bing verification, submit sitemap, request indexing for 10 key URLs |
| 3–5 | GitHub repo polish (description, topics, homepage, social preview), portfolio + LinkedIn featured |
| 6–10 | Publish a technical article on guest→cloud sync; cross-post with canonical links |
| 11–14 | Product Hunt launch (Tuesday–Thursday); prepare screenshots and a first comment |
| 15–18 | Reddit / Indie Hackers / Peerlist posts, spaced out and tailored |
| 19–23 | Outreach to 5 relevant newsletters/creators with personalised notes |
| 24–30 | Review Search Console queries, update titles/descriptions for pages with impressions but low CTR, publish one more article |

---

## 8. Measurement

- **Search Console:** impressions, clicks, average position, indexed pages, Core Web Vitals.
- **Bing Webmaster:** crawl errors and keyword performance.
- **Vercel Analytics / Plausible:** referrers, top pages, countries.
- **Brand checks:** search “CineHindi”, “Krish Verma CineHindi”, “akyourowngames movie app”.
- Add UTM parameters to campaign links (e.g. `?utm_source=producthunt&utm_medium=launch`)
  but keep canonical URLs clean.

## 9. Guardrails

- Disclose that you built the product.
- Follow each community’s self-promotion rules; do not spam or use engagement pods.
- Do not make claims about licensed streaming availability; describe the product as a
  discovery and tracking app powered by TMDB.
- Keep private/auth pages out of the index (already configured).
- Never buy backlinks or use link farms.
