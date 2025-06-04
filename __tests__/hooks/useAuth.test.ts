/**
 * @jest-environment jsdom
 */

// Mock modules before any imports
jest.mock('../../src/services/auth');
jest.mock('../../src/services/supabase');

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthService } from '../../src/services/auth';
import { supabase } from '../../src/services/supabase';

// Type the mocked modules
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useAuth Hook', () => {
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup AuthService mocks
    mockAuthService.getSession = jest.fn().mockResolvedValue({ session: null, error: null });
    mockAuthService.signUp = jest.fn().mockResolvedValue({ error: null });
    mockAuthService.signIn = jest.fn().mockResolvedValue({ user: null, error: null });
    mockAuthService.signOut = jest.fn().mockResolvedValue({ error: null });
    mockAuthService.resetPassword = jest.fn().mockResolvedValue({ error: null });
    
    // Setup Supabase mocks
    mockSupabase.auth.onAuthStateChange = jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    });
  });

  it('should initialize with null user and loading true, then false', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Initially should be loading
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    
    // Wait for async initialization to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // After initialization, should not be loading
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle sign up successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signUp({ email: 'test@example.com', password: 'password123' });
    });

    expect(mockAuthService.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should handle sign in successfully', async () => {
    mockAuthService.signIn.mockResolvedValue({ 
      user: { id: '123', email: 'test@example.com' } as any, 
      error: null 
    });

    const { result } = renderHook(() => useAuth());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'password123' });
    });

    expect(mockAuthService.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should handle sign out successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuthService.signOut).toHaveBeenCalled();
  });

  it('should handle authentication errors', async () => {
    const errorMessage = 'Invalid email or password';
    mockAuthService.signIn.mockResolvedValue({
      user: null,
      error: { message: errorMessage } as any
    });

    const { result } = renderHook(() => useAuth());
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn({ email: 'test@example.com', password: 'wrongpassword' });
    });

    expect(result.current.error).toBe(errorMessage);
    expect(mockAuthService.signIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
  });
});