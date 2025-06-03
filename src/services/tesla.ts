import { platformSelect } from '../utils/platform';
import { getEnvConfig } from '../utils/env';
import { SecureStorage } from './secureStorage';
import { validateTeslaToken, logSecurityEvent, sanitizeString, validateOAuthState } from '../utils/security';

// Get validated environment configuration
const envConfig = getEnvConfig();

// Tesla Fleet API Configuration
const TESLA_CLIENT_ID = envConfig.teslaClientId;
const TESLA_REDIRECT_URI = envConfig.teslaRedirectUri;
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET || '';

// Tesla API URLs - Support multiple regions
const TESLA_AUTH_BASE = 'https://auth.tesla.com';

// Tesla Fleet API regions
const TESLA_REGIONS = {
  'na': 'https://fleet-api.prd.na.vn.cloud.tesla.com', // North America
  'eu': 'https://fleet-api.prd.eu.vn.cloud.tesla.com', // Europe/Middle East/Africa
  'ap': 'https://fleet-api.prd.ap.vn.cloud.tesla.com', // Asia-Pacific
} as const;

type TeslaRegion = keyof typeof TESLA_REGIONS;

// Get Tesla API base URL for region (default to North America)
const getTeslaApiBase = (region: TeslaRegion = 'na'): string => {
  return TESLA_REGIONS[region];
};

export interface TeslaTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

export interface TeslaVehicle {
  id: number;
  user_id: number;
  vehicle_id: number;
  vin: string;
  display_name: string;
  option_codes?: string;
  color?: string;
  access_type?: string;
  granular_access?: {
    hide_private: boolean;
  };
  tokens?: string[];
  state: string;
  in_service?: boolean;
  id_s?: string;
  calendar_enabled?: boolean;
  api_version?: number;
  backseat_token?: string;
  backseat_token_updated_at?: string;
  ble_autopair_enrolled?: boolean;
  command_signing?: string;
  // Database fields
  tesla_id?: string;
  model?: string;
  year?: number;
  tesla_tokens?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeslaDriveState {
  gps_as_of: number;
  heading: number;
  latitude: number;
  longitude: number;
  native_latitude: number;
  native_longitude: number;
  native_location_supported: number;
  native_type: string;
  power: number;
  shift_state?: string;
  speed?: number;
  timestamp: number;
}

export class TeslaService {
  // Generate Tesla OAuth URL with state parameter
  static generateAuthUrl(): { url: string; state: string } {
    const state = this.generateRandomState();
    
    // Use proper Fleet API scopes
    const params = new URLSearchParams({
      client_id: TESLA_CLIENT_ID,
      redirect_uri: TESLA_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds',
      state: state,
    });

    const oauthUrl = `${TESLA_AUTH_BASE}/oauth2/v3/authorize?${params.toString()}`;
    console.log('Generated Tesla OAuth URL:', oauthUrl);
    console.log('OAuth parameters:', Object.fromEntries(params.entries()));
    
    return {
      url: oauthUrl,
      state,
    };
  }

