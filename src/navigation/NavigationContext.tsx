import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationContextType, RootRoutes } from './types';
import { isWeb } from '../utils/platform';

const NavigationContext = createContext<NavigationContextType | null>(null);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<keyof RootRoutes | null>('login');
  const [history, setHistory] = useState<(keyof RootRoutes)[]>(['login']);

  // Initialize route based on platform
  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      // Handle Tesla OAuth callback
      if (path.includes('/auth/callback') || searchParams.has('code')) {
        setCurrentRoute('tesla-callback');
        setHistory(['tesla-callback']);
        return;
      }
      
      // Handle other routes
      const routeName = path.replace('/', '') || 'login';
      const route = routeName as keyof RootRoutes;
      if (route && route !== 'login') {
        setCurrentRoute(route);
        setHistory([route]);
      }
    }
  }, []);

  const navigate = (route: keyof RootRoutes) => {
    if (isWeb && typeof window !== 'undefined') {
      // Update browser URL for web
      const path = route === 'login' ? '/' : `/${route}`;
      window.history.pushState({}, '', path);
    }
    
    setCurrentRoute(route);
    setHistory(prev => [...prev, route]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousRoute = newHistory[newHistory.length - 1];
      
      if (isWeb && typeof window !== 'undefined') {
        window.history.back();
      }
      
      setHistory(newHistory);
      setCurrentRoute(previousRoute);
    }
  };

  const canGoBack = () => history.length > 1;

  const contextValue: NavigationContextType = {
    navigate,
    goBack,
    canGoBack,
    currentRoute,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};