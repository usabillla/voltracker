import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';

import { useAuth } from './src/hooks/useAuth';
import { LoginScreen, SignupScreen, ForgotPasswordScreen } from './src/screens/auth';
import { DashboardScreen } from './src/screens/dashboard';
import { TeslaCallback } from './src/components';

type AuthScreen = 'login' | 'signup' | 'forgot-password';

function App(): React.JSX.Element {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [showTeslaCallback, setShowTeslaCallback] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';

  // Check if this is an OAuth callback URL
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (url.includes('/auth/callback') || url.includes('code=')) {
        setShowTeslaCallback(true);
      }
    }
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000' : '#fff',
  };

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>
            Loading VolTracker...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show Tesla callback handler if needed
  if (showTeslaCallback) {
    return (
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <TeslaCallback onComplete={() => {
          setShowTeslaCallback(false);
          // Clean up URL
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }} />
      </SafeAreaView>
    );
  }

  // Show dashboard if user is authenticated
  if (user) {
    return (
      <SafeAreaView style={[styles.container, backgroundStyle]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <DashboardScreen />
      </SafeAreaView>
    );
  }

  // Show authentication screens
  return (
    <SafeAreaView style={[styles.container, backgroundStyle]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {authScreen === 'login' && (
        <LoginScreen
          onNavigateToSignup={() => setAuthScreen('signup')}
          onNavigateToForgotPassword={() => setAuthScreen('forgot-password')}
        />
      )}

      {authScreen === 'signup' && (
        <SignupScreen
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      )}

      {authScreen === 'forgot-password' && (
        <ForgotPasswordScreen
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default App;