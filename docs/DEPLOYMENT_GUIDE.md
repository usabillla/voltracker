# VolTracker Deployment Guide

This guide covers deployment procedures for both web and mobile platforms of the VolTracker application.

## 🌐 Web Application Deployment

### Production Status: ✅ LIVE
- **Production URL**: https://app.voltracker.com
- **Landing Page**: https://voltracker.com
- **Deployment Platform**: Vercel with automatic Git integration

### Automatic Deployment (Recommended)

**Current Setup:**
The application uses Vercel's Git integration for automatic deployments:

```bash
# Automatic deployment trigger
git push origin main  # → Triggers Vercel build and deployment
```

**Deployment Pipeline:**
```
GitHub Push → Vercel Webhook → 
Build Process → Environment Variables → 
Static Asset Generation → CDN Distribution → 
Live Update
```

### Manual Deployment (Backup)

If manual deployment is needed:

```bash
# Build the application
npm run web-build

# Deploy to Vercel
vercel --prod

# Or deploy specific directory
cd ../voltracker-app
vercel --prod
```

### Environment Variables

Required environment variables (configured in Vercel dashboard):
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_TESLA_REDIRECT_URI=https://app.voltracker.com/auth/callback
REACT_APP_DOMAIN=app.voltracker.com
```

### Vercel Configuration

Current `vercel.json` configuration:
```json
{
  "buildCommand": "echo 'Built files already in directory'",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/auth/callback",
      "destination": "/index.html"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📱 Mobile Application Deployment

### iOS Deployment

**Prerequisites:**
- Xcode 14.0+
- Apple Developer Account
- iOS deployment certificate

**Build Process:**
```bash
# Install iOS dependencies
cd ios
bundle install
bundle exec pod install
cd ..

# Build for iOS
npm run ios --configuration=Release

# Or build with Xcode
open ios/VolTracker.xcworkspace
```

**App Store Distribution:**
1. Archive the project in Xcode
2. Upload to App Store Connect
3. Configure app metadata and screenshots
4. Submit for App Store review

### Android Deployment

**Prerequisites:**
- Android Studio
- Google Play Console access
- Android signing key

**Build Process:**
```bash
# Build Android release
cd android
./gradlew assembleRelease

# Generate signed APK
./gradlew bundleRelease
```

**Google Play Distribution:**
1. Upload AAB file to Google Play Console
2. Configure store listing and graphics
3. Set up internal testing track
4. Promote to production

## 🔐 Tesla Integration Setup

### Tesla Developer Configuration

**Required Setup:**
- Tesla Developer Account
- Registered application with redirect URIs:
  - Web: `https://app.voltracker.com/auth/callback`
  - iOS: `voltracker://auth/callback`
  - Android: `voltracker://auth/callback`

**Public Key Deployment:**
Public key must be accessible at:
```
https://app.voltracker.com/.well-known/appspecific/com.tesla.3p.public-key.pem
```

### Tesla API Endpoints

**Production Configuration:**
- North America: `https://fleet-api.prd.na.vn.cloud.tesla.com`
- Europe: `https://fleet-api.prd.eu.vn.cloud.tesla.com`
- Asia-Pacific: `https://fleet-api.prd.ap.vn.cloud.tesla.com`

## 🗄️ Database Deployment

### Supabase Configuration

**Production Database:**
- PostgreSQL instance with Row Level Security (RLS)
- Automatic backups enabled
- Real-time subscriptions configured

**Migration Process:**
```bash
# Run database migrations
node scripts/run-migrations.js

# Verify migrations
node scripts/database/diagnose-database.sql
```

**Required Tables:**
- `users` - User authentication data
- `vehicles` - Tesla vehicle information with encrypted tokens
- `trips` - Future mileage tracking data
- `classifications` - Business/personal categorization

## 🧪 Testing & Quality Assurance

### Pre-Deployment Testing

**Automated Tests:**
```bash
# Run full test suite
npm test

# Run with coverage
npm run test:coverage

# Test Tesla integration (mock)
node scripts/tesla-dev/test-tesla-oauth.js
```

**Manual Testing Checklist:**
- [ ] User registration and login
- [ ] Tesla OAuth flow completion
- [ ] Vehicle discovery and linking
- [ ] Real-time vehicle data display
- [ ] Cross-platform compatibility (web/mobile)
- [ ] Error handling and loading states

### Post-Deployment Verification

**Production Checks:**
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Test production endpoints
curl https://app.voltracker.com/health
```

**User Flow Testing:**
1. Visit https://app.voltracker.com
2. Create new user account
3. Complete Tesla OAuth integration
4. Verify vehicle data display
5. Test navigation between screens

## 🔍 Monitoring & Maintenance

### Performance Monitoring

**Metrics to Monitor:**
- Page load times (<2s target)
- Bundle size (<700KB current)
- Error rates (<1% target)
- User session duration

**Tools:**
- Vercel Analytics for web performance
- Supabase monitoring for database performance
- Tesla API rate limit monitoring

### Security Monitoring

**Security Checklist:**
- [ ] HTTPS enforcement active
- [ ] Tesla tokens encrypted in database
- [ ] RLS policies functioning correctly
- [ ] No exposed API keys in client code
- [ ] Regular security updates applied

## 🚨 Troubleshooting

### Common Issues

**Deployment Failures:**
```bash
# Check build logs
vercel logs --follow

# Clear build cache
vercel --prod --force

# Verify environment variables
vercel env ls
```

**Tesla Integration Issues:**
- Verify public key accessibility
- Check redirect URI configuration
- Validate Tesla Developer Portal settings
- Test OAuth flow in development

**Database Issues:**
- Check RLS policy configurations
- Verify migration completion
- Monitor connection limits
- Review Supabase logs

### Support & Escalation

**Internal Resources:**
- GitHub Issues for bug reports
- Development team for technical issues
- Documentation updates via pull requests

**External Support:**
- Vercel Support for deployment issues
- Supabase Support for database problems
- Tesla Developer Portal for API issues

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] Database migrations ready

### Deployment
- [ ] Git push triggers automatic build
- [ ] Build completes successfully
- [ ] Environment variables loaded
- [ ] Static assets deployed to CDN

### Post-Deployment
- [ ] Application accessible at production URL
- [ ] Tesla OAuth flow working
- [ ] Database connections stable
- [ ] Performance metrics acceptable
- [ ] Security scan passed

**Last Updated**: January 2025  
**Deployment Version**: 2.0  
**Next Review**: Quarterly