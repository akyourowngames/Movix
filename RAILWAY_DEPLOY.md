# Quick Railway Deployment Guide for 8StreamApi

## Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app with GitHub)

## Step-by-Step Deployment

### 1. Push 8StreamApi to Your GitHub

```bash
# Navigate to the cloned repository
cd stream8apii

# Check current remote
git remote -v

# If you want to push to your own GitHub:
# Create a new repository on GitHub (e.g., "8StreamApi")
# Then update the remote:
git remote set-url origin https://github.com/YOUR_USERNAME/8StreamApi.git

# Push to your GitHub
git push -u origin main
```

### 2. Deploy to Railway

1. **Go to Railway:**
   - Visit https://railway.app
   - Click "Login" and sign in with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your repositories (if first time)

3. **Select Repository:**
   - Find and select your `8StreamApi` repository
   - Railway will automatically detect it's a Node.js project

4. **Wait for Deployment:**
   - Railway will:
     - Install dependencies (`npm install`)
     - Build the project (`npm run build`)
     - Start the server (`npm start`)
   - This takes 2-3 minutes

5. **Get Your URL:**
   - Once deployed, click on your project
   - Go to "Settings" tab
   - Scroll to "Domains" section
   - You'll see a URL like: `8streamapi-production.up.railway.app`
   - Copy this URL

### 3. Configure Your CineHindi Project

1. **Update .env.local:**
   ```env
   NEXT_PUBLIC_8STREAM_URL=https://8streamapi-production.up.railway.app
   ```
   (Replace with your actual Railway URL)

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Test it:**
   - Go to http://localhost:3000/movie/tt1877830
   - Click "Server 1" (8Stream 🎯)
   - Should load the HLS player

### 4. Deploy to Vercel

1. **Add environment variable:**
   - Go to Vercel dashboard
   - Select your project
   - Settings → Environment Variables
   - Add:
     - Key: `NEXT_PUBLIC_8STREAM_URL`
     - Value: `https://your-railway-url.up.railway.app`
   - Save

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Add 8StreamApi integration"
   git push
   ```

## Railway Free Tier Limits

- ✅ 500 hours/month execution time
- ✅ $5 free credit per month
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Sleeps after 30 minutes of inactivity (wakes up in ~1 second)

## Upgrade to Railway Pro (Optional)

If you need:
- No sleep mode
- More execution hours
- Better performance

Upgrade to Railway Pro: $5/month

## Alternative: Deploy to Vercel

The 8StreamApi can also be deployed to Vercel:

1. **Add vercel.json** (already exists in the repo)
2. **Deploy:**
   ```bash
   cd stream8apii
   vercel
   ```
3. **Note:** Vercel free tier has 10-second serverless timeout
   - Some streams might take longer to fetch
   - Railway is recommended for better reliability

## Troubleshooting

### Deployment Failed
- Check Railway logs: Click project → "Deployments" → Click failed deployment
- Common issues:
  - Missing dependencies: Check `package.json`
  - Build errors: Check TypeScript errors

### API Not Responding
- Check if Railway app is sleeping: Visit the URL in browser
- First request after sleep takes ~1 second to wake up

### CORS Errors
- Railway automatically handles CORS for most cases
- If issues persist, check Railway logs

## Monitoring

### Check API Health
Visit: `https://your-railway-url.up.railway.app/api/v1/mediaInfo?id=tt1877830`

Should return JSON with playlist data.

### Railway Dashboard
- View logs: Real-time server logs
- Metrics: CPU, Memory, Network usage
- Deployments: History of all deployments

## Cost Estimation

### Free Tier (Hobby)
- Perfect for testing and personal use
- 500 hours = ~20 days of continuous running
- Sleeps after inactivity (saves hours)

### Pro Tier ($5/month)
- No sleep mode
- Unlimited execution hours
- Priority support
- Better for production

## Security Notes

- ✅ Railway provides automatic HTTPS
- ✅ Environment variables are encrypted
- ✅ No API keys needed for 8StreamApi
- ⚠️ Don't commit `.env` files to GitHub

## Next Steps

1. ✅ Deploy 8StreamApi to Railway
2. ✅ Get Railway URL
3. ✅ Update `.env.local` in CineHindi project
4. ✅ Test locally
5. ✅ Add env var to Vercel
6. ✅ Deploy to production

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- 8StreamApi Issues: https://github.com/himanshu8443/8StreamApi/issues
