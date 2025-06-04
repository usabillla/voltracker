# T03c_S03_Mobile_OAuth_Asset_Configuration

## Task Overview
**Task ID**: T03c_S03_Mobile_OAuth_Asset_Configuration  
**Sprint**: S03  
**Complexity**: Medium  
**Parent Task**: T03_S03_Mobile_App_Store_Deployment  
**Assignee**: TBD  
**Status**: Not Started  

## Objective
Configure shared mobile OAuth flows, app assets, and build configurations that are common between iOS and Android platforms for App Store deployment.

## Scope
Focus on shared mobile configuration requirements including:
- OAuth redirect URI setup for mobile apps
- Tesla API configuration for mobile environments
- Shared app assets and branding
- Cross-platform build configuration
- Mobile-specific security implementations

## Prerequisites
- [ ] Tesla API registration completed
- [ ] OAuth application configured in Tesla Developer Portal
- [ ] Mobile app bundle identifiers determined
- [ ] Brand assets and design system finalized

## Technical Requirements

### OAuth Configuration
- [ ] Configure mobile OAuth redirect URIs
- [ ] Set up deep linking for OAuth callbacks
- [ ] Implement secure token storage
- [ ] Configure OAuth scopes for mobile
- [ ] Test OAuth flow on both platforms

### Tesla API Configuration
- [ ] Register mobile app with Tesla
- [ ] Configure API endpoints for mobile
- [ ] Set up proper user-agent strings
- [ ] Implement rate limiting for mobile
- [ ] Configure SSL pinning (if required)

### App Assets and Branding
- [ ] Create app icons for all resolutions
- [ ] Design splash screens and loading states
- [ ] Prepare store listing graphics
- [ ] Create adaptive icons (Android)
- [ ] Generate App Store screenshots

### Security Configuration
- [ ] Implement certificate pinning
- [ ] Configure secure storage for tokens
- [ ] Set up API key obfuscation
- [ ] Implement biometric authentication
- [ ] Configure network security policies

## Implementation Steps

### Phase 1: OAuth Setup
1. **Tesla Developer Portal Configuration**
   ```javascript
   // OAuth configuration
   const TESLA_OAUTH_CONFIG = {
     clientId: process.env.TESLA_CLIENT_ID,
     redirectUri: {
       ios: 'voltracker://auth/tesla/callback',
       android: 'voltracker://auth/tesla/callback'
     },
     scopes: [
       'openid',
       'offline_access',
       'vehicle_device_data',
       'vehicle_cmds',
       'vehicle_charging_cmds'
     ]
   };
   ```

2. **Deep Link Configuration**
   ```xml
   <!-- Android: android/app/src/main/AndroidManifest.xml -->
   <intent-filter android:autoVerify="true">
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="voltracker" android:host="auth" />
   </intent-filter>
   ```

   ```xml
   <!-- iOS: ios/VolTracker/Info.plist -->
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLName</key>
       <string>voltracker.auth</string>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>voltracker</string>
       </array>
     </dict>
   </array>
   ```

3. **OAuth Service Implementation**
   ```typescript
   // src/services/oauth.mobile.ts
   import { authorize, refresh } from 'react-native-app-auth';
   
   const config = {
     issuer: 'https://auth.tesla.com',
     clientId: process.env.TESLA_CLIENT_ID,
     redirectUrl: 'voltracker://auth/tesla/callback',
     scopes: ['openid', 'offline_access', 'vehicle_device_data'],
     additionalParameters: {},
     customHeaders: {}
   };
   
   export const authenticateWithTesla = async () => {
     try {
       const result = await authorize(config);
       await secureStorage.setItem('tesla_access_token', result.accessToken);
       await secureStorage.setItem('tesla_refresh_token', result.refreshToken);
       return result;
     } catch (error) {
       throw new Error('Tesla authentication failed');
     }
   };
   ```

