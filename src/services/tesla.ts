import { platformSelect } from '../utils/platform';

// Tesla Fleet API Configuration
const TESLA_CLIENT_ID = process.env.REACT_APP_TESLA_CLIENT_ID || '';
const TESLA_CLIENT_SECRET = process.env.REACT_APP_TESLA_CLIENT_SECRET || '';
const TESLA_REDIRECT_URI = process.env.REACT_APP_TESLA_REDIRECT_URI || '';

// Tesla API URLs
const TESLA_API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com';
const TESLA_AUTH_BASE = 'https://auth.tesla.com';

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
  option_codes: string;
  color?: string;
  access_type: string;
  granular_access: {
    hide_private: boolean;
  };
  tokens: string[];
  state: string;
  in_service: boolean;
  id_s: string;
  calendar_enabled: boolean;
  api_version: number;
  backseat_token?: string;
  backseat_token_updated_at?: string;
  ble_autopair_enrolled: boolean;
  command_signing: string;
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
  // Generate Tesla OAuth URL
  static generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: TESLA_CLIENT_ID,
      locale: 'en-US',
      prompt: 'login',
      redirect_uri: TESLA_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email offline_access',
      state: Math.random().toString(36).substring(2), // Generate random state
    });

    return `${TESLA_AUTH_BASE}/oauth2/v3/authorize?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  static async exchangeCodeForTokens(code: string): Promise<{ tokens: TeslaTokens | null; error: string | null }> {
    try {
      const response = await fetch(`${TESLA_AUTH_BASE}/oauth2/v3/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: TESLA_CLIENT_ID,
          client_secret: TESLA_CLIENT_SECRET,
          code,
          redirect_uri: TESLA_REDIRECT_URI,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Token exchange failed');
      }

      const tokens = await response.json();
      return { tokens, error: null };
    } catch (error) {
      return {
        tokens: null,
        error: error instanceof Error ? error.message : 'Token exchange failed',
      };
    }
  }

  // Refresh access token
  static async refreshTokens(refreshToken: string): Promise<{ tokens: TeslaTokens | null; error: string | null }> {
    try {
      const response = await fetch(`${TESLA_AUTH_BASE}/oauth2/v3/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: TESLA_CLIENT_ID,
          refresh_token: refreshToken,
        }).toString(),
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

  // Get vehicles list
  static async getVehicles(accessToken: string): Promise<{ vehicles: TeslaVehicle[] | null; error: string | null }> {
    try {
      const response = await fetch(`${TESLA_API_BASE}/api/1/vehicles`, {
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
      return { vehicles: data.response, error: null };
    } catch (error) {
      return {
        vehicles: null,
        error: error instanceof Error ? error.message : 'Failed to fetch vehicles',
      };
    }
  }

  // Get vehicle drive state
  static async getVehicleDriveState(vehicleId: number, accessToken: string): Promise<{ driveState: TeslaDriveState | null; error: string | null }> {
    try {
      const response = await fetch(`${TESLA_API_BASE}/api/1/vehicles/${vehicleId}/data_request/drive_state`, {
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

  // Platform-specific OAuth handling
  static async handleOAuth(): Promise<{ code: string | null; error: string | null }> {
    const authUrl = this.generateAuthUrl();

    const handler = platformSelect({
      web: async () => {
        // For web, redirect to Tesla OAuth
        if (typeof window !== 'undefined') {
          window.location.href = authUrl;
        }
        return { code: null, error: null };
      },
      mobile: async (): Promise<{ code: string | null; error: string | null }> => {
        // For mobile, we'll need to implement in-app browser or deep linking
        // This is a placeholder for now
        return { code: null, error: 'Mobile OAuth not implemented yet' };
      },
      default: async (): Promise<{ code: string | null; error: string | null }> => {
        return { code: null, error: 'Platform not supported' };
      },
    });

    if (!handler) {
      return { code: null, error: 'Platform not supported' };
    }

    return handler();
  }

  // Parse OAuth callback URL
  static parseCallbackUrl(url: string): { code: string | null; error: string | null } {
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      const error = urlObj.searchParams.get('error');

      if (error) {
        return { code: null, error: `OAuth error: ${error}` };
      }

      if (!code) {
        return { code: null, error: 'No authorization code received' };
      }

      return { code, error: null };
    } catch (error) {
      return {
        code: null,
        error: error instanceof Error ? error.message : 'Failed to parse callback URL',
      };
    }
  }
}
