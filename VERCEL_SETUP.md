# Vercel Projects Setup Guide

## Repository Links for Vercel Projects

### 🌐 Static Website Project (voltracker.com)

**Vercel Project Name:** `voltracker`  
**Repository URL:** `https://github.com/usabillla/voltracker.git`  
**Domain:** `voltracker.com`

**Vercel Configuration:**
```
Framework Preset: Other
Root Directory: voltracker-web
Build Command: echo 'Static site - no build needed'
Output Directory: .
Install Command: npm install
```

### 📱 React App Project (app.voltracker.com)

**Vercel Project Name:** `voltracker-app`  
**Repository URL:** `https://github.com/usabillla/voltracker-app.git`  
**Domain:** `app.voltracker.com`

**Vercel Configuration:**
```
Framework Preset: Other
Root Directory: . (root)
Build Command: npm run web:build
Output Directory: web-build
Install Command: npm install
```

## How to Set Up in Vercel Dashboard

### Step 1: Static Website Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import `https://github.com/usabillla/voltracker.git`
4. **Important:** Set Root Directory to `voltracker-web`
5. Configure as shown above
6. Set custom domain to `voltracker.com`

### Step 2: React App Setup  
1. Create new project in Vercel
2. Import `https://github.com/usabillla/voltracker-app.git`
3. Leave Root Directory as `.` (root)
4. Configure as shown above
5. Set custom domain to `app.voltracker.com`

### Step 3: Environment Variables (React App Only)
Add these to the `voltracker-app` project:

```
REACT_APP_SUPABASE_URL=https://rtglyzhjqksbgcaeklbq.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2x5emhqcWtzYmdjYWVrbGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTkwMzAsImV4cCI6MjA2NDUzNTAzMH0.2nq6N08V4KTHdUXzKOh5885GHpB2BUQHbFLAHXr6chI
REACT_APP_TESLA_CLIENT_ID=d1155240-a0c2-4133-8ae4-b2d7005fa484
REACT_APP_TESLA_REDIRECT_URI=https://app.voltracker.com/auth/callback
REACT_APP_DOMAIN=app.voltracker.com
REACT_APP_VERSION=0.0.1
REACT_APP_DEBUG=false
```

## Current Status

✅ **Static Website** - Ready to deploy  
⚠️ **React App** - Needs separate repository created

## Next Steps

1. **Create voltracker-app repository:**
   ```bash
   # Go to GitHub and create: https://github.com/usabillla/voltracker-app
   ```

2. **Push React app to new repository:**
   ```bash
   cd VolTracker
   git push origin main --force
   ```

3. **Deploy using scripts:**
   ```bash
   # Deploy static website
   cd voltracker-web && ./deploy.sh

   # Deploy React app  
   cd VolTracker && ./deploy.sh
   ```

## Repository URLs Summary

| Project | Repository | Vercel Project | Domain |
|---------|------------|----------------|---------|
| Static Website | `https://github.com/usabillla/voltracker.git` | `voltracker` | `voltracker.com` |
| React App | `https://github.com/usabillla/voltracker-app.git` | `voltracker-app` | `app.voltracker.com` |