  // Generate cryptographically secure random state
  private static generateRandomState(): string {
    const array = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Exchange authorization code for tokens via backend proxy
  static async exchangeCodeForTokens(code: string, userId: string, state?: string): Promise<{ tokens: TeslaTokens | null; error: string | null }> {
    try {
      console.log('Starting token exchange with code:', code.substring(0, 10) + '...');
      
      // Use backend proxy to avoid CORS issues
      const requestBody = {
        code,
        redirect_uri: TESLA_REDIRECT_URI,
      };
      
      console.log('Token exchange request via backend proxy:', requestBody);
      
      const response = await fetch('/api/tesla/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Token exchange response status:', response.status);
      console.log('Token exchange response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'Unknown error', error_description: errorText };
        }
        throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
      }

      const tokens = await response.json();
      console.log('Token exchange successful, received tokens:', {
        access_token: tokens.access_token ? 'present' : 'missing',
        refresh_token: tokens.refresh_token ? 'present' : 'missing',
        expires_in: tokens.expires_in
      });
      
      // Validate token structure for security
      const tokenValidation = validateTeslaToken(tokens);
      if (!tokenValidation.isValid) {
        console.error('Token validation failed:', tokenValidation.error);
        logSecurityEvent('tesla_token_validation_failed', { reason: tokenValidation.error });
        throw new Error('Invalid token structure received from Tesla');
      }

      // Store tokens securely with encryption
      await SecureStorage.storeTeslaTokens(tokens, userId);

      logSecurityEvent('tesla_token_exchange_success', { tokenType: tokens.token_type, userId });
      return { tokens, error: null };
    } catch (error) {
      console.error('Token exchange error:', error);
      logSecurityEvent('tesla_token_exchange_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        tokens: null,
        error: error instanceof Error ? error.message : 'Token exchange failed',
      };
    }
  }

