import { useState, useEffect } from 'react';
import { TeslaService, type TeslaVehicle, type TeslaTokens } from '../services/tesla';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

export interface TeslaState {
  vehicles: TeslaVehicle[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

export const useTesla = () => {
  const { user } = useAuth();
  const [teslaState, setTeslaState] = useState<TeslaState>({
    vehicles: [],
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

        setTeslaState(prev => ({
          ...prev,
          vehicles: data || [],
          isConnected: (data?.length || 0) > 0,
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
    setTeslaState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { code, error } = await TeslaService.handleOAuth();

      if (error) {
        throw new Error(error);
      }

      // For web, the redirect will happen, so we don't need to continue here
      if (code) {
        await exchangeCodeForTokens(code);
      }
    } catch (error) {
      setTeslaState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to connect Tesla',
      }));
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    if (!user) {
      setTeslaState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    try {
      // Exchange code for tokens
      const { tokens, error: tokenError } = await TeslaService.exchangeCodeForTokens(code);

      if (tokenError || !tokens) {
        throw new Error(tokenError || 'Failed to get tokens');
      }

      // Get vehicles from Tesla API
      const { vehicles, error: vehiclesError } = await TeslaService.getVehicles(tokens.access_token);

      if (vehiclesError || !vehicles) {
        throw new Error(vehiclesError || 'Failed to get vehicles');
      }

      // Save vehicles to database
      for (const vehicle of vehicles) {
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
        }
      }

      setTeslaState(prev => ({
        ...prev,
        vehicles,
        loading: false,
        isConnected: true,
        error: null,
      }));

    } catch (error) {
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

      setTeslaState(prev => ({
        ...prev,
        vehicles,
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

  return {
    ...teslaState,
    connectTesla,
    refreshVehicles,
    exchangeCodeForTokens,
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
