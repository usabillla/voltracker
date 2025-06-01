import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthService, type AuthState } from '../services/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial user
    AuthService.getCurrentUser().then(({ user, error }) => {
      setAuthState({
        user,
        loading: false,
        error,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange((user: User | null) => {
      setAuthState(prev => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    const { data, error } = await AuthService.signUp(email, password);

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error }));
    } else {
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    const { data, error } = await AuthService.signIn(email, password);

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error }));
    } else {
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
    }

    return { data, error };
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const { error } = await AuthService.signOut();

    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error }));
    } else {
      setAuthState({ user: null, loading: false, error: null });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await AuthService.resetPassword(email);
    return { error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};