### Phase 2: Asset Creation
1. **App Icon Generation**
   ```bash
   # Create master icon (1024x1024)
   # Generate iOS icons
   npx @react-native-community/cli generate-ios-icons ./assets/icon.png
   
   # Generate Android icons
   npx @react-native-community/cli generate-android-icons ./assets/icon.png
   ```

2. **Splash Screen Configuration**
   ```typescript
   // src/components/SplashScreen.tsx
   import React from 'react';
   import { View, Image, StyleSheet } from 'react-native';
   
   export const SplashScreen = () => (
     <View style={styles.container}>
       <Image 
         source={require('../assets/splash-logo.png')} 
         style={styles.logo}
         resizeMode="contain"
       />
     </View>
   );
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#000000',
       justifyContent: 'center',
       alignItems: 'center',
     },
     logo: {
       width: 200,
       height: 200,
     },
   });
   ```

3. **Store Assets Creation**
   ```
   Store Assets Structure:
   assets/
   ├── store/
   │   ├── ios/
   │   │   ├── app-store-icon.png (1024x1024)
   │   │   ├── screenshots/
   │   │   │   ├── iphone-6.7/
   │   │   │   ├── iphone-6.5/
   │   │   │   └── ipad-12.9/
   │   └── android/
   │       ├── play-store-icon.png (512x512)
   │       ├── feature-graphic.png (1024x500)
   │       └── screenshots/
   │           ├── phone/
   │           └── tablet/
   ```

### Phase 3: Security Implementation
1. **Secure Storage Setup**
   ```typescript
   // src/services/secureStorage.mobile.ts
   import * as Keychain from 'react-native-keychain';
   import { Platform } from 'react-native';
   
   const KEYCHAIN_SERVICE = 'VolTracker';
   
   export const secureStorage = {
     async setItem(key: string, value: string) {
       await Keychain.setInternetCredentials(
         `${KEYCHAIN_SERVICE}.${key}`,
         key,
         value,
         {
           accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
           authenticatePrompt: 'Authenticate to access VolTracker',
         }
       );
     },
   
     async getItem(key: string): Promise<string | null> {
       try {
         const credentials = await Keychain.getInternetCredentials(
           `${KEYCHAIN_SERVICE}.${key}`
         );
         return credentials ? credentials.password : null;
       } catch (error) {
         return null;
       }
     },
   
     async removeItem(key: string) {
       await Keychain.resetInternetCredentials(`${KEYCHAIN_SERVICE}.${key}`);
     }
   };
   ```

2. **API Security Configuration**
   ```typescript
   // src/services/api.mobile.ts
   import { NetworkingModule } from 'react-native';
   
   const API_CONFIG = {
     baseURL: 'https://owner-api.teslamotors.com',
     timeout: 30000,
     headers: {
       'User-Agent': 'VolTracker/1.0.0 (Mobile)',
       'Content-Type': 'application/json',
     },
     // Certificate pinning configuration
     pinnedCertificates: [
       {
         hostname: 'owner-api.teslamotors.com',
         hash: 'SHA256:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
       },
     ],
   };
   ```

### Phase 4: Build Configuration
1. **Environment Configuration**
   ```javascript
   // config/env.js
   const ENV = {
     development: {
       TESLA_CLIENT_ID: 'dev_client_id',
       TESLA_API_URL: 'https://owner-api.teslamotors.com',
       API_TIMEOUT: 30000,
     },
     production: {
       TESLA_CLIENT_ID: process.env.TESLA_CLIENT_ID,
       TESLA_API_URL: 'https://owner-api.teslamotors.com',
       API_TIMEOUT: 30000,
     },
   };
   
   export default ENV[process.env.NODE_ENV || 'development'];
   ```

2. **Build Scripts**
   ```json
   // package.json
   {
     "scripts": {
       "build:ios": "react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle",
       "build:android": "cd android && ./gradlew assembleRelease",
       "icon:generate": "npx @react-native-community/cli generate-icons",
       "assets:optimize": "npx react-native-asset"
     }
   }
   ```

