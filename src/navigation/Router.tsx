import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from './NavigationContext';
import { LoginScreen, SignupScreen, ForgotPasswordScreen } from '../screens/auth';
import { DashboardScreen } from '../screens/dashboard';
import { TeslaCallback } from '../components';
import { LoadingSpinner } from '../components/shared';

export const Router: React.FC = () => {
  const { user, loading } = useAuth();
  const { currentRoute } = useNavigation();

  // Show loading screen while checking auth state
  if (loading) {
    return <LoadingSpinner message="Loading VolTracker..." />;
  }

  // Handle Tesla OAuth callback
  if (currentRoute === 'tesla-callback') {
    return <TeslaCallback onComplete={() => {
      // Clean up URL and navigate to appropriate screen
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }
      // Navigate based on auth state
      window.location.reload(); // Simple solution for now
    }} />;
  }

  // Authenticated user routes
  if (user) {
    switch (currentRoute) {
      case 'dashboard':
      default:
        return <DashboardScreen />;
    }
  }

  // Unauthenticated user routes
  switch (currentRoute) {
    case 'signup':
      return <SignupScreen />;
    case 'forgot-password':
      return <ForgotPasswordScreen />;
    case 'login':
    default:
      return <LoginScreen />;
  }
};