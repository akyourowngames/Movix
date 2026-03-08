# Movix - Movie & TV Series Streaming Platform 🎬

A modern, feature-rich Hindi movie and web series streaming platform built with Next.js 14, TMDB API, and Tailwind CSS.

## ✨ Features

### Core Features
- 🎥 **Multi-Server Video Player** - 6 different streaming servers with auto-fallback
- 📺 **TV Series Support** - Watch web series with season/episode selector
- 🔍 **Advanced Search** - Real-time search with filters (genre, rating, year, content type)
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- 🎨 **Beautiful UI** - Glassmorphism effects, smooth animations with Framer Motion
- 🌐 **Bilingual** - Hindi and English labels throughout

### Pages
- **Home** - Trending movies and web series with horizontal carousels
- **Browse** - Paginated grid with filtering for movies and TV shows
- **Search** - Advanced search with sidebar filters and content type toggle
- **Movie Details** - Full movie info with cast, similar movies, and player
- **TV Show Details** - Season/episode selector with full show information
- **Profile** - Watchlist, continue watching, favorites, and watch history

### UI/UX Highlights
- Dark theme with golden accents
- Glassmorphism cards and overlays
- Smooth page transitions
- Hover effects and micro-interactions
- Cast section with circular avatars
- Similar content recommendations
- Interactive season/episode selector for TV shows

## 🚀 Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/akyourowngames/Movix.git
   cd Movix
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
   - App Name: Movix
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
- **Fonts:** Playfair Display, DM Sans

## 📁 Project Structure

```
Movix/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Home page
│   │   ├── browse/page.tsx             # Browse movies/TV
│   │   ├── search/page.tsx             # Search with filters
│   │   ├── movie/[id]/page.tsx         # Movie details + player
│   │   ├── tv/[id]/
│   │   │   ├── page.tsx                # TV show details
│   │   │   └── SeasonSelector.tsx      # Season/episode selector
│   │   ├── genre/[id]/page.tsx         # Genre page
│   │   └── profile/page.tsx            # User profile
│   ├── components/
│   │   ├── Navbar.tsx                  # Navigation
│   │   ├── Footer.tsx                  # Footer
│   │   ├── VideoPlayer.tsx             # Multi-server player
│   │   ├── MovieCard.tsx               # Movie/TV card component
│   │   ├── MovieCarousel.tsx           # Horizontal carousel
│   │   └── HeroSection.tsx             # Hero banner
│   └── lib/
│       ├── tmdb.ts                     # TMDB API functions
│       ├── data.ts                     # TypeScript interfaces
│       └── utils.ts                    # Utility functions
└── .env.local                          # API keys (gitignored)
```

## 🎬 Video Streaming

The platform uses 6 different embed servers:
1. **VidSrc XYZ** - Best quality (recommended)
2. **VidSrc CC** - Multi-source
3. **VidLink** - Fast loading
4. **AutoEmbed** - Backup
5. **2Embed** - Fallback
6. **EmbedSu** - Fallback

Users can switch between servers if one doesn't work. The player automatically handles TMDB IDs for both movies and TV shows with season/episode support.

## 📺 TV Series Features

- Season dropdown selector
- Episode grid with thumbnails
- Episode descriptions and air dates
- Current episode info display
- Automatic episode fetching per season
- Seamless playback across episodes

## 🎨 Design Features

- Responsive hero section with auto-rotating featured content
- Glassmorphism effects throughout
- Smooth animations with Framer Motion
- Mobile-first responsive design
- Touch-friendly UI elements
- Optimized image loading

## 📝 License

MIT

## 🙏 Acknowledgments

- Movie and TV data from [TMDB](https://www.themoviedb.org/)
- Icons from [Lucide](https://lucide.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
