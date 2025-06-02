# VolTracker Architecture Documentation

## Project Overview

**VolTracker** is a multi-platform mileage tracking application for Tesla vehicles with automated trip detection, classification, and tax deduction calculations. The app targets iOS, Android, and Web platforms with 85-90% code reuse.

### Core Purpose
- Automatically track Tesla vehicle trips via Tesla Fleet API
- Classify trips as Business or Personal for tax purposes
- Generate IRS-compliant mileage logs and export capabilities
- Provide dashboard analytics for mileage insights

## Technical Architecture

### Tech Stack: React Native + React Native Web

**Benefits:**
- 85-90% code reuse across platforms
- Single development workflow
- Consistent UI/UX across platforms
- One repository to maintain
- Shared state management

### Project Structure
```
/src
  /components     # Shared UI components across platforms
  /screens        # Navigation screens (shared)
  /hooks          # Business logic and data fetching
  /services       # API integration, authentication
  /utils          # Helper functions and utilities
  /web            # Web-specific code and optimizations
  /mobile         # Mobile-specific features
```

### Platform-Specific Considerations

**Web Features:**
- Responsive design (320px-1024px+)
- Browser-based file downloads (CSV export)
- SEO optimization for landing pages
- PWA capabilities (future consideration)

**Mobile Features:**
- Push notifications (future)
- Background sync capabilities
- Native maps integration
- Biometric authentication (future)

**Shared Features:**
- Tesla OAuth authentication flow
- Trip management and classification
- Dashboard analytics and statistics
- Data export functionality

## Core Systems

### 1. Authentication System
- **Tesla OAuth Integration**: Fleet API authentication
- **User Management**: Supabase email authentication
- **Session Management**: Secure token storage per platform
- **Multi-Vehicle Support**: Handle multiple Tesla vehicles per user

### 2. Trip Detection Engine
- **Automated Detection**: Supabase Edge Functions polling Tesla API
- **Data Processing**: Location, distance, duration calculations
- **Duplicate Prevention**: Smart trip deduplication logic
- **Real-time Sync**: Automatic background synchronization

### 3. Classification System
- **Business/Personal**: Manual trip classification
- **Smart Suggestions**: Future automatic classification
- **Tax Compliance**: IRS-compliant data structure
- **Audit Trail**: Complete trip history and modifications

### 4. Analytics Dashboard
- **Real-time Statistics**: YTD totals, monthly trends
- **Tax Calculations**: IRS mileage rate integration
- **Visual Analytics**: Charts and graphs for insights
- **Export Reports**: CSV and future PDF generation

## Data Architecture

### Database Schema (Supabase PostgreSQL)
- **Users**: Authentication and profile data
- **Vehicles**: Tesla vehicle information and tokens
- **Trips**: Location, distance, classification, timestamps
- **Classifications**: Business purposes and categories
- **Settings**: User preferences and configurations

### External Integrations
- **Tesla Fleet API**: Vehicle data and trip information
- **Geocoding Service**: Address reverse lookup
- **Tax Rate API**: Current IRS mileage rates

## Development Strategy

### Component Strategy
- **Mobile-first Design**: Build for mobile, adapt for web
- **Responsive Units**: Flexbox, percentages for layouts
- **Platform Files**: Use .web.js, .native.js when needed
- **Conditional Rendering**: Platform-specific features

### Navigation Strategy
- **React Navigation**: Primary navigation library
- **Web Support**: React Navigation Web compatibility
- **URL Routing**: Web-based routing and deep linking
- **Cross-platform**: Consistent navigation patterns

## Performance Targets

### Web Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90
- Initial Bundle Size: < 200KB

### Mobile Performance
- App Size: < 40MB (iOS), < 25MB (Android)
- Cold Start Time: < 2s
- Smooth Scrolling: 60 FPS
- Battery Efficiency: Optimized background sync

## Security & Privacy

### Data Protection
- **Encryption**: All sensitive data encrypted at rest
- **Token Security**: Secure storage per platform
- **API Security**: OAuth 2.0 for Tesla integration
- **Privacy**: Minimal data collection, user control

### Compliance
- **IRS Requirements**: Compliant mileage log format
- **Data Retention**: User-controlled data lifecycle
- **Export Security**: Secure file generation and delivery

## Deployment Strategy

### Web Deployment
- **Hosting**: Vercel or Netlify (free tier)
- **Domain**: app.volttracker.com
- **CI/CD**: GitHub Actions automation
- **Preview**: Deployment previews for testing

### Mobile Deployment
- **iOS**: TestFlight beta testing
- **Android**: Google Play Beta track
- **Updates**: Consider CodePush for minor updates
- **Release**: Coordinated cross-platform releases

## Success Metrics

### Adoption Targets
- 60% mobile users, 40% web users
- Cross-platform usage tracking
- 95% feature parity across platforms

### Quality Metrics
- Platform-specific crash rate: < 1%
- User satisfaction: > 4.0/5 per platform
- Data accuracy: > 99% trip detection rate