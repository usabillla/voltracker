---
title: Tesla OAuth Integration
type: implementation
status: in_progress
priority: high
estimated_hours: 16
assignee: Claude
tags:
  - tesla
  - oauth
  - authentication
  - cross-platform
dependencies:
  - T01_S02_Supabase_Authentication_Setup
related_files:
  - /Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/services/tesla.ts
  - /Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/hooks/useTesla.ts
  - /Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/components/TeslaCallback.tsx
  - /Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/utils/storage.ts
  - /Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/utils/env.ts
created_at: 2025-01-06
last_updated: 2025-01-06
---

# T02_S02_Tesla_OAuth_Integration

## Task Overview
Implement Tesla Fleet API OAuth integration for all platforms (iOS, Android, Web) with secure token storage, session management, and cross-platform redirect handling. Enable users to connect their Tesla account and authorize VolTracker to access vehicle data.

## Current State Analysis

### Existing Tesla Integration
Current Tesla infrastructure in VolTracker includes:
- **Tesla Service**: Basic service in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/services/tesla.ts`
- **Tesla Hook**: `useTesla` hook in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/hooks/useTesla.ts`
- **Tesla Callback**: `TeslaCallback` component in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/components/TeslaCallback.tsx`
- **Environment**: Tesla client ID and redirect URI configured in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/utils/env.ts`
- **Storage**: Cross-platform storage utility in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/utils/storage.ts`
- **Database**: Vehicle storage with tesla_tokens JSONB field

### Current Implementation Status
- ✅ Basic OAuth URL generation implemented
- ✅ Code-to-token exchange implemented
- ✅ Vehicle fetching and database storage implemented
- ✅ Cross-platform storage utilities available
- ✅ Environment configuration with validation
- ⚠️ Token refresh mechanism partially implemented
- ❌ State parameter validation missing
- ❌ Comprehensive error handling missing
- ❌ Mobile OAuth flow not fully implemented
- ❌ Token expiration management needs improvement

### Current Limitations
- OAuth flow missing state parameter validation for CSRF protection
- Limited error handling for OAuth failures and edge cases
- Token refresh mechanism needs enhancement
- Mobile platform OAuth requires deep linking setup
- No token encryption in storage (stored as plain JSON)
- Missing comprehensive session management

## Technical Guidance

### Architecture Overview
The Tesla OAuth integration follows these patterns:
1. **Service Layer**: `TeslaService` handles all Tesla API interactions
2. **Hook Layer**: `useTesla` manages state and provides React interface
3. **Component Layer**: `TeslaCallback` handles OAuth callback processing
4. **Storage Layer**: Platform-agnostic token storage with encryption
5. **Database Layer**: Supabase integration for vehicle and token persistence

### Key Files and Responsibilities

#### `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/services/tesla.ts`
- OAuth URL generation with state parameter
- Token exchange and refresh logic
- Tesla Fleet API interactions
- Error handling and validation

#### `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/hooks/useTesla.ts`
- React state management for Tesla connection
- Integration with Supabase database
- Vehicle management and selection
- Token lifecycle management

#### `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/components/TeslaCallback.tsx`
- OAuth callback URL parsing
- Cross-platform parameter extraction
- User feedback during authentication
- Navigation after completion

#### `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/utils/env.ts`
- Environment variable validation
- Tesla API configuration
- Platform-specific environment handling

### Implementation Notes

#### Current Tesla Service Enhancements Needed
The existing `TeslaService` in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/services/tesla.ts` needs:

1. **State Parameter Enhancement**: 
   - Current: `state: Math.random().toString(36).substring(2)`
   - Needed: Proper cryptographic random state generation and validation

2. **Scope Enhancement**:
   - Current: `'openid email offline_access'`
   - Needed: `'openid email offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds'`

3. **Token Management**:
   - Current: Direct storage in database
   - Needed: Secure encryption before storage

4. **Error Handling**:
   - Current: Basic try-catch with simple error messages
   - Needed: Comprehensive error categorization and user-friendly messages

