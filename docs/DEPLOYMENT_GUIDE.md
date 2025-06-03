# VolTracker Deployment Guide

## Files to Deploy
Upload ALL files from `web-build/` folder to your www.voltracker.com server:

```
web-build/
├── index.html          (Main app page)
├── bundle.js           (App JavaScript - 664KB)
├── bundle.js.LICENSE.txt
└── 191.bundle.js       (Additional chunk)
```

## Deployment Steps

### 1. Upload Files
- Upload all `web-build/*` files to your web server root
- Ensure `index.html` is accessible at `https://www.voltracker.com/`

### 2. Verify Tesla Integration
- The `.well-known/` folder is already deployed ✅
- Tesla public key accessible at: `https://www.voltracker.com/.well-known/appspecific/com.tesla.3p.public-key.pem`

### 3. Test After Deployment
1. **Homepage**: Visit `https://www.voltracker.com`
2. **User Signup**: Test account creation
3. **Tesla OAuth**: Click "Connect Tesla" button
4. **Callback**: Should redirect to `/auth/callback` after Tesla login

## Environment Configuration
App is configured for production:
- ✅ Supabase: Connected to your database
- ✅ Tesla: Client ID and redirect URIs configured
- ✅ Domain: SSL certificate verified

## Post-Deployment Checklist
- [ ] Homepage loads properly
- [ ] User can sign up/login
- [ ] Tesla OAuth button works
- [ ] Callback URL handles Tesla redirect
- [ ] No console errors in browser

## Troubleshooting
- Check browser console for JavaScript errors
- Verify all files uploaded correctly
- Ensure HTTPS is working
- Test Tesla OAuth flow end-to-end

## Ready for Launch! 🚀
Your VolTracker app is production-ready with:
- User authentication (Supabase)
- Tesla vehicle integration
- Automatic mileage tracking
- Tax compliance features