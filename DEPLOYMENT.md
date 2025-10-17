# MiniWiki - Vercel Deployment Guide

## ✅ Ready for Vercel Deployment

Your MiniWiki app is now configured for Vercel deployment!

## Prerequisites

1. **GitHub Account** - You'll need to push your code to GitHub
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub**:
   ```bash
   cd wiki-app
   git init
   git add .
   git commit -m "Initial commit - MiniWiki"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

3. **Done!** Your app will be live in ~2 minutes

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd wiki-app
   vercel
   ```

4. **Follow prompts** and your app will be deployed!

## Important Notes

### What Gets Deployed:
- ✅ All React code and components
- ✅ AI search functionality (Transformers.js)
- ✅ Wikipedia API integration
- ❌ Large Wikipedia XML/TXT files (excluded via .gitignore)

### Why the Large Files Are Excluded:
- The Wikipedia XML (1.4GB) and index files are **too large** for Vercel
- **Good news**: The app doesn't need them!
- It uses the Wikipedia API instead, which is:
  - Faster
  - Always up-to-date
  - No storage costs
  - Works perfectly

### Configuration Files:
- `vercel.json` - Vercel deployment config
- `.gitignore` - Excludes large files and build artifacts
- `package.json` - Updated with project name "miniwiki"

## Post-Deployment

After deployment, your app will:
- Load the Wikipedia index (titles only)
- Fetch article content from Wikipedia API on-demand
- Work exactly like it does locally
- Be accessible at: `https://your-project-name.vercel.app`

## Environment Variables (Optional)

If you want to add any API keys or custom settings:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables as needed

## Domain Configuration

To use a custom domain:
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Troubleshooting

**Build fails?**
- Check that all dependencies are in `package.json`
- Run `npm run build` locally first to test

**App doesn't load articles?**
- Check browser console for CORS errors
- Wikipedia API should work fine from any domain

**Performance issues?**
- Vercel provides excellent edge caching
- First load might be slower while AI models download
- Subsequent loads are cached

## Support

For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)

Enjoy your deployed MiniWiki! 🚀
