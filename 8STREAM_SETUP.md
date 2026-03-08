# 8StreamApi Integration Setup Guide

## Overview
8StreamApi has been integrated as Server 1 (primary server) in your CineHindi streaming site. It provides:
- ⚡ Direct HLS streams (no ads, no popups)
- 🎯 Multiple audio tracks (Hindi, English, Tamil, Telugu, Bengali)
- 🎬 4K quality support
- 📱 Custom video player with full controls

## Step 1: Deploy 8StreamApi to Railway

### Option A: Using the cloned repository (Recommended)

1. **Push to your GitHub:**
   ```bash
   cd stream8apii
   git remote set-url origin https://github.com/YOUR_USERNAME/8StreamApi.git
   git push -u origin main
   ```

2. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked `8StreamApi` repository
   - Railway will auto-detect Node.js and deploy
   - Wait 2-3 minutes for deployment

3. **Get your URL:**
   - Click on your project in Railway
   - Go to "Settings" → "Domains"
   - Copy the generated URL (e.g., `https://8streamapi-production.up.railway.app`)

### Option B: Fork the original repository

1. Go to https://github.com/himanshu8443/8StreamApi
2. Click "Fork" button (top right)
3. Follow steps 2-3 from Option A above

## Step 2: Configure Environment Variable

1. Open `.env.local` in your project root
2. Replace the placeholder URL with your Railway URL:
   ```env
   NEXT_PUBLIC_8STREAM_URL=https://your-actual-railway-url.up.railway.app
   ```

## Step 3: Test Locally

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the integration:**
   - Go to any movie page (e.g., http://localhost:3000/movie/tt1877830)
   - Server 1 (8Stream 🎯) should appear with a lightning bolt icon
   - Click it to load the HLS stream
   - You should see "Fetching Hindi stream..." then the custom video player

## Step 4: Deploy to Vercel

1. **Add environment variable to Vercel:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_8STREAM_URL` = `your-railway-url`
   - Apply to: Production, Preview, Development

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Add 8StreamApi integration"
   git push
   ```

## Features Implemented

### 1. Custom HLS Player (`src/components/HLSPlayer.tsx`)
- ✅ HLS.js integration for .m3u8 playback
- ✅ Custom controls (play/pause, seek, volume, fullscreen)
- ✅ Quality selector (auto, 1080p, 720p, 480p, etc.)
- ✅ Playback speed control (0.5x to 2x)
- ✅ Keyboard shortcuts (Space, Arrow keys, F, M)
- ✅ Auto-hide controls after 3 seconds
- ✅ Loading and error states
- ✅ Mobile-friendly touch controls
- ✅ Dark theme with gold accent (#F5A623)

### 2. Stream API Library (`src/lib/streamApi.ts`)
- ✅ `getMediaInfo(imdbId)` - Fetch available audio tracks
- ✅ `getStreamUrl(file, key)` - Get actual m3u8 URL
- ✅ `getHindiStream(imdbId, type)` - Main function (auto-selects Hindi)
- ✅ Error handling and fallbacks

### 3. Updated VideoPlayer (`src/components/VideoPlayer.tsx`)
- ✅ 8Stream as Server 1 with special badge
- ✅ Auto-fallback to Server 2 if 8Stream fails
- ✅ Skip 8Stream if no IMDB ID available
- ✅ Loading state: "Fetching Hindi stream..."
- ✅ Quality banner showing language and features

### 4. Movie & TV Pages Updated
- ✅ Pass `imdbId` prop to VideoPlayer
- ✅ Works for both movies and TV shows

## How It Works

1. **User clicks Server 1 (8Stream)**
2. **VideoPlayer fetches stream:**
   - Calls `getHindiStream(imdbId, 'movie')`
   - API returns playlist with audio tracks
   - Selects Hindi track (or first available)
   - Gets m3u8 URL from 8StreamApi
3. **HLSPlayer renders:**
   - Loads m3u8 with HLS.js
   - Shows custom controls
   - Supports quality switching
4. **If fails:**
   - Auto-fallback to Server 2 (VidSrc CC)
   - User sees error briefly, then next server loads

## Troubleshooting

### Server 1 not showing
- **Cause:** No IMDB ID available for this movie/show
- **Solution:** TMDB doesn't have IMDB ID linked. Use other servers.

### "Fetching Hindi stream..." stuck
- **Cause:** Railway URL not configured or wrong
- **Solution:** Check `.env.local` has correct Railway URL

### Stream fails to load
- **Cause:** 8StreamApi doesn't have this content
- **Solution:** Auto-fallback will switch to Server 2

### CORS errors in console
- **Cause:** Railway needs CORS headers
- **Solution:** This is normal for HLS streams, player handles it

### Video player shows but won't play
- **Cause:** Browser doesn't support HLS
- **Solution:** HLS.js handles this automatically (works on all modern browsers)

## Server Priority

1. **Server 1 (8Stream)** - Best quality, Hindi audio, no ads
2. **Server 2 (VidSrc CC)** - Reliable fallback, works in India
3. **Server 3 (LetsEmbed)** - Hindi dub option
4. **Servers 4-8** - Additional fallbacks

## API Endpoints Used

### 1. Get Media Info
```
GET https://your-railway-url/api/v1/mediaInfo?id=tt1877830
```
Returns: Available audio tracks (Hindi, English, etc.)

### 2. Get Stream URL
```
POST https://your-railway-url/api/v1/getStream
Body: { file: "...", key: "..." }
```
Returns: m3u8 playlist URL

## Notes

- 8StreamApi is free and open-source
- Railway free tier: 500 hours/month (enough for testing)
- For production, consider Railway Pro ($5/month) for better uptime
- The API fetches from multiple sources, availability varies by content
- Always have fallback servers (already implemented)

## Support

If you encounter issues:
1. Check Railway logs for API errors
2. Check browser console for client errors
3. Verify IMDB ID exists for the movie/show
4. Test with a known working IMDB ID (e.g., tt1877830 - The Batman)

## Credits

- 8StreamApi: https://github.com/himanshu8443/8StreamApi
- HLS.js: https://github.com/video-dev/hls.js
