# Testing 8StreamApi Integration Locally

## ✅ Setup Complete!

Both servers are now running:
- **8StreamApi**: http://localhost:5001
- **CineHindi**: http://localhost:3000

## How to Test

### 1. Open Your Browser
Go to: **http://localhost:3000**

### 2. Navigate to a Movie
Try one of these test movies (they have IMDB IDs):
- The Batman (2022): http://localhost:3000/movie/414906
- Spider-Man: No Way Home: http://localhost:3000/movie/634649
- Dune: http://localhost:3000/movie/438631

### 3. Look for Server 1 (8Stream 🎯)
You should see:
- A lightning bolt icon ⚡ next to "Server 1"
- Badge text: "Best Quality"
- Note: "⚡ 4K • Hindi • No Ads"

### 4. Click Server 1
What should happen:
1. Loading message: "Fetching Hindi stream..."
2. API calls to http://localhost:5001
3. Custom HLS player loads with video controls
4. Banner shows: "Playing in [Language] • Premium quality • No ads"

### 5. Test the Custom Player
The HLS player should have:
- ▶️ Play/Pause button (center and bottom)
- Progress bar (seekable)
- Volume control
- Quality selector (Settings icon)
- Playback speed (0.5x to 2x)
- Fullscreen button
- Time display

### 6. Keyboard Shortcuts
Try these:
- **Space**: Play/Pause
- **Arrow Left/Right**: Seek ±10 seconds
- **Arrow Up/Down**: Volume
- **F**: Fullscreen
- **M**: Mute/Unmute

## What If It Doesn't Work?

### Server 1 Not Showing
**Cause**: Movie doesn't have IMDB ID
**Solution**: Try a different movie or it will auto-skip to Server 2

### "Fetching Hindi stream..." Stuck
**Check**:
1. Is 8StreamApi running? Visit http://localhost:5001 (should show "its ok")
2. Check browser console (F12) for errors
3. Check 8StreamApi logs in terminal

### Auto-Fallback to Server 2
**This is normal!** If:
- 8StreamApi doesn't have the content
- API request fails
- No IMDB ID available

The player will automatically switch to Server 2 (VidSrc CC)

### Video Won't Play
**Try**:
1. Click the play button in the center
2. Check browser console for HLS.js errors
3. Try a different movie
4. Try Server 2 to verify other servers work

## Testing Different Scenarios

### Test 1: Movie with Hindi Audio
Movie: **The Batman** (tt1877830)
- Should load Hindi audio track
- Banner shows "Playing in Hindi"

### Test 2: Movie with Multiple Languages
Movie: **RRR** (tt8178634)
- Should prioritize Hindi
- Settings menu shows available qualities

### Test 3: Movie Not in 8StreamApi
Movie: Some obscure indie film
- Should auto-fallback to Server 2
- No error shown to user

### Test 4: TV Show
Go to: http://localhost:3000/tv/42316 (Mirzapur)
- Server 1 should appear
- Select season and episode
- Should work same as movies

## Browser Console Debugging

Open DevTools (F12) → Console tab

**Good signs:**
```
✅ Fetching from: http://localhost:5001/api/v1/mediaInfo?id=tt1877830
✅ Stream URL received: https://...m3u8
✅ HLS.js: manifest loaded
```

**Bad signs:**
```
❌ Failed to fetch media info
❌ CORS error
❌ Network error
```

## API Testing (Manual)

### Test 1: Check API is Running
```bash
curl http://localhost:5001/
```
Should return: `its ok`

### Test 2: Get Media Info
```bash
curl "http://localhost:5001/api/v1/mediaInfo?id=tt1877830"
```
Should return JSON with playlist array

### Test 3: Get Stream URL (requires file and key from step 2)
```bash
curl -X POST http://localhost:5001/api/v1/getStream \
  -H "Content-Type: application/json" \
  -d '{"file":"...","key":"..."}'
```
Should return JSON with m3u8 link

## Expected Behavior Summary

✅ **Working correctly:**
- Server 1 appears with lightning bolt
- Clicking loads "Fetching Hindi stream..."
- Custom player appears with controls
- Video plays smoothly
- Quality selector works
- Keyboard shortcuts work

⚠️ **Normal fallback:**
- Some movies auto-switch to Server 2
- This is expected if content not available

❌ **Needs fixing:**
- Server 1 never appears (check IMDB ID)
- Stuck on "Fetching..." (check API)
- Player shows but video won't load (check m3u8 URL)
- Errors in console (check logs)

## Next Steps After Testing

Once local testing works:
1. ✅ Deploy 8StreamApi to Railway
2. ✅ Update .env.local with Railway URL
3. ✅ Test again locally with Railway API
4. ✅ Deploy CineHindi to Vercel
5. ✅ Add Railway URL to Vercel env vars
6. ✅ Test production deployment

## Stopping the Servers

When done testing:
```bash
# Stop Next.js dev server
Ctrl+C in the terminal

# Stop 8StreamApi
Ctrl+C in the 8StreamApi terminal
```

Or use Kiro to stop background processes.

## Current Status

- ✅ 8StreamApi running on port 5001
- ✅ Next.js running on port 3000
- ✅ .env.local configured
- ✅ All files created and integrated
- 🎯 Ready to test!

## Quick Test Checklist

- [ ] Open http://localhost:3000
- [ ] Go to a movie page
- [ ] See Server 1 with lightning bolt
- [ ] Click Server 1
- [ ] See "Fetching Hindi stream..."
- [ ] Custom player loads
- [ ] Video plays
- [ ] Controls work
- [ ] Quality selector works
- [ ] Keyboard shortcuts work
- [ ] Try Server 2 as comparison

Happy testing! 🚀