#### Database Integration
The database schema in `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/database.sql` has:
- `vehicles` table with `tesla_tokens JSONB` field for storing encrypted Tesla OAuth tokens
- `tesla_id` field for Tesla's vehicle identifier
- `tesla_vehicle_id` field for Tesla API calls
- `last_sync_at` timestamp for tracking data freshness
- RLS policies for user data isolation
- Proper indexing for performance

**Migration Status**: Fixed in migrations 003-004 to align with task specification

### Phase 1: Tesla OAuth Service Enhancement

#### Enhanced Tesla Service (`/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/services/tesla.ts`)
```typescript
import { getEnvConfig } from '../utils/env';
import { platformSelect } from '../utils/platform';
import { AuthStorage } from './storage';

export interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  created_at: number;
}

export interface TeslaVehicle {
  id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes: string;
  color: string | null;
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  backseat_token: string | null;
  backseat_token_updated_at: string | null;
}

export interface TeslaOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  state: string;
}

export class TeslaService {
  private static readonly BASE_URL = 'https://auth.tesla.com/oauth2/v3';
  private static readonly API_BASE_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com';
  
  // Generate OAuth authorization URL
  static generateAuthUrl(): { url: string; state: string } {
    const config = getEnvConfig();
    const state = this.generateRandomState();
    
    const params = new URLSearchParams({
      client_id: config.teslaClientId,
      redirect_uri: config.teslaRedirectUri,
      response_type: 'code',
      scope: 'openid offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds',
      state: state,
    });

    return {
      url: `${this.BASE_URL}/authorize?${params.toString()}`,
      state,
    };
  }

  // Exchange authorization code for tokens
  static async exchangeCodeForTokens(code: string, state: string): Promise<TeslaTokens> {
    const config = getEnvConfig();
    
    const response = await fetch(`${this.BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.teslaClientId,
        code: code,
        redirect_uri: config.teslaRedirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Tesla OAuth error: ${error.error_description || error.error}`);
    }

    const tokens: TeslaTokens = await response.json();
    tokens.created_at = Date.now();
    
    // Store tokens securely
    await AuthStorage.storeTeslaTokens(tokens);
    
    return tokens;
  }

  // Refresh access token
  static async refreshAccessToken(): Promise<TeslaTokens> {
    const currentTokens = await AuthStorage.getTeslaTokens();
    if (!currentTokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const config = getEnvConfig();
    
    const response = await fetch(`${this.BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.teslaClientId,
        refresh_token: currentTokens.refresh_token,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh error: ${error.error_description || error.error}`);
    }

    const tokens: TeslaTokens = await response.json();
    tokens.created_at = Date.now();
    
    await AuthStorage.storeTeslaTokens(tokens);
    
    return tokens;
  }

  // Get valid access token (refresh if needed)
  static async getValidAccessToken(): Promise<string> {
    const tokens = await AuthStorage.getTeslaTokens();
    if (!tokens) {
      throw new Error('No Tesla tokens available');
    }

    // Check if token is expired (with 5 minute buffer)
    const isExpired = Date.now() > (tokens.created_at + (tokens.expires_in - 300) * 1000);
    
    if (isExpired) {
      const refreshedTokens = await this.refreshAccessToken();
      return refreshedTokens.access_token;
    }

    return tokens.access_token;
  }

  // Get user's Tesla vehicles
  static async getVehicles(): Promise<TeslaVehicle[]> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await fetch(`${this.API_BASE_URL}/api/1/vehicles`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || [];
  }

  // Get specific vehicle data
  static async getVehicleData(vehicleId: number): Promise<any> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await fetch(`${this.API_BASE_URL}/api/1/vehicles/${vehicleId}/vehicle_data`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  // Revoke Tesla access
  static async revokeAccess(): Promise<void> {
    try {
      const tokens = await AuthStorage.getTeslaTokens();
      if (tokens?.access_token) {
        // Revoke token with Tesla
        await fetch(`${this.BASE_URL}/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: tokens.access_token,
          }),
        });
      }
    } catch (error) {
      console.warn('Failed to revoke Tesla token:', error);
    } finally {
      // Always clear local tokens
      await AuthStorage.clearTeslaTokens();
    }
  }

  // Utility: Generate random state for OAuth
  private static generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Check if user has valid Tesla connection
  static async hasValidConnection(): Promise<boolean> {
    try {
      const tokens = await AuthStorage.getTeslaTokens();
      if (!tokens) return false;

      // Try to get vehicles to verify connection
      await this.getVehicles();
      return true;
    } catch (error) {
      console.warn('Tesla connection validation failed:', error);
      return false;
    }
  }
}
```

### Phase 2: Enhanced Token Storage Service

#### Update `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/utils/storage.ts`
The existing storage utility needs Tesla-specific methods with encryption:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { platformSelect } from '../utils/platform';
import { TeslaTokens } from './tesla';

// Storage keys
const STORAGE_KEYS = {
  TESLA_TOKENS: 'voltracker_tesla_tokens',
  TESLA_SELECTED_VEHICLE: 'voltracker_tesla_selected_vehicle',
} as const;

export class AuthStorage {
  // Tesla token storage
  static async storeTeslaTokens(tokens: TeslaTokens): Promise<void> {
    try {
      const tokenString = JSON.stringify(tokens);
      
      await platformSelect({
        web: () => localStorage.setItem(STORAGE_KEYS.TESLA_TOKENS, tokenString),
        default: () => AsyncStorage.setItem(STORAGE_KEYS.TESLA_TOKENS, tokenString),
      })();
    } catch (error) {
      console.error('Failed to store Tesla tokens:', error);
      throw new Error('Failed to store Tesla authentication');
    }
  }

  static async getTeslaTokens(): Promise<TeslaTokens | null> {
    try {
      const tokenString = await platformSelect({
        web: () => localStorage.getItem(STORAGE_KEYS.TESLA_TOKENS),
        default: () => AsyncStorage.getItem(STORAGE_KEYS.TESLA_TOKENS),
      })();

      if (!tokenString) return null;
      
      return JSON.parse(tokenString) as TeslaTokens;
    } catch (error) {
      console.error('Failed to retrieve Tesla tokens:', error);
      return null;
    }
  }

  static async clearTeslaTokens(): Promise<void> {
    try {
      await platformSelect({
        web: () => localStorage.removeItem(STORAGE_KEYS.TESLA_TOKENS),
        default: () => AsyncStorage.removeItem(STORAGE_KEYS.TESLA_TOKENS),
      })();
    } catch (error) {
      console.error('Failed to clear Tesla tokens:', error);
    }
  }

  // Selected vehicle storage
  static async storeSelectedVehicle(vehicleId: number): Promise<void> {
    try {
      await platformSelect({
        web: () => localStorage.setItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE, vehicleId.toString()),
        default: () => AsyncStorage.setItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE, vehicleId.toString()),
      })();
    } catch (error) {
      console.error('Failed to store selected vehicle:', error);
    }
  }

  static async getSelectedVehicle(): Promise<number | null> {
    try {
      const vehicleId = await platformSelect({
        web: () => localStorage.getItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE),
        default: () => AsyncStorage.getItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE),
      })();

      return vehicleId ? parseInt(vehicleId, 10) : null;
    } catch (error) {
      console.error('Failed to retrieve selected vehicle:', error);
      return null;
    }
  }

  static async clearSelectedVehicle(): Promise<void> {
    try {
      await platformSelect({
        web: () => localStorage.removeItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE),
        default: () => AsyncStorage.removeItem(STORAGE_KEYS.TESLA_SELECTED_VEHICLE),
      })();
    } catch (error) {
      console.error('Failed to clear selected vehicle:', error);
    }
  }
}
```

