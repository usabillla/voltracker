# VolTracker - Tesla Vehicle Tracking Application

**VolTracker** is a comprehensive Tesla vehicle tracking application that enables Tesla owners to monitor their vehicles, track mileage, and manage business/personal vehicle usage for tax compliance purposes.

## 🚀 Project Status: Production Ready

- ✅ **Web Application**: Live at [https://app.voltracker.com](https://app.voltracker.com)
- ✅ **Landing Page**: Live at [https://voltracker.com](https://voltracker.com)
- ✅ **Mobile Apps**: Ready for iOS/Android deployment
- ✅ **Tesla Integration**: Complete OAuth implementation with Fleet API
- ✅ **Database**: Supabase backend with migration system

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React Native 0.79.2 with React 19.0.0
- **Web**: React Native Web with Webpack bundling
- **Backend**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Tesla OAuth 2.0 + Supabase Auth
- **Deployment**: Vercel (web) + standard app stores (mobile)
- **Testing**: Jest with React Testing Library

### Platform Support
- **iOS**: React Native app ready for App Store
- **Android**: React Native app ready for Google Play
- **Web**: Progressive web app deployed on Vercel

## 🎯 Core Features

### Vehicle Management
- Tesla vehicle discovery and linking via OAuth
- Real-time vehicle status (battery, range, location, odometer)
- Visual status indicators (online/asleep/offline)
- Multi-vehicle support with persistent selection

### User Experience
- Secure user authentication with Supabase
- Cross-platform UI with consistent design system
- Responsive web interface and native mobile experience
- Comprehensive error handling and loading states

### Business Features
- Automatic mileage tracking capabilities
- Business/personal vehicle usage classification
- Tax compliance reporting features
- Secure token storage with encryption

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- React Native development environment
- Tesla account with Fleet API access
- Supabase account for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/usabillla/voltracker-app.git
   cd VolTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # For iOS only
   cd ios && bundle install && bundle exec pod install && cd ..
   ```

3. **Environment Setup**
   Create `.env` file with:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_TESLA_REDIRECT_URI=your_tesla_redirect_uri
   REACT_APP_DOMAIN=your_domain
   ```

4. **Database Setup**
   ```bash
   node run-migrations.js
   ```

### Development

#### Mobile Development
```bash
# iOS
npm run ios

# Android
npm run android

# Start Metro bundler
npm start
```

#### Web Development
```bash
# Build for web
npm run web-build

# Start development server with Tesla API proxy
npm run web-dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Test Tesla integration (with mock data)
node test-tesla-oauth.js
```

## 📱 Platform-Specific Features

### Mobile Apps
- Native performance with React Native
- Secure token storage using device keychain
- Background location tracking (when implemented)
- Push notifications for vehicle alerts

### Web Application
- Progressive Web App (PWA) capabilities
- Responsive design for all screen sizes
- Tesla API proxy for CORS handling
- Real-time data updates

## 🔧 Development Guide

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── shared/         # Platform-agnostic components
│   └── vehicles/       # Vehicle-specific components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Main dashboard
│   └── vehicles/      # Vehicle management screens
├── services/          # API and business logic
├── hooks/             # Custom React hooks
├── navigation/        # Navigation system
├── theme/            # Design system and theming
└── utils/            # Utility functions
```

### Key Services
- **`auth.ts`**: Supabase authentication management
- **`tesla.ts`**: Tesla Fleet API integration with OAuth
- **`supabase.ts`**: Database operations and type safety
- **`secureStorage.ts`**: Platform-specific secure storage

### Testing Strategy
- Unit tests for components and utilities
- Integration tests for service layers
- Mock Tesla API for development testing
- End-to-end testing for critical user flows

## 🚀 Deployment

### Web Deployment (Production)
The web application is automatically deployed via Vercel:
- **Production**: https://app.voltracker.com
- **Auto-deployment**: Triggered by GitHub pushes
- **Environment Variables**: Configured in Vercel dashboard

### Mobile Deployment
Apps are ready for store submission:
- **iOS**: Build with Xcode and submit to App Store
- **Android**: Build APK/AAB and submit to Google Play

## 🔐 Security Features

- **Encrypted Token Storage**: Tesla tokens stored securely
- **Row Level Security**: Database-level access controls
- **HTTPS Enforcement**: All communications encrypted
- **OAuth 2.0**: Secure Tesla API authentication
- **Input Validation**: Comprehensive data sanitization

## 📚 Documentation

### Available Guides
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment instructions
- `MIGRATION_GUIDE.md` - Database migration procedures
- `VEHICLE_MANAGEMENT_GUIDE.md` - Feature documentation
- `TESTING_READY.md` - Testing procedures and mock data

### API Documentation
- Tesla Fleet API integration patterns
- Supabase database schema and operations
- Component usage examples and props

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- TypeScript for type safety
- ESLint for code quality
- Jest for testing
- Conventional commits for git history

## 📞 Support

For issues, questions, or contributions:
- **GitHub Issues**: [voltracker-app/issues](https://github.com/usabillla/voltracker-app/issues)
- **Documentation**: Check the `/docs` directory
- **Tesla API**: [Tesla Fleet API Documentation](https://developer.tesla.com)

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🔄 Recent Updates

- ✅ Complete Tesla OAuth 2.0 integration
- ✅ Web application deployment with automatic Git deployments
- ✅ Enhanced vehicle management interface
- ✅ Comprehensive testing infrastructure
- ✅ Production-ready database migrations
- ✅ Cross-platform component system

**Last Updated**: January 2025