  // Refresh access token via backend proxy
  static async refreshTokens(refreshToken: string): Promise<{ tokens: TeslaTokens | null; error: string | null }> {
    try {
      const response = await fetch('/api/tesla/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Token refresh failed');
      }

      const tokens = await response.json();
      return { tokens, error: null };
    } catch (error) {
      return {
        tokens: null,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  // Get vehicles list - tries all regions automatically
  static async getVehicles(accessToken: string): Promise<{ vehicles: TeslaVehicle[] | null; error: string | null }> {
    const regions: TeslaRegion[] = ['na', 'eu', 'ap'];
    let lastError: string | null = null;

    for (const region of regions) {
      try {
        console.log(`Trying Tesla ${region.toUpperCase()} region...`);
        const apiBase = getTeslaApiBase(region);
        const response = await fetch(`${apiBase}/api/1/vehicles`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token issue, don't try other regions
            return { vehicles: null, error: 'Access token expired' };
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Found vehicles in ${region.toUpperCase()} region:`, data.response?.length || 0);
        return { vehicles: data.response, error: null };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Failed to fetch vehicles';
        console.log(`${region.toUpperCase()} region failed:`, lastError);
        continue;
      }
    }

    return {
      vehicles: null,
      error: `Failed to fetch vehicles from all regions. Last error: ${lastError}`,
    };
  }

  // Get comprehensive vehicle data (charge state, drive state, vehicle state, etc.)
  static async getVehicleData(vehicleId: number, accessToken: string, region: TeslaRegion = 'na'): Promise<{ vehicleData: any | null; error: string | null }> {
    try {
      // Check if this is a test token - use mock data for development/testing
      if (accessToken.startsWith('test_')) {
        console.log('Using mock Tesla API data for testing');
        const { MockTeslaAPI } = await import('./tesla.mock');
        const mockData = MockTeslaAPI.getVehicleData(vehicleId);
        
        if (!mockData) {
          throw new Error('Mock vehicle not found');
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return { vehicleData: mockData, error: null };
      }

      const apiBase = getTeslaApiBase(region);
      const response = await fetch(`${apiBase}/api/1/vehicles/${vehicleId}/vehicle_data`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Access token expired');
        }
        if (response.status === 408) {
          throw new Error('Vehicle is asleep. Try waking it up first.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { vehicleData: data.response, error: null };
    } catch (error) {
      return {
        vehicleData: null,
        error: error instanceof Error ? error.message : 'Failed to fetch vehicle data',
      };
    }
  }

  // Get vehicle drive state
  static async getVehicleDriveState(vehicleId: number, accessToken: string, region: TeslaRegion = 'na'): Promise<{ driveState: TeslaDriveState | null; error: string | null }> {
    try {
      const apiBase = getTeslaApiBase(region);
      const response = await fetch(`${apiBase}/api/1/vehicles/${vehicleId}/data_request/drive_state`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Access token expired');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { driveState: data.response, error: null };
    } catch (error) {
      return {
        driveState: null,
        error: error instanceof Error ? error.message : 'Failed to fetch drive state',
      };
    }
  }

  // Wake up a sleeping vehicle
  static async wakeVehicle(vehicleId: number, accessToken: string, region: TeslaRegion = 'na'): Promise<{ success: boolean; error: string | null }> {
    try {
      const apiBase = getTeslaApiBase(region);
      const response = await fetch(`${apiBase}/api/1/vehicles/${vehicleId}/wake_up`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Access token expired');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to wake vehicle',
      };
    }
  }

  // Platform-specific OAuth handling
  static async handleOAuth(): Promise<{ code: string | null; state: string | null; error: string | null }> {
    console.log('TeslaService.handleOAuth called');
    const { url: authUrl, state } = this.generateAuthUrl();
    console.log('Generated auth URL:', authUrl);
    console.log('Generated state:', state);

    const handler = platformSelect({
      web: async () => {
        console.log('Using web OAuth handler');
        // For web, redirect to Tesla OAuth
        if (typeof window !== 'undefined') {
          console.log('Window available, storing state and redirecting...');
          // Store state for verification using secure storage
          await SecureStorage.storeOAuthState(state);
          console.log('State stored, redirecting to:', authUrl);
          window.location.href = authUrl;
        } else {
          console.error('Window not available for redirect');
        }
        return { code: null, state, error: null };
      },
      mobile: async (): Promise<{ code: string | null; state: string | null; error: string | null }> => {
        try {
          // For React Native, use Linking to open the OAuth URL
          const { Linking } = require('react-native');
          
          // Store state for verification using secure storage
          await SecureStorage.storeOAuthState(state);
          
          const canOpen = await Linking.canOpenURL(authUrl);
          if (canOpen) {
            await Linking.openURL(authUrl);
            return { code: null, state, error: null };
          } else {
            throw new Error('Cannot open Tesla authentication URL');
          }
        } catch (error) {
          return { 
            code: null, 
            state: null, 
            error: error instanceof Error ? error.message : 'Mobile OAuth failed' 
          };
        }
      },
      default: async (): Promise<{ code: string | null; state: string | null; error: string | null }> => {
        return { code: null, state: null, error: 'Platform not supported' };
      },
    });

    if (!handler) {
      return { code: null, state: null, error: 'Platform not supported' };
    }

    return handler();
  }

  // Parse OAuth callback URL with enhanced state validation
  static async parseCallbackUrl(url: string): Promise<{ code: string | null; state: string | null; error: string | null }> {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state');
      const error = urlObj.searchParams.get('error');

      if (error) {
        logSecurityEvent('tesla_oauth_error', { error: sanitizeString(error) });
        return { code: null, state, error: `OAuth error: ${error}` };
      }

      if (!code) {
        logSecurityEvent('tesla_oauth_missing_code', {});
        return { code: null, state, error: 'No authorization code received' };
      }

      if (!state) {
        logSecurityEvent('tesla_oauth_missing_state', {});
        return { code: null, state, error: 'No state parameter received' };
      }

      // Enhanced state validation using security utility
      const storedState = await SecureStorage.getOAuthState();
      const stateValidation = validateOAuthState(state, storedState);
      
      if (!stateValidation.isValid) {
        logSecurityEvent('tesla_oauth_state_validation_failed', { 
          error: stateValidation.error,
          hasStoredState: !!storedState 
        });
        
        // Clear potentially compromised state
        await SecureStorage.clearOAuthState();
        
        return { code: null, state, error: stateValidation.error || 'State validation failed' };
      }

      // Clear stored state after successful validation
      await SecureStorage.clearOAuthState();
      
      logSecurityEvent('tesla_oauth_callback_success', { hasCode: !!code, hasState: !!state });

      return { code, state, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse callback URL';
      logSecurityEvent('tesla_oauth_callback_parse_error', { error: errorMessage });
      
      return {
        code: null,
        state: null,
        error: errorMessage,
      };
    }
  }
}
