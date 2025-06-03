import { useState, useEffect } from 'react';
import { TeslaService, type TeslaVehicle, type TeslaTokens } from '../services/tesla';
import { SecureStorage } from '../services/secureStorage';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface TeslaState {
  vehicles: TeslaVehicle[];
  selectedVehicle: TeslaVehicle | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

export const useTesla = () => {
  const { user } = useAuth();
  const [teslaState, setTeslaState] = useState<TeslaState>({
    vehicles: [],
    selectedVehicle: null,
    loading: false,
    error: null,
    isConnected: false,
  });

  // Check if user has connected Tesla account
  useEffect(() => {
    if (!user) {return;}

    const checkTeslaConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {throw error;}

        const vehicleList = (data || []).map(vehicle => ({
          ...vehicle,
          // Set default values for Tesla API fields that might not be in database
          state: vehicle.state || 'offline',
          api_version: vehicle.api_version || 1,
          option_codes: vehicle.option_codes || '',
          model: vehicle.model || parseModelFromVin(vehicle.vin || ''),
          color: vehicle.color || 'Unknown',
        }));
        
        console.log('Loading vehicles - Vehicle count:', vehicleList.length);
        console.log('Available vehicles:', vehicleList.map(v => ({ 
          id: v.id, 
          tesla_id: v.tesla_id, 
          name: v.display_name,
          model: v.model,
          color: v.color 
        })));
        
        // Simplified selection: always select first vehicle if we have any
        let finalSelectedVehicle = null;
        if (vehicleList.length > 0) {
          finalSelectedVehicle = vehicleList[0];
          console.log('SIMPLIFIED SELECTION: Selected first vehicle:', finalSelectedVehicle.display_name);
          
          // Store the selection
          const teslaId = finalSelectedVehicle.tesla_id || finalSelectedVehicle.id?.toString();
          if (teslaId) {
            await SecureStorage.storeSelectedVehicle(teslaId);
            console.log('Stored Tesla ID:', teslaId);
          }
        }

        console.log('Setting Tesla state - vehicles:', vehicleList.length, 'selectedVehicle:', finalSelectedVehicle?.display_name);
        
        setTeslaState(prev => ({
          ...prev,
          vehicles: vehicleList,
          selectedVehicle: finalSelectedVehicle,
          isConnected: vehicleList.length > 0,
        }));
      } catch (error) {
        setTeslaState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to check Tesla connection',
        }));
      }
    };

    checkTeslaConnection();
  }, [user]);

  const connectTesla = async () => {
    console.log('connectTesla called');
    setTeslaState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Clear any existing OAuth state/tokens to ensure fresh flow
      await SecureStorage.clearOAuthState();
      console.log('Cleared OAuth state for fresh Tesla connection');
      
      console.log('Calling TeslaService.handleOAuth()');
      const { code, state, error } = await TeslaService.handleOAuth();
      console.log('handleOAuth result:', { code: code ? 'present' : 'null', state: state ? 'present' : 'null', error });

      if (error) {
        throw new Error(error);
      }

      // For web, the redirect will happen, so we don't need to continue here
      // For mobile, the code might be returned directly (future implementation)
      if (code && state) {
        await exchangeCodeForTokens(code, state);
      }
    } catch (error) {
      console.error('connectTesla error:', error);
      setTeslaState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to connect Tesla',
      }));
    }
  };

  const exchangeCodeForTokens = async (code: string, state?: string) => {
    console.log('exchangeCodeForTokens called with code:', code.substring(0, 10) + '...');
    
    if (!user) {
      console.error('User not authenticated');
      setTeslaState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    try {
      console.log('Starting token exchange...');
      // Exchange code for tokens with user ID for secure storage
      const { tokens, error: tokenError } = await TeslaService.exchangeCodeForTokens(code, user.id, state);

      if (tokenError || !tokens) {
        console.error('Token exchange failed:', tokenError);
        throw new Error(tokenError || 'Failed to get tokens');
      }

      console.log('Token exchange successful, fetching vehicles...');
      // Get vehicles from Tesla API
      const { vehicles, error: vehiclesError } = await TeslaService.getVehicles(tokens.access_token);

      if (vehiclesError || !vehicles) {
        console.error('Failed to get vehicles:', vehiclesError);
        throw new Error(vehiclesError || 'Failed to get vehicles');
      }

      console.log('Got vehicles from Tesla:', vehicles.length);

      // Save vehicles to database
      for (const vehicle of vehicles) {
        console.log('Saving vehicle to database:', vehicle.display_name);
        const { error: saveError } = await supabase
          .from('vehicles')
          .upsert({
            user_id: user.id,
            tesla_id: vehicle.id.toString(),
            vin: vehicle.vin,
            display_name: vehicle.display_name,
            model: parseModelFromVin(vehicle.vin),
            year: parseYearFromVin(vehicle.vin),
            color: vehicle.color || 'Unknown',
            tesla_tokens: {
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            },
            is_active: true,
          }, {
            onConflict: 'tesla_id',
          });

        if (saveError) {
          console.error('Error saving vehicle:', saveError);
        } else {
          console.log('Vehicle saved successfully:', vehicle.display_name);
        }
      }

      console.log('Tesla connection completed successfully');
      
      // Auto-select the first vehicle if none is selected
      const currentSelectedTeslaId = await SecureStorage.getSelectedVehicle();
      let selectedVehicle = null;
      
      if (!currentSelectedTeslaId && vehicles.length > 0) {
        console.log('Auto-selecting first vehicle:', vehicles[0].display_name);
        selectedVehicle = vehicles[0];
        // Use Tesla ID for selection, not database UUID
        await SecureStorage.storeSelectedVehicle(vehicles[0].id.toString());
      } else if (currentSelectedTeslaId) {
        selectedVehicle = vehicles.find(v => v.id.toString() === currentSelectedTeslaId) || null;
      }

      setTeslaState(prev => ({
        ...prev,
        vehicles,
        selectedVehicle,
        loading: false,
        isConnected: true,
        error: null,
      }));

    } catch (error) {
      console.error('exchangeCodeForTokens error:', error);
      setTeslaState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to complete Tesla connection',
      }));
    }
  };

  const refreshVehicles = async () => {
    if (!user) {return;}

    setTeslaState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get stored vehicles with tokens
      const { data: storedVehicles, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (fetchError) {throw fetchError;}

      if (!storedVehicles?.length) {
        throw new Error('No connected vehicles found');
      }

      // Use the first vehicle's token to fetch updated data
      const firstVehicle = storedVehicles[0];
      const tokens = firstVehicle.tesla_tokens as any;

      // Check if token needs refresh
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();

      let accessToken = tokens.access_token;

      if (expiresAt <= now) {
        // Token expired, refresh it
        const { tokens: newTokens, error: refreshError } = await TeslaService.refreshTokens(tokens.refresh_token);

        if (refreshError || !newTokens) {
          throw new Error('Failed to refresh Tesla tokens');
        }

        accessToken = newTokens.access_token;

        // Update stored tokens
        await supabase
          .from('vehicles')
          .update({
            tesla_tokens: {
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            },
          })
          .eq('id', firstVehicle.id);
      }

      // Fetch updated vehicles from Tesla
      const { vehicles, error: vehiclesError } = await TeslaService.getVehicles(accessToken);

      if (vehiclesError || !vehicles) {
        throw new Error(vehiclesError || 'Failed to fetch vehicles');
      }

      // Update selected vehicle if it was refreshed
      const selectedVehicleId = await SecureStorage.getSelectedVehicle();
      const selectedVehicle = selectedVehicleId 
        ? vehicles.find(v => v.id === selectedVehicleId) || null
        : null;

      setTeslaState(prev => ({
        ...prev,
        vehicles,
        selectedVehicle,
        loading: false,
        error: null,
      }));

    } catch (error) {
      setTeslaState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh vehicles',
      }));
    }
  };

  const selectVehicle = async (vehicle: TeslaVehicle) => {
    try {
      // Use Tesla ID for consistent selection (vehicles from API use Tesla ID, database vehicles use tesla_id field)
      const teslaId = vehicle.tesla_id || vehicle.id.toString();
      await SecureStorage.storeSelectedVehicle(teslaId);
      setTeslaState(prev => ({
        ...prev,
        selectedVehicle: vehicle,
      }));
    } catch (error) {
      console.error('Failed to select vehicle:', error);
      throw new Error('Failed to select vehicle');
    }
  };

  const clearSelectedVehicle = async () => {
    try {
      await SecureStorage.clearSelectedVehicle();
      setTeslaState(prev => ({
        ...prev,
        selectedVehicle: null,
      }));
    } catch (error) {
      console.error('Failed to clear selected vehicle:', error);
    }
  };

  const clearError = () => {
    setTeslaState(prev => ({ ...prev, error: null }));
  };

  const disconnectTesla = async () => {
    if (!user) return;

    try {
      setTeslaState(prev => ({ ...prev, loading: true, error: null }));

      // Try to revoke Tesla tokens before deletion
      try {
        const tokens = await SecureStorage.getTeslaTokens();
        if (tokens?.access_token) {
          console.log('Revoking Tesla access token via proxy...');
          // Use our proxy endpoint to avoid CORS issues
          const response = await fetch('/api/tesla/revoke', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: tokens.access_token,
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Tesla token revocation result:', result);
          } else {
            console.warn('Tesla token revocation failed:', response.status);
          }
        }
      } catch (revokeError) {
        console.warn('Failed to revoke Tesla token:', revokeError);
        // Continue with disconnection even if revoke fails
      }

      // Clear all Tesla data from secure storage
      await SecureStorage.clearAllData();

      // Clear all vehicle data from database
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setTeslaState({
        vehicles: [],
        selectedVehicle: null,
        loading: false,
        error: null,
        isConnected: false,
      });

    } catch (error) {
      setTeslaState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect Tesla',
      }));
    }
  };

  const getVehicleData = async (vehicleId: number): Promise<any> => {
    if (!user) throw new Error('User not authenticated');

    // Get the vehicle's stored tokens
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('tesla_tokens')
      .eq('user_id', user.id)
      .eq('tesla_id', vehicleId.toString())
      .single();

    if (vehicleError || !vehicle) {
      throw new Error('Vehicle not found');
    }

    const tokens = vehicle.tesla_tokens as any;
    let accessToken = tokens.access_token;

    // Check if token needs refresh
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      // Token expired, refresh it
      const { tokens: newTokens, error: refreshError } = await TeslaService.refreshTokens(tokens.refresh_token);

      if (refreshError || !newTokens) {
        throw new Error('Failed to refresh Tesla tokens');
      }

      accessToken = newTokens.access_token;

      // Update stored tokens
      await supabase
        .from('vehicles')
        .update({
          tesla_tokens: {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token,
            expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          },
        })
        .eq('tesla_id', vehicleId.toString())
        .eq('user_id', user.id);
    }

    // Fetch vehicle data from Tesla API
    const { vehicleData, error } = await TeslaService.getVehicleData(vehicleId, accessToken);

    if (error || !vehicleData) {
      throw new Error(error || 'Failed to fetch vehicle data');
    }

    return vehicleData;
  };

  return {
    ...teslaState,
    connectTesla,
    refreshVehicles,
    exchangeCodeForTokens,
    selectVehicle,
    clearSelectedVehicle,
    clearError,
    disconnectTesla,
    getVehicleData,
  };
};

// Helper functions
function parseModelFromVin(vin: string): string {
  // Tesla VIN parsing - simplified version
  const modelChar = vin.charAt(3);
  switch (modelChar) {
    case 'S': return 'Model S';
    case '3': return 'Model 3';
    case 'X': return 'Model X';
    case 'Y': return 'Model Y';
    default: return 'Tesla';
  }
}

function parseYearFromVin(vin: string): number {
  // Tesla VIN year parsing - simplified version
  const yearChar = vin.charAt(9);
  const currentYear = new Date().getFullYear();

  // This is a simplified approach - real VIN parsing is more complex
  if (yearChar >= 'A' && yearChar <= 'Z') {
    const yearMap: { [key: string]: number } = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
    };
    return yearMap[yearChar] || currentYear;
  }

  return currentYear;
}
