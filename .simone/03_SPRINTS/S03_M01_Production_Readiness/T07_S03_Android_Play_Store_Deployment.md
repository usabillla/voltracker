# T03b_S03_Android_Play_Store_Deployment

## Task Overview
**Task ID**: T03b_S03_Android_Play_Store_Deployment  
**Sprint**: S03  
**Complexity**: Medium  
**Parent Task**: T03_S03_Mobile_App_Store_Deployment  
**Assignee**: TBD  
**Status**: Not Started  

## Objective
Deploy VolTracker Android application to the Google Play Store with proper signing, configuration, and submission process.

## Scope
Focus specifically on Android-specific deployment requirements including:
- Android app signing and keystore management
- Gradle build configuration for production
- Google Play Store submission and review process
- Android-specific assets and metadata

## Prerequisites
- [ ] Completed mobile OAuth asset configuration (T03c_S03_Mobile_OAuth_Asset_Configuration)
- [ ] Google Play Developer account ($25 one-time fee)
- [ ] Android development environment properly set up
- [ ] Google Play Console access configured

## Technical Requirements

### Android App Signing
- [ ] Generate production signing keystore
- [ ] Configure Gradle for release signing
- [ ] Enable Play App Signing (recommended)
- [ ] Validate signing configuration

### Gradle Configuration
- [ ] Update Android compile and target SDK versions
- [ ] Configure build variants for production
- [ ] Set proper application ID
- [ ] Configure ProGuard/R8 for code obfuscation
- [ ] Add required permissions and features

### Play Store Assets
- [ ] High-res app icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Phone screenshots (min 2, max 8)
- [ ] Tablet screenshots (7" and 10")
- [ ] App description and short description
- [ ] Privacy policy URL

### Build Configuration
- [ ] Create release build variant
- [ ] Configure signing configurations
- [ ] Enable code shrinking and obfuscation
- [ ] Optimize APK/AAB size
- [ ] Test release build on physical devices

### Play Store Metadata
- [ ] App title and short description
- [ ] Full description and feature highlights
- [ ] Category and content rating
- [ ] Target audience and age rating
- [ ] Store listing contacts

## Implementation Steps

