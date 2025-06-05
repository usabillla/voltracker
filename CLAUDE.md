# VolTracker Project Configuration

## Project Structure & Deployment Configuration

This file contains critical information about the VolTracker project structure and deployment setup. **DO NOT DELETE** - This serves as the source of truth for the project configuration.

### 📁 Project Structure

```
voltracker/
├── voltracker-web/          # Static website (Landing page)
│   ├── index.html           # Main landing page
│   ├── about.html           # About page
│   ├── faq.html            # FAQ page
│   ├── privacy.html        # Privacy policy
│   ├── vercel.json         # Vercel config for static site
│   ├── deploy.sh           # Deployment script
│   └── package.json        # Dependencies
└── VolTracker/              # React Native Web App
    ├── App.tsx             # Main React app
    ├── src/                # Source code
    ├── vercel.json         # Vercel config for React app
    ├── deploy.sh           # Deployment script
    ├── .env                # Local environment variables
    ├── .env.production     # Production environment variables
    └── package.json        # Dependencies
```

### 🚀 Deployment Configuration

#### Static Website (Landing Page)
- **Local Directory:** `voltracker-web/`
- **Repository:** `https://github.com/usabillla/voltracker.git`
- **Vercel Project Name:** `voltracker-web`
- **Domain:** `voltracker.com`
- **Build Command:** `echo 'Static site - no build needed'`
- **Output Directory:** `.` (root)
- **Root Directory:** `voltracker-web`

#### React App (Main Application)
- **Local Directory:** `VolTracker/`
- **Repository:** `https://github.com/usabillla/voltracker-app.git`
- **Vercel Project Name:** `voltracker`
- **Domain:** `app.voltracker.com`
- **Build Command:** `npm run web:build`
- **Output Directory:** `web-build`
- **Root Directory:** `.` (root)

### 🔧 Environment Variables (React App Only)

**Required for production deployment:**

```
REACT_APP_SUPABASE_URL=https://rtglyzhjqksbgcaeklbq.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2x5emhqcWtzYmdjYWVrbGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTkwMzAsImV4cCI6MjA2NDUzNTAzMH0.2nq6N08V4KTHdUXzKOh5885GHpB2BUQHbFLAHXr6chI
REACT_APP_TESLA_CLIENT_ID=d1155240-a0c2-4133-8ae4-b2d7005fa484
REACT_APP_TESLA_REDIRECT_URI=https://app.voltracker.com/auth/callback
REACT_APP_DOMAIN=app.voltracker.com
REACT_APP_VERSION=0.0.1
REACT_APP_DEBUG=false
NODE_ENV=production
```

### 🧪 Test Credentials

**Working test user for development:**
- **Email:** `dev@voltracker.com`
- **Password:** `DevPassword123!`

### 📝 Important Notes

1. **Separate Repositories:** The static website and React app use different GitHub repositories
2. **Separate Vercel Projects:** Each has its own Vercel project for independent deployment
3. **Environment Variables:** Only the React app needs environment variables set in Vercel
4. **Email Confirmations:** Disabled in Supabase for easier development/testing
5. **Analytics:** Both projects have Vercel Analytics integrated

### 🚀 Deployment Commands

```bash
# Deploy static website
cd voltracker-web
./deploy.sh

# Deploy React app
cd VolTracker
./deploy.sh

# Deploy both (from root)
cd voltracker-web && ./deploy.sh && cd ../VolTracker && ./deploy.sh
```

### 🔍 Troubleshooting

**If React app shows white screen:**
- Check environment variables are set in Vercel dashboard
- Verify all 8 environment variables are present
- Redeploy after adding variables

**If repositories get mixed up:**
- Static website should always point to: `https://github.com/usabillla/voltracker.git`
- React app should always point to: `https://github.com/usabillla/voltracker-app.git`

### 🎯 Current Status (Last Updated: 2025-06-05)

- ✅ Static website: Deployed and working
- ✅ React app: Deployed, needs environment variables configured
- ✅ Authentication: Working with Supabase
- ✅ Analytics: Integrated and tracking
- ✅ Deployment scripts: Created and tested

### 🛠️ Key Files

- `VERCEL_SETUP.md` - Detailed Vercel configuration guide
- `VERCEL_ENV_VARS.md` - Environment variables reference  
- `VERCEL_PROJECTS_STATUS.md` - Current deployment status
- `deploy.sh` - Automated deployment scripts (in both projects)

---

**⚠️ IMPORTANT:** This configuration took significant effort to set up correctly. Always refer to this file before making deployment changes.