### Phase 5: Testing and Validation
1. **OAuth Flow Testing**
   ```typescript
   // __tests__/oauth.mobile.test.ts
   import { authenticateWithTesla } from '../src/services/oauth.mobile';
   
   describe('Mobile OAuth Flow', () => {
     test('should handle Tesla authentication', async () => {
       const result = await authenticateWithTesla();
       expect(result.accessToken).toBeDefined();
       expect(result.refreshToken).toBeDefined();
     });
   
     test('should store tokens securely', async () => {
       // Test secure storage functionality
     });
   });
   ```

2. **Deep Link Testing**
   ```bash
   # iOS testing
   xcrun simctl openurl booted "voltracker://auth/tesla/callback?code=test_code"
   
   # Android testing
   adb shell am start \
     -W -a android.intent.action.VIEW \
     -d "voltracker://auth/tesla/callback?code=test_code"
   ```

## Dependencies
- **Enables**: T03a_S03_iOS_App_Store_Deployment, T03b_S03_Android_Play_Store_Deployment
- **Depends On**: Tesla API registration, App design completion
- **Related**: Authentication and security tasks

## Success Criteria
- [ ] OAuth redirect URIs configured for both platforms
- [ ] Deep linking works for Tesla authentication callbacks
- [ ] Secure token storage implemented and tested
- [ ] App icons generated for all required resolutions
- [ ] Splash screens implemented for both platforms
- [ ] Store listing assets created and optimized
- [ ] Security measures implemented (certificate pinning, secure storage)
- [ ] Build configuration supports both development and production
- [ ] Cross-platform OAuth flow tested and verified

## Testing Strategy
1. **OAuth Integration Testing**
   - Test Tesla authentication flow on iOS
   - Test Tesla authentication flow on Android
   - Verify token refresh functionality
   - Test authentication error handling

2. **Deep Link Testing**
   - Test OAuth callback handling
   - Verify app launches correctly from URLs
   - Test malformed URL handling

3. **Security Testing**
   - Verify secure token storage
   - Test biometric authentication
   - Validate certificate pinning
   - Test API key obfuscation

4. **Asset Validation**
   - Verify icons display correctly on all devices
   - Test splash screen on various screen sizes
   - Validate store assets meet platform requirements

## Files to Create/Modify
```
src/
├── services/
│   ├── oauth.mobile.ts (new)
│   ├── secureStorage.mobile.ts (new)
│   └── api.mobile.ts (new)
├── components/
│   └── SplashScreen.tsx (new)
└── config/
    └── env.js (new)

assets/
├── icon.png (1024x1024 master)
├── splash-logo.png
└── store/
    ├── ios/ (App Store assets)
    └── android/ (Play Store assets)

ios/
└── VolTracker/
    └── Info.plist (update for deep links)

android/
└── app/src/main/
    └── AndroidManifest.xml (update for deep links)

__tests__/
├── oauth.mobile.test.ts (new)
└── secureStorage.test.ts (new)
```

## Risks and Mitigation
- **Risk**: OAuth configuration errors
  - **Mitigation**: Test thoroughly on both platforms, validate redirect URIs
- **Risk**: Security vulnerabilities
  - **Mitigation**: Implement certificate pinning, use secure storage, regular security audits
- **Risk**: Asset quality issues
  - **Mitigation**: Use high-quality source assets, test on various devices
- **Risk**: Deep link conflicts
  - **Mitigation**: Use unique URL scheme, test with other apps installed

## Definition of Done
- [ ] OAuth flows configured and tested on both platforms
- [ ] Deep linking implemented and verified
- [ ] Secure storage for tokens implemented
- [ ] App icons and splash screens created
- [ ] Store listing assets prepared
- [ ] Security measures implemented and tested
- [ ] Build configuration supports production deployment
- [ ] Cross-platform compatibility verified
- [ ] Documentation updated with mobile-specific configurations

## Notes
- This task is a prerequisite for both iOS and Android store deployments
- OAuth configuration must be completed before app store submissions
- Security implementation should follow platform best practices
- Asset creation should consider both platforms' design guidelines
- Test OAuth flows thoroughly before store submission