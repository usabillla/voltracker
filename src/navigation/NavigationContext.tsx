import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationContextType, RootRoutes } from './types';
import { isWeb } from '../utils/platform';

const NavigationContext = createContext<NavigationContextType | null>(null);

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<keyof RootRoutes | null>('login');
  const [currentParams, setCurrentParams] = useState<any>(null);
  const [history, setHistory] = useState<(keyof RootRoutes)[]>(['login']);

  // Initialize route based on platform
  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      
      // Handle Tesla OAuth callback
      if (path.includes('/auth/callback') || path.includes('auth/callback') || searchParams.has('code')) {
        console.log('Tesla callback detected, path:', path, 'params:', Object.fromEntries(searchParams.entries()));
        setCurrentRoute('tesla-callback');
        setHistory(['tesla-callback']);
        return;
      }
      
      // Handle other routes
      const routeName = path.replace('/', '') || 'login';
      const route = routeName as keyof RootRoutes;
      
      // Extract URL parameters
      const params: any = {};
      searchParams.forEach((value, key) => {
        params[key] = isNaN(Number(value)) ? value : Number(value);
      });
      
      if (route && route !== 'login') {
        setCurrentRoute(route);
        setCurrentParams(Object.keys(params).length > 0 ? params : null);
        setHistory([route]);
      }
    }
  }, []);

  const navigate = <T extends keyof RootRoutes>(route: T, params?: RootRoutes[T]) => {
    if (isWeb && typeof window !== 'undefined') {
      // Update browser URL for web
      let path = route === 'login' ? '/' : `/${route}`;
      if (params && typeof params === 'object') {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          searchParams.set(key, String(value));
        });
        path += `?${searchParams.toString()}`;
      }
      window.history.pushState({}, '', path);
    }
    
    setCurrentRoute(route);
    setCurrentParams(params || null);
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
    currentParams,
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