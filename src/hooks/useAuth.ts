import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthService, AuthCredentials } from '../services/auth';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { session, error } = await AuthService.getSession();
      setState(prev => ({
        ...prev,
        session,
        user: session?.user || null,
        loading: false,
        error: error?.message || null,
      }));
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (credentials: AuthCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { user, session, error } = await AuthService.signIn(credentials);
    
    setState(prev => ({
      ...prev,
      user,
      session,
      loading: false,
      error: error?.message || null,
    }));
  };

  const signUp = async (credentials: AuthCredentials) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { user, session, error } = await AuthService.signUp(credentials);
    
    setState(prev => ({
      ...prev,
      user,
      session,
      loading: false,
      error: error?.message || null,
    }));
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await AuthService.signOut();
    
    setState(prev => ({
      ...prev,
      user: null,
      session: null,
      loading: false,
      error: error?.message || null,
    }));
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await AuthService.resetPassword(email);
    
    setState(prev => ({
      ...prev,
      loading: false,
      error: error?.message || null,
    }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };
}