### Phase 3: Enhanced useTesla Hook

#### Update `/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/hooks/useTesla.ts`
Build upon the existing implementation with enhanced state management:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { TeslaService, TeslaVehicle, TeslaTokens } from '../services/tesla';
import { AuthStorage } from '../services/storage';

interface TeslaState {
  vehicles: TeslaVehicle[];
  selectedVehicle: TeslaVehicle | null;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}

interface TeslaActions {
  connectTesla: () => Promise<{ url: string; state: string }>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  disconnectTesla: () => Promise<void>;
  selectVehicle: (vehicle: TeslaVehicle) => Promise<void>;
  refreshVehicles: () => Promise<void>;
  clearError: () => void;
}

export function useTesla(): TeslaState & TeslaActions {
  const [state, setState] = useState<TeslaState>({
    vehicles: [],
    selectedVehicle: null,
    isConnected: false,
    loading: true,
    error: null,
  });

  // Initialize Tesla connection state
  useEffect(() => {
    const initializeTeslaState = async () => {
      try {
        const isConnected = await TeslaService.hasValidConnection();
        
        if (isConnected) {
          await loadVehicles();
          await loadSelectedVehicle();
        }
        
        setState(prev => ({
          ...prev,
          isConnected,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize Tesla connection',
          loading: false,
        }));
      }
    };

    initializeTeslaState();
  }, []);

  const loadVehicles = async () => {
    try {
      const vehicles = await TeslaService.getVehicles();
      setState(prev => ({ ...prev, vehicles }));
    } catch (error) {
      throw new Error(`Failed to load vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadSelectedVehicle = async () => {
    try {
      const selectedVehicleId = await AuthStorage.getSelectedVehicle();
      if (selectedVehicleId) {
        const vehicles = await TeslaService.getVehicles();
        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
        setState(prev => ({ ...prev, selectedVehicle }));
      }
    } catch (error) {
      console.warn('Failed to load selected vehicle:', error);
    }
  };

  const connectTesla = useCallback(async (): Promise<{ url: string; state: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const authData = TeslaService.generateAuthUrl();
      return authData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate Tesla auth URL';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw new Error(errorMessage);
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await TeslaService.exchangeCodeForTokens(code, state);
      await loadVehicles();
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete Tesla authentication';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
        loading: false,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  const disconnectTesla = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await TeslaService.revokeAccess();
      await AuthStorage.clearSelectedVehicle();
      
      setState(prev => ({
        ...prev,
        vehicles: [],
        selectedVehicle: null,
        isConnected: false,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect Tesla';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, []);

  const selectVehicle = useCallback(async (vehicle: TeslaVehicle) => {
    try {
      await AuthStorage.storeSelectedVehicle(vehicle.id);
      setState(prev => ({ ...prev, selectedVehicle: vehicle }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to select vehicle';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, []);

  const refreshVehicles = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await loadVehicles();
      await loadSelectedVehicle();
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh vehicles';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    connectTesla,
    handleOAuthCallback,
    disconnectTesla,
    selectVehicle,
    refreshVehicles,
    clearError,
  };
}
```

### Phase 4: Cross-Platform OAuth Handling

#### Enhanced TeslaCallback Component (`/Users/d.ordynskyi/Desktop/voltracker/VolTracker/src/components/TeslaCallback.tsx`)
Improve the existing callback component with better error handling and state validation:
```typescript
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Screen, Text, LoadingSpinner, Button } from './shared';
import { useTesla } from '../hooks/useTesla';
import { platformSelect } from '../utils/platform';

interface TeslaCallbackProps {
  route?: {
    params?: {
      code?: string;
      state?: string;
      error?: string;
    };
  };
}

export const TeslaCallback: React.FC<TeslaCallbackProps> = ({ route }) => {
  const navigation = useNavigation();
  const { handleOAuthCallback, clearError } = useTesla();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get OAuth parameters from URL or route params
        const params = platformSelect({
          web: () => {
            const urlParams = new URLSearchParams(window.location.search);
            return {
              code: urlParams.get('code'),
              state: urlParams.get('state'),
              error: urlParams.get('error'),
            };
          },
          default: () => route?.params || {},
        })();

        if (params.error) {
          throw new Error(`Tesla OAuth error: ${params.error}`);
        }

        if (!params.code || !params.state) {
          throw new Error('Missing OAuth parameters');
        }

        await handleOAuthCallback(params.code, params.state);
        setStatus('success');
        
        // Navigate back to main app after success
        setTimeout(() => {
          navigation.navigate('Main' as never);
        }, 2000);
        
      } catch (error) {
        console.error('Tesla OAuth callback error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
        setStatus('error');
      }
    };

    processCallback();
  }, [handleOAuthCallback, navigation, route]);

  const handleRetry = () => {
    clearError();
    navigation.navigate('Main' as never);
  };

  if (status === 'processing') {
    return (
      <Screen centered>
        <LoadingSpinner size="large" />
        <Text variant="h2" style={{ marginTop: 24 }}>
          Connecting to Tesla...
        </Text>
        <Text variant="body" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
          Please wait while we complete your Tesla authentication
        </Text>
      </Screen>
    );
  }

  if (status === 'success') {
    return (
      <Screen centered>
        <Text variant="h1" color="success" style={{ marginBottom: 16 }}>
          ✅ Success!
        </Text>
        <Text variant="h2" style={{ marginBottom: 8 }}>
          Tesla Connected
        </Text>
        <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
          Your Tesla account has been successfully linked to VolTracker
        </Text>
      </Screen>
    );
  }

  return (
    <Screen centered padding>
      <Text variant="h1" color="error" style={{ marginBottom: 16 }}>
        ❌ Connection Failed
      </Text>
      <Text variant="h2" style={{ marginBottom: 16 }}>
        Tesla Authentication Error
      </Text>
      <Text variant="body" color="secondary" style={{ marginBottom: 32, textAlign: 'center' }}>
        {errorMessage}
      </Text>
      <Button
        title="Try Again"
        onPress={handleRetry}
        style={{ minWidth: 200 }}
      />
    </Screen>
  );
};
```

### Phase 5: Platform-Specific OAuth URL Handling

#### Web Platform OAuth
```typescript
// src/utils/oauth.web.ts
export const openTeslaAuth = (authUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // For web, redirect to Tesla OAuth URL
    window.location.href = authUrl;
    resolve();
  });
};
```

#### Mobile Platform OAuth
```typescript
// src/utils/oauth.native.ts
import { Linking } from 'react-native';

export const openTeslaAuth = async (authUrl: string): Promise<void> => {
  const canOpen = await Linking.canOpenURL(authUrl);
  if (canOpen) {
    await Linking.openURL(authUrl);
  } else {
    throw new Error('Cannot open Tesla authentication URL');
  }
};
```

## Testing Strategy

### OAuth Flow Testing
- Complete OAuth flow on all platforms
- Error handling for declined permissions
- State parameter validation
- Token refresh functionality

### Security Testing
- Token storage encryption verification
- Secure deletion of tokens
- Protection against token leakage
- CSRF protection via state parameter

### Cross-Platform Testing
- **Web**: Browser redirect flow
- **iOS**: Deep link handling
- **Android**: Intent handling

## Error Handling

### OAuth Errors
- User denies permission
- Invalid client credentials
- Network connectivity issues
- Malformed redirect URIs
- State parameter mismatch

### API Errors
- Expired tokens
- Rate limiting
- Tesla service outages
- Invalid vehicle IDs

## Security Considerations

### OAuth Security
- PKCE flow implementation (future enhancement)
- State parameter for CSRF protection
- Secure redirect URI validation
- Token encryption in storage

### API Security
- Automatic token refresh
- Secure token transmission
- API rate limiting compliance
- Error logging without token exposure

## Actionable Subtasks

### 1. Enhance Tesla Service Security (4 hours)
- [ ] Add cryptographic state parameter generation and validation
- [ ] Update OAuth scope to include vehicle data permissions
- [ ] Implement token encryption before database storage
- [ ] Add comprehensive error categorization
- [ ] Update token refresh logic with proper error handling

### 2. Improve Token Storage (2 hours)
- [ ] Add encryption/decryption methods to storage utility
- [ ] Implement secure token validation
- [ ] Add token expiration checks with buffer time
- [ ] Create token cleanup methods

### 3. Enhance useTesla Hook (3 hours)
- [ ] Add state parameter validation in OAuth flow
- [ ] Improve error handling with user-friendly messages
- [ ] Add connection status validation
- [ ] Implement proper loading states
- [ ] Add vehicle selection persistence

### 4. Improve TeslaCallback Component (2 hours)
- [ ] Add state parameter validation
- [ ] Enhance error message display
- [ ] Improve mobile platform support
- [ ] Add retry mechanisms for failed authentication

### 5. Mobile Deep Linking Setup (3 hours)
- [ ] Configure iOS URL scheme handling
- [ ] Configure Android intent filters
- [ ] Test deep link OAuth flow
- [ ] Add fallback for unsupported browsers

### 6. Testing and Validation (2 hours)
- [ ] Test complete OAuth flow on all platforms
- [ ] Validate token refresh functionality
- [ ] Test error scenarios and edge cases
- [ ] Verify security measures

## Success Criteria

- [ ] Users can initiate Tesla OAuth on all platforms with proper state validation
- [ ] OAuth callback handling works across platforms with comprehensive error handling
- [ ] Tesla tokens are securely encrypted and stored
- [ ] Automatic token refresh functionality works with proper error recovery
- [ ] Users can view their Tesla vehicles with real-time connection status
- [ ] Vehicle selection and storage works with persistence
- [ ] Tesla disconnection clears all stored data securely
- [ ] Error states provide clear, actionable user feedback
- [ ] All flows work consistently across iOS, Android, and Web
- [ ] Security measures including CSRF protection are properly implemented

## Dependencies

### Required Packages
- `@react-native-async-storage/async-storage` (for mobile token storage)
- React Navigation (for callback screen navigation)

### Tesla API Requirements
- Valid Tesla Fleet API application
- Approved client ID and secret
- Configured redirect URIs for all platforms

## Future Enhancements

### Advanced Features
- PKCE implementation for enhanced security
- Multiple Tesla account support
- Vehicle sharing between family members
- Advanced vehicle data caching

### API Integration
- Real-time vehicle status updates
- Vehicle command execution
- Location tracking integration
- Energy usage monitoring

## Risk Mitigation

### Tesla API Changes
- Versioned API implementation
- Graceful degradation for API changes
- Error monitoring and alerting

### OAuth Security
- Regular security audits
- Token rotation best practices
- Secure storage validation

## Implementation Priority

1. **High Priority**: Core OAuth flow and token management
2. **High Priority**: Cross-platform callback handling
3. **High Priority**: Secure token storage
4. **Medium Priority**: Vehicle management interface
5. **Medium Priority**: Advanced error handling and recovery
6. **Low Priority**: Enhanced security features (PKCE)

## Output Log

[2025-06-02 18:15]: Code Review - FAIL
Result: **FAIL** - Database migrations do not align with task specifications
**Scope:** Review of commit 0d521cc containing database migrations 003_add_tesla_user_id_to_users.sql and 004_add_unique_constraint_tesla_accounts.sql
**Findings:** 
- Issue 1: Missing integration with task requirements - migrations create tesla_user_id approach not documented in task (Severity: 8/10)
- Issue 2: Inconsistent architecture pattern - conflicts with vehicles.tesla_tokens JSONB approach specified in task (Severity: 7/10)  
- Issue 3: Missing task file updates - no documentation of schema changes or progress tracking (Severity: 6/10)
**Summary:** Database migrations diverge from documented OAuth implementation pattern. Task specifies token storage in vehicles table, but migrations suggest user-based linking.
**Recommendation:** Update task documentation to reflect architectural decision, clarify token storage approach, and ensure migrations align with OAuth implementation pattern.

[2025-06-02 18:20]: Issue Resolution - PASS
Result: **PASS** - Database schema issues resolved and aligned with task specification
**Actions Taken:**
- Created migration 003_rollback_tesla_user_approach.sql to remove incorrect tesla_user_id and tesla_accounts table
- Created migration 004_enhance_tesla_oauth_support.sql to properly support Tesla OAuth via vehicles table
- Added run-migrations.js script for easy migration application
- Updated task documentation to reflect correct database architecture
**Database Schema:** Now properly implements vehicles.tesla_tokens JSONB approach as specified in task
**Status:** Ready to proceed with Tesla OAuth implementation according to T02_S02 specification