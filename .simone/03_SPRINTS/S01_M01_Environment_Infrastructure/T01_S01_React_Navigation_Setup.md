# T01_S01_React_Navigation_Setup

## Task Overview
Implement React Navigation for cross-platform navigation in VolTracker, replacing the current basic conditional rendering with a proper navigation system. This will provide a scalable foundation for future features like trip management, settings, and reporting screens.

## Current State Analysis

### Existing Navigation Pattern
The current navigation in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/App.tsx` uses basic conditional rendering:

```tsx
// Current implementation uses state-based screen switching
const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
const [showTeslaCallback, setShowTeslaCallback] = useState(false);

// Conditional rendering for different screens:
if (user) {
  return <DashboardScreen />; // Authenticated users see dashboard
}

// Auth screens use prop-based navigation callbacks
{authScreen === 'login' && (
  <LoginScreen
    onNavigateToSignup={() => setAuthScreen('signup')}
    onNavigateToForgotPassword={() => setAuthScreen('forgot-password')}
  />
)}
```

### Current Screen Structure
- **Auth Screens**: `LoginScreen`, `SignupScreen` (with manual navigation props)
- **Main Screen**: `DashboardScreen` (single authenticated view)
- **Special Handling**: `TeslaCallback` component for OAuth flows
- **Screen Organization**: Screens are organized in folders (`src/screens/auth/`, `src/screens/dashboard/`)

### Dependencies Status
Current `package.json` does **not** include React Navigation dependencies. The following packages need to be added:
- `@react-navigation/native`
- `@react-navigation/stack` or `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack` (recommended for performance)
- Platform-specific dependencies for React Native

## Technical Implementation

### Phase 1: Package Installation
Install React Navigation core and navigators:

```bash
# Core navigation
npm install @react-navigation/native @react-navigation/native-stack

# React Native dependencies (for mobile platforms)
npm install react-native-screens react-native-safe-area-context

# For iOS (if developing for iOS)
cd ios && pod install
```

### Phase 2: Navigation Structure Design

#### Proposed Navigation Hierarchy
```
Root Navigator (Stack)
├── AuthNavigator (Stack)
│   ├── LoginScreen
│   ├── SignupScreen
│   └── ForgotPasswordScreen
├── MainNavigator (Tabs/Stack)
│   ├── DashboardScreen
│   ├── TripsNavigator (Future)
│   └── SettingsScreen (Future)
└── TeslaCallbackScreen (Modal/Overlay)
```

#### Navigation Types Definition
Create `src/types/navigation.ts`:

```typescript
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TeslaCallback: { code?: string; state?: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  // Future screens will be added here
};
```

### Phase 3: Navigator Setup

#### Root Navigator (`src/navigation/RootNavigator.tsx`)
```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import TeslaCallbackScreen from '../screens/TeslaCallbackScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
      <Stack.Screen 
        name="TeslaCallback" 
        component={TeslaCallbackScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
```

#### Authentication Navigator (`src/navigation/AuthNavigator.tsx`)
```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
```

### Phase 4: Screen Refactoring

#### Update LoginScreen
Remove navigation props and use React Navigation:

```tsx
// Remove these props
interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

// Replace with navigation hook
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  // Replace prop calls with navigation calls
  onPress={() => navigation.navigate('Signup')}
  onPress={() => navigation.navigate('ForgotPassword')}
}
```

#### Update SignupScreen
Similar refactoring to remove props and use navigation hooks.

#### Create ForgotPasswordScreen
Convert the current inline forgot password UI into a proper screen component.

### Phase 5: App.tsx Integration

#### Updated App.tsx Structure
```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

### Phase 6: Web Platform Considerations

#### Web-Specific Setup
For React Native Web compatibility:
```bash
npm install @react-navigation/web
```

#### URL Handling for Tesla OAuth
Ensure Tesla callback URLs work with React Navigation's web linking:

