# CineHindi - Movie Streaming Platform 🎬

A modern, feature-rich Hindi movie streaming platform built with Next.js 14, TMDB API, Stitch UI designs, and Tailwind CSS.

## ✨ Features

### Core Features
- 🎥 **Multi-Server Video Player** - 5 different streaming servers with auto-fallback
- 🔍 **Advanced Search** - Real-time search with filters (genre, rating, year)
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- 🎨 **Beautiful UI** - Glassmorphism effects, smooth animations with Framer Motion
- 🌐 **Bilingual** - Hindi and English labels throughout

### Pages
- **Home** - Trending and new releases with horizontal carousels
- **Browse** - Paginated movie grid with filtering
- **Search** - Advanced search with sidebar filters
- **Movie Details** - Full movie info with cast, similar movies, and player
- **Profile** - Watchlist, continue watching, favorites, and watch history

### UI/UX Highlights
- Dark theme with golden accents
- Glassmorphism cards and overlays
- Smooth page transitions
- Hover effects and micro-interactions
- Progress bars for continue watching
- Cast section with circular avatars
- Similar movies recommendations

## 🚀 Setup

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd cinehindi
   npm install
   ```

2. **Add TMDB API key to `.env.local`:**
   ```env
   NEXT_PUBLIC_TMDB_KEY=your_api_key_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 🔑 Getting TMDB API Key

1. Go to [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Create an account and verify email
3. Go to Settings → API
4. Request API key (Developer)
5. Fill the form:
   - App Name: CineHindi
   - App URL: http://localhost:3000
   - Summary: Personal movie streaming site
6. Copy your API key to `.env.local`

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **UI Components:** shadcn/ui
- **API:** TMDB (The Movie Database)
- **Design:** Stitch AI-generated UI

## 📁 Project Structure

```
cinehindi/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── browse/page.tsx       # Browse movies
│   │   ├── search/page.tsx       # Search with filters
│   │   ├── movie/[id]/page.tsx   # Movie details + player
│   │   └── profile/page.tsx      # User profile
│   ├── components/
│   │   ├── Navbar.tsx            # Navigation
│   │   ├── Footer.tsx            # Footer
│   │   ├── VideoPlayer.tsx       # Multi-server player
│   │   ├── MovieCard.tsx         # Movie card component
│   │   └── MovieCarousel.tsx     # Horizontal carousel
│   └── lib/
│       ├── tmdb.ts               # TMDB API functions
│       └── data.ts               # TypeScript interfaces
└── .env.local                    # API keys (gitignored)
```

## 🎬 Video Streaming

The platform uses 5 different embed servers:
1. vidsrc.xyz
2. vidsrc.to
3. vidsrc.me
4. multiembed.mov
5. 2embed.cc

Users can switch between servers if one doesn't work. The player automatically handles TMDB and IMDB IDs.

## 🎨 Design Credits

UI designs generated using [Google Stitch](https://stitch.withgoogle.com/) - AI-powered UI design tool.

## 📝 License

MIT

## 🙏 Acknowledgments

- Movie data from [TMDB](https://www.themoviedb.org/)
- UI designs from [Google Stitch](https://stitch.withgoogle.com/)
- Icons from [Lucide](https://lucide.dev/)