### Phase 1: Keystore and Signing Setup
1. **Generate Release Keystore**
   ```bash
   keytool -genkey -v -keystore voltracker-release-key.keystore \
     -alias voltracker -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Gradle Signing**
   ```gradle
   // android/app/build.gradle
   android {
     signingConfigs {
       release {
         storeFile file('voltracker-release-key.keystore')
         storePassword System.getenv("KEYSTORE_PASSWORD")
         keyAlias 'voltracker'
         keyPassword System.getenv("KEY_PASSWORD")
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
         minifyEnabled true
         proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
       }
     }
   }
   ```

3. **Secure Keystore Storage**
   - Store keystore securely (not in version control)
   - Set up environment variables for passwords
   - Create backup of keystore

### Phase 2: Build Configuration
1. **Update Build Settings**
   ```gradle
   // android/app/build.gradle
   android {
     compileSdkVersion 34
     targetSdkVersion 34
     minSdkVersion 21
     
     defaultConfig {
       applicationId "com.voltracker.app"
       versionCode 1
       versionName "1.0.0"
     }
   }
   ```

2. **Permissions Configuration**
   ```xml
   <!-- android/app/src/main/AndroidManifest.xml -->
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.WAKE_LOCK" />
   ```

3. **ProGuard Configuration**
   ```pro
   # android/app/proguard-rules.pro
   -keep class com.voltracker.** { *; }
   -keep class com.facebook.react.** { *; }
   -dontwarn com.facebook.react.**
   ```

### Phase 3: Asset Preparation
1. **App Icon Generation**
   - Create adaptive icon (XML + PNG)
   - Generate all density variants
   - Update mipmap directories

2. **Play Store Graphics**
   ```
   Required Assets:
   - App icon: 512x512 PNG
   - Feature graphic: 1024x500 JPG/PNG
   - Screenshots: 1080x1920, 1440x2560, 2560x1440
   ```

3. **Launcher Icon Setup**
   ```xml
   <!-- android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml -->
   <adaptive-icon>
     <background android:drawable="@drawable/ic_launcher_background" />
     <foreground android:drawable="@drawable/ic_launcher_foreground" />
   </adaptive-icon>
   ```

### Phase 4: Build and Test
1. **Generate Release Build**
   ```bash
   cd android
   ./gradlew bundleRelease
   # Creates: app/build/outputs/bundle/release/app-release.aab
   ```

2. **Testing Release Build**
   ```bash
   # Install and test release build
   ./gradlew installRelease
   # Test on multiple Android devices
   # Verify OAuth flows work
   # Test Tesla API integration
   ```

3. **Bundle Analysis**
   ```bash
   # Analyze bundle size and contents
   bundletool build-apks --bundle=app-release.aab \
     --output=voltracker.apks
   ```

### Phase 5: Play Store Submission
1. **Google Play Console Setup**
   - Create new application
   - Set up app information
   - Configure content rating

2. **Store Listing**
   ```
   Title: VolTracker - Tesla Vehicle Management
   Short Description: Track and manage your Tesla vehicles
   Full Description: [Detailed app description with features]
   ```

3. **Upload App Bundle**
   - Upload AAB file to Play Console
   - Configure release notes
   - Set rollout percentage

4. **Review and Publish**
   - Submit for review
   - Monitor review status
   - Address any policy violations

## Dependencies
- **Blocks**: T03a_S03_iOS_App_Store_Deployment
- **Depends On**: T03c_S03_Mobile_OAuth_Asset_Configuration
- **Related**: Mobile app architecture tasks

## Success Criteria
- [ ] Android app successfully builds for Play Store distribution
- [ ] All Google Play policies are met
- [ ] App submitted to Play Store without errors
- [ ] App passes Google Play review process
- [ ] VolTracker Android app is live and available for download
- [ ] OAuth integration works properly on Android
- [ ] Tesla API integration functions correctly

## Testing Strategy
1. **Pre-submission Testing**
   - Test on multiple Android devices and OS versions
   - Verify all app features work correctly
   - Test OAuth authentication flow
   - Validate Tesla vehicle data retrieval
   - Test different screen sizes and densities

2. **Performance Testing**
   - App startup time optimization
   - Memory usage optimization
   - Battery usage validation
   - Network efficiency testing

3. **Compliance Testing**
   - Google Play policy compliance
   - Privacy policy compliance
   - Tesla API terms compliance
   - Target SDK compliance

## Files to Modify/Create
```
android/
├── app/
│   ├── build.gradle (update for release)
│   ├── proguard-rules.pro (add rules)
│   ├── voltracker-release-key.keystore (new)
│   └── src/main/
│       ├── AndroidManifest.xml (update permissions)
│       └── res/
│           ├── mipmap-*/ (app icons)
│           └── drawable/ (adaptive icon assets)
├── gradle.properties (signing config)
└── local.properties (keystore paths)

Play Console/
├── Store listing assets
├── Screenshots
├── App description
└── Privacy policy
```

## Risks and Mitigation
- **Risk**: Google Play policy violation
  - **Mitigation**: Review policies thoroughly, test compliance
- **Risk**: Keystore loss
  - **Mitigation**: Secure backup, use Play App Signing
- **Risk**: Build failures
  - **Mitigation**: Test builds early, maintain dependencies
- **Risk**: Tesla API compliance
  - **Mitigation**: Review Tesla developer terms, implement proper attribution

## Environment Variables Required
```bash
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_PASSWORD="your_key_password"
export VOLTRACKER_UPLOAD_STORE_FILE="voltracker-release-key.keystore"
export VOLTRACKER_UPLOAD_KEY_ALIAS="voltracker"
```

## Definition of Done
- [ ] Android app builds successfully for Play Store
- [ ] All required assets and metadata uploaded
- [ ] App submitted to Google Play for review
- [ ] App approved and published to Play Store
- [ ] Download and installation tested from Play Store
- [ ] All core features verified in production environment
- [ ] App bundle optimized for size and performance

## Notes
- Use Android App Bundle (AAB) format for better optimization
- Enable Play App Signing for easier key management
- Coordinate with iOS deployment for simultaneous launch
- Plan for gradual rollout (start with 5% of users)
- Monitor crash reports and user feedback post-launch