```tsx
// In NavigationContainer
const linking = {
  prefixes: ['https://voltracker.com', 'https://www.voltracker.com'],
  config: {
    screens: {
      TeslaCallback: 'auth/tesla/callback',
    },
  },
};

<NavigationContainer linking={linking}>
```

## Integration with Existing Auth Flow

### Auth State Management
The existing `useAuth` hook in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/hooks/useAuth.ts` will continue to work. The navigation will react to auth state changes:

```tsx
// In RootNavigator
const { user, loading } = useAuth();

// Navigation automatically switches based on auth state
{user ? (
  <Stack.Screen name="Main" component={MainNavigator} />
) : (
  <Stack.Screen name="Auth" component={AuthNavigator} />
)}
```

### Tesla OAuth Integration
The existing Tesla callback handling will be moved to a dedicated screen:

```tsx
// TeslaCallbackScreen.tsx
export default function TeslaCallbackScreen({ route }: Props) {
  const { code, state } = route.params || {};
  
  return <TeslaCallback onComplete={() => {
    // Navigate back to main app
    navigation.navigate('Main');
  }} />;
}
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Login flow navigation works
- [ ] Signup flow navigation works
- [ ] Forgot password navigation works
- [ ] Auth state changes trigger navigation updates
- [ ] Tesla OAuth callback handling works
- [ ] Web platform navigation works correctly
- [ ] Mobile platform navigation works correctly

### Platform-Specific Testing
- **Web**: Test in browser with React Native Web
- **iOS**: Test with iOS simulator/device
- **Android**: Test with Android emulator/device

## Future Extensibility

### Adding New Screens
With React Navigation in place, adding new screens becomes straightforward:

```tsx
// Add to MainStackParamList
export type MainStackParamList = {
  Dashboard: undefined;
  Trips: undefined;
  TripDetail: { tripId: string };
  Settings: undefined;
  Profile: undefined;
};

// Add to MainNavigator
<Stack.Screen name="Trips" component={TripsScreen} />
<Stack.Screen name="TripDetail" component={TripDetailScreen} />
```

### Bottom Tab Navigation
Future consideration for main app navigation:

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Replace MainNavigator with tabs
const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Trips" component={TripsNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
```

## Implementation Priority

1. **High Priority**: Auth navigation (Login, Signup, Forgot Password)
2. **High Priority**: Tesla callback screen integration
3. **Medium Priority**: Web platform linking configuration
4. **Low Priority**: Future screen preparation (tabs, additional screens)

## Risk Mitigation

### Breaking Changes
- **Current Issue**: Screen components use navigation props
- **Solution**: Gradual migration with backward compatibility during transition

### Cross-Platform Compatibility
- **Current Issue**: Different behavior on web vs mobile
- **Solution**: Platform-specific configuration and testing

### Bundle Size
- **Current Issue**: React Navigation adds dependencies
- **Solution**: Use tree-shaking and only import needed navigators

## Dependencies Impact

### New Dependencies Added
```json
{
  "dependencies": {
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "react-native-screens": "^3.27.0",
    "react-native-safe-area-context": "^4.8.2"
  }
}
```

### Bundle Size Impact
Estimated addition: ~50KB gzipped for core navigation functionality.

## Success Criteria

- [ ] All existing navigation flows work identically
- [ ] Code is more maintainable and scalable
- [ ] No regression in auth flow functionality
- [ ] Tesla OAuth integration continues to work
- [ ] Cross-platform compatibility maintained
- [ ] Foundation ready for future feature additions

## Technical Debt Resolution

This task addresses several technical debt items:
1. **Manual Navigation Management**: Replaces useState-based navigation
2. **Prop Drilling**: Eliminates navigation prop passing
3. **Scalability Issues**: Provides structure for future screens
4. **URL Handling**: Improves web platform URL management
5. **Code Organization**: Better separation of navigation concerns

## Post-Implementation

### Documentation Updates
- Update README.md with navigation structure
- Document navigation patterns for future developers
- Create navigation testing guidelines

### Future Enhancements
- Deep linking configuration
- Navigation analytics
- Screen transition animations
- Navigation state persistence