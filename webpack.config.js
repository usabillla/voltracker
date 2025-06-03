const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules(?!\/react-native-web)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@react-native/babel-preset'],
            plugins: [
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'src/utils/storage.ts'),
    },
    fallback: {
      "crypto": false,
      "stream": false,
      "util": false,
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'web-build'),
    publicPath: '/', // Ensure assets are served from root
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        REACT_APP_SUPABASE_URL: JSON.stringify(process.env.REACT_APP_SUPABASE_URL),
        REACT_APP_SUPABASE_ANON_KEY: JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY),
        REACT_APP_TESLA_CLIENT_ID: JSON.stringify(process.env.REACT_APP_TESLA_CLIENT_ID),
        REACT_APP_TESLA_REDIRECT_URI: JSON.stringify(process.env.REACT_APP_TESLA_REDIRECT_URI),
        TESLA_CLIENT_SECRET: JSON.stringify(process.env.TESLA_CLIENT_SECRET),
        REACT_APP_VERSION: JSON.stringify(process.env.REACT_APP_VERSION),
        REACT_APP_DOMAIN: JSON.stringify(process.env.REACT_APP_DOMAIN),
        REACT_APP_DEBUG: JSON.stringify(process.env.REACT_APP_DEBUG),
        // Add Expo equivalents for consistency
        EXPO_PUBLIC_SUPABASE_URL: JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_URL),
        EXPO_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
        EXPO_PUBLIC_TESLA_CLIENT_ID: JSON.stringify(process.env.EXPO_PUBLIC_TESLA_CLIENT_ID),
        EXPO_PUBLIC_TESLA_REDIRECT_URI: JSON.stringify(process.env.EXPO_PUBLIC_TESLA_REDIRECT_URI),
        EXPO_PUBLIC_VERSION: JSON.stringify(process.env.EXPO_PUBLIC_VERSION),
        EXPO_PUBLIC_DOMAIN: JSON.stringify(process.env.EXPO_PUBLIC_DOMAIN),
        EXPO_PUBLIC_DEBUG: JSON.stringify(process.env.EXPO_PUBLIC_DEBUG),
      }
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'web-build'),
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      }
    ],
    compress: true,
    port: 3000,
    host: '0.0.0.0',
    hot: true,
    liveReload: true,
    open: true,
    historyApiFallback: true,
    allowedHosts: 'all',
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      reconnect: 3,
      logging: 'warn',
    },
    webSocketServer: 'ws',
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Add JSON body parsing middleware
      devServer.app.use('/api', require('express').json());

      // Add Tesla API endpoints for development
      devServer.app.post('/api/tesla/token', async (req, res) => {
        console.log('Tesla token exchange request received');
        
        const { code, redirect_uri, useMock } = req.body || {};
        
        // If explicitly requesting mock data or no code provided, return mock tokens
        if (useMock || !code) {
          console.log('Returning mock tokens for development');
          const mockTokens = {
            access_token: 'test_access_token_' + Date.now(),
            refresh_token: 'test_refresh_token_' + Date.now(),
            id_token: 'test_id_token_' + Date.now(),
            expires_in: 3600,
            token_type: 'Bearer'
          };
          
          res.json(mockTokens);
          return;
        }
        
        // For real Tesla OAuth, proxy to Tesla's API
        try {
          console.log('Proxying real Tesla token exchange');
          
          // Import fetch for Node.js environment
          let fetch;
          try {
            fetch = globalThis.fetch || require('node-fetch');
          } catch (e) {
            console.log('Failed to import fetch:', e.message);
          }
          
          if (!fetch) {
            console.log('Fetch not available, returning mock tokens');
            const mockTokens = {
              access_token: 'test_access_token_' + Date.now(),
              refresh_token: 'test_refresh_token_' + Date.now(),
              id_token: 'test_id_token_' + Date.now(),
              expires_in: 3600,
              token_type: 'Bearer'
            };
            res.json(mockTokens);
            return;
          }
          
          const tokenResponse = await fetch('https://auth.tesla.com/oauth2/v3/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              client_id: process.env.REACT_APP_TESLA_CLIENT_ID || process.env.EXPO_PUBLIC_TESLA_CLIENT_ID,
              client_secret: process.env.TESLA_CLIENT_SECRET,
              code,
              redirect_uri: redirect_uri || process.env.REACT_APP_TESLA_REDIRECT_URI || process.env.EXPO_PUBLIC_TESLA_REDIRECT_URI,
            }).toString(),
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Tesla token exchange failed:', errorText);
            
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: 'token_exchange_failed', error_description: errorText };
            }
            
            return res.status(tokenResponse.status).json({
              error: errorData.error || 'token_exchange_failed',
              error_description: errorData.error_description || 'Failed to exchange authorization code for tokens'
            });
          }

          const tokens = await tokenResponse.json();
          console.log('Real Tesla tokens received successfully');
          res.json(tokens);
          
        } catch (error) {
          console.error('Error proxying Tesla token exchange:', error);
          res.status(500).json({ 
            error: 'server_error', 
            error_description: 'Internal server error during token exchange' 
          });
        }
      });

      devServer.app.post('/api/tesla/refresh', async (_req, res) => {
        console.log('Tesla token refresh request received');
        
        // For development, return mock refreshed tokens
        const mockTokens = {
          access_token: 'test_access_token_refreshed_' + Date.now(),
          refresh_token: 'test_refresh_token_refreshed_' + Date.now(),
          expires_in: 3600,
          token_type: 'Bearer'
        };
        
        res.json(mockTokens);
      });

      devServer.app.post('/api/tesla/revoke', async (req, res) => {
        console.log('Tesla token revoke request received');
        
        const { token } = req.body || {};
        
        if (!token) {
          return res.status(400).json({ error: 'Token is required' });
        }
        
        // For real Tesla tokens, proxy to Tesla's revoke endpoint
        if (!token.startsWith('test_')) {
          try {
            console.log('Proxying real Tesla token revocation');
            
            // Import fetch for Node.js environment
            let fetch;
            try {
              fetch = globalThis.fetch || require('node-fetch');
            } catch (e) {
              console.log('Failed to import fetch:', e.message);
            }
            
            if (!fetch) {
              console.log('Fetch not available, simulating revoke success');
              res.json({ success: true });
              return;
            }
            
            const response = await fetch('https://auth.tesla.com/oauth2/v3/revoke', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                token: token,
              }).toString(),
            });
            
            // Tesla revoke endpoint might return various status codes
            if (response.ok || response.status === 200 || response.status === 204) {
              console.log('Tesla token revoked successfully');
              res.json({ success: true });
            } else {
              console.log('Tesla revoke failed:', response.status, response.statusText);
              // Even if revoke fails, we'll proceed with local cleanup
              res.json({ success: true, warning: 'Remote revoke failed but proceeding with local cleanup' });
            }
            
          } catch (error) {
            console.error('Error revoking Tesla token:', error);
            // Even if revoke fails, we'll proceed with local cleanup
            res.json({ success: true, warning: 'Remote revoke failed but proceeding with local cleanup' });
          }
        } else {
          // For test tokens, just return success
          console.log('Simulating test token revocation');
          res.json({ success: true });
        }
      });

      devServer.app.get('/api/tesla/vehicles', async (req, res) => {
        console.log('Tesla vehicles request received');
        
        const authHeader = req.headers.authorization;
        const accessToken = authHeader?.replace('Bearer ', '');
        
        // If no token or test token, return mock data
        if (!accessToken || accessToken.startsWith('test_')) {
          console.log('Returning mock vehicle data');
          const mockVehicles = [
            {
              id: 1234567890123,
              user_id: 123,
              vehicle_id: 1234567890,
              vin: '5YJ3E1EA7PF123456', // Real Tesla Model 3 VIN format
              display_name: 'My Tesla Model 3',
              option_codes: 'AD15,AF00,AU3D,BC3B,CH07,DRLH,GLFR,ID3W,LJFR,RG32,TM00',
              color: 'Pearl White Multi-Coat',
              access_type: 'OWNER',
              granular_access: {
                hide_private: false
              },
              tokens: ['VEHICLE_TOKEN_1'],
              state: 'online',
              in_service: false,
              id_s: '12345',
              calendar_enabled: true,
              api_version: 62,
              backseat_token: null,
              backseat_token_updated_at: null,
              ble_autopair_enrolled: false,
              command_signing: 'allowed'
            },
            {
              id: 1234567890124,
              user_id: 123,
              vehicle_id: 1234567891,
              vin: '5YJYGAEE7PF987654', // Real Tesla Model Y VIN format
              display_name: 'Family Model Y',
              option_codes: 'AD15,AF00,AU3D,BC3B,CH07,DRLH,GLFR,ID3W,LJFR,RG32,TM00',
              color: 'Midnight Silver Metallic',
              access_type: 'OWNER',
              granular_access: {
                hide_private: false
              },
              tokens: ['VEHICLE_TOKEN_2'],
              state: 'asleep',
              in_service: false,
              id_s: '12346',
              calendar_enabled: true,
              api_version: 62,
              backseat_token: null,
              backseat_token_updated_at: null,
              ble_autopair_enrolled: false,
              command_signing: 'allowed'
            }
          ];
          
          res.json({ response: mockVehicles, count: mockVehicles.length });
          return;
        }
        
        // For real Tesla tokens, proxy to Tesla Fleet API
        try {
          console.log('Proxying real Tesla vehicles request');
          
          // Import fetch for Node.js environment
          const fetch = require('node-fetch') || globalThis.fetch;
          
          if (!fetch) {
            console.log('Fetch not available, falling back to mock data');
            // Fallback to mock data if fetch is not available
            const mockVehicles = [
              {
                id: 1234567890123,
                user_id: 123,
                vehicle_id: 1234567890,
                vin: 'LRW3E74W6RC123456',
                display_name: 'My Tesla Model 3',
                option_codes: 'AD15,AF00,AU3D,BC3B,CH07,DRLH,GLFR,ID3W,LJFR,RG32,TM00',
                color: 'Pearl White Multi-Coat',
                access_type: 'OWNER',
                state: 'online',
              }
            ];
            res.json({ response: mockVehicles, count: mockVehicles.length });
            return;
          }
          
          // Try multiple Tesla regions
          const regions = [
            'https://fleet-api.prd.na.vn.cloud.tesla.com',
            'https://fleet-api.prd.eu.vn.cloud.tesla.com', 
            'https://fleet-api.prd.ap.vn.cloud.tesla.com'
          ];
          
          let lastError = null;
          
          for (const regionUrl of regions) {
            try {
              console.log(`Trying Tesla region: ${regionUrl}`);
              const response = await fetch(`${regionUrl}/api/1/vehicles`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log(`Successfully fetched ${data.response?.length || 0} vehicles from Tesla`);
                res.json(data);
                return;
              } else if (response.status === 401) {
                return res.status(401).json({ error: 'Token expired' });
              } else {
                lastError = `HTTP ${response.status}: ${response.statusText}`;
                console.log(`Region ${regionUrl} failed: ${lastError}`);
              }
            } catch (error) {
              lastError = error.message;
              console.log(`Region ${regionUrl} error: ${lastError}`);
              continue;
            }
          }
          
          // If all regions failed, fallback to mock data for development
          console.log('All Tesla regions failed, falling back to mock data');
          const mockVehicles = [
            {
              id: 1234567890123,
              user_id: 123,
              vehicle_id: 1234567890,
              vin: '5YJ3E1EA7PF123456', // Real Tesla Model 3 VIN format
              display_name: 'My Tesla Model 3 (Connected Account)',
              option_codes: 'AD15,AF00,AU3D,BC3B,CH07,DRLH,GLFR,ID3W,LJFR,RG32,TM00',
              color: 'Pearl White Multi-Coat',
              access_type: 'OWNER',
              granular_access: {
                hide_private: false
              },
              tokens: ['VEHICLE_TOKEN_1'],
              state: 'online',
              in_service: false,
              id_s: '12345',
              calendar_enabled: true,
              api_version: 62, // Latest Tesla API version
              backseat_token: null,
              backseat_token_updated_at: null,
              ble_autopair_enrolled: false,
              command_signing: 'allowed',
              // Enhanced status data
              charge_state: {
                battery_level: 85,
                battery_range: 280.5,
                est_battery_range: 275.2,
                ideal_battery_range: 295.1,
                charge_current_request: 40,
                charge_current_request_max: 40,
                charge_enable_request: true,
                charge_energy_added: 15.21,
                charge_limit_soc: 90,
                charge_limit_soc_max: 100,
                charge_limit_soc_min: 50,
                charge_limit_soc_std: 90,
                charge_miles_added_ideal: 62.0,
                charge_miles_added_rated: 58.5,
                charge_port_door_open: false,
                charge_port_latch: 'Engaged',
                charge_rate: 0.0,
                charge_to_max_range: false,
                charger_actual_current: 0,
                charger_phases: null,
                charger_pilot_current: 40,
                charger_power: 0,
                charger_voltage: 0,
                charging_state: 'Complete',
                conn_charge_cable: 'IEC',
                fast_charger_brand: '<invalid>',
                fast_charger_present: false,
                fast_charger_type: '<invalid>',
                max_range_charge_counter: 0,
                not_enough_power_to_heat: false,
                scheduled_charging_pending: false,
                scheduled_charging_start_time: null,
                time_to_full_charge: 0.0,
                timestamp: Date.now(),
                trip_charging: false,
                usable_battery_level: 85,
                user_charge_enable_request: null
              },
              drive_state: {
                gps_as_of: Date.now(),
                heading: 45,
                latitude: 37.7749,
                longitude: -122.4194,
                native_latitude: 37.7749,
                native_longitude: -122.4194,
                native_location_supported: 1,
                native_type: 'wgs',
                power: 0,
                shift_state: 'P',
                speed: null,
                timestamp: Date.now()
              }
            },
            {
              id: 1234567890124,
              user_id: 123,
              vehicle_id: 1234567891,
              vin: '5YJSA1E26PF987654', // Real Tesla Model S VIN format
              display_name: 'Family Model S (Connected Account)',
              option_codes: 'AD15,AF00,AU3D,BC3B,CH07,DRLH,GLFR,ID3W,LJFR,RG32,TM00',
              color: 'Midnight Silver Metallic',
              access_type: 'OWNER',
              granular_access: {
                hide_private: false
              },
              tokens: ['VEHICLE_TOKEN_2'],
              state: 'asleep',
              in_service: false,
              id_s: '12346',
              calendar_enabled: true,
              api_version: 62,
              backseat_token: null,
              backseat_token_updated_at: null,
              ble_autopair_enrolled: false,
              command_signing: 'allowed',
              // Enhanced status data for asleep vehicle
              charge_state: {
                battery_level: 92,
                battery_range: 390.2,
                est_battery_range: 385.8,
                charging_state: 'Complete',
                timestamp: Date.now() - 7200000 // 2 hours ago
              },
              drive_state: {
                timestamp: Date.now() - 7200000 // 2 hours ago
              }
            }
          ];
          res.json({ response: mockVehicles, count: mockVehicles.length });
          return;
          
        } catch (error) {
          console.error('Error proxying Tesla vehicles request:', error);
          res.status(500).json({ 
            error: 'server_error', 
            error_description: 'Internal server error fetching vehicles' 
          });
        }
      });

      devServer.app.get('/api/tesla/vehicles/:vehicleId/vehicle_data', async (req, res) => {
        console.log('Tesla vehicle data request received for vehicle:', req.params.vehicleId);
        
        const { vehicleId } = req.params;
        const authHeader = req.headers.authorization;
        const accessToken = authHeader?.replace('Bearer ', '');
        
        // If no token or test token, return mock data
        if (!accessToken || accessToken.startsWith('test_')) {
          console.log('Returning mock vehicle data');
          const mockVehicleData = {
            id: parseInt(vehicleId),
            user_id: 123,
            vehicle_id: parseInt(vehicleId),
            vin: vehicleId === '1234567890123' ? '5YJ3E1EA7PF123456' : '5YJSA1E26PF987654',
            display_name: vehicleId === '1234567890123' ? 'My Tesla Model 3 (Connected Account)' : 'Family Model S (Connected Account)',
            state: vehicleId === '1234567890123' ? 'online' : 'asleep',
            charge_state: {
              battery_level: vehicleId === '1234567890123' ? 85 : 92,
              battery_range: vehicleId === '1234567890123' ? 280.5 : 390.2,
              est_battery_range: vehicleId === '1234567890123' ? 275.2 : 385.8,
              ideal_battery_range: vehicleId === '1234567890123' ? 295.1 : 410.0,
              charge_current_request: 40,
              charge_limit_soc: 90,
              charge_port_door_open: false,
              charge_rate: 0.0,
              charging_state: 'Complete',
              time_to_full_charge: 0.0,
              timestamp: Date.now(),
              usable_battery_level: vehicleId === '1234567890123' ? 85 : 92,
            },
            drive_state: {
              gps_as_of: Date.now(),
              heading: 45,
              latitude: 37.7749,
              longitude: -122.4194,
              power: 0,
              shift_state: 'P',
              speed: null,
              timestamp: Date.now()
            },
            vehicle_state: {
              api_version: 62,
              autopark_state_v2: 'standby',
              calendar_supported: true,
              car_version: '2024.14.9',
              center_display_state: 0,
              df: 0, // driver front door
              dr: 0, // driver rear door  
              ft: 0, // front trunk
              is_user_present: false,
              locked: true,
              media_state: { remote_control_enabled: true },
              notifications_supported: true,
              odometer: 12543.7,
              parsed_calendar_supported: true,
              pf: 0, // passenger front door
              pr: 0, // passenger rear door
              remote_start: false,
              remote_start_enabled: true,
              remote_start_supported: true,
              rt: 0, // rear trunk
              sentry_mode: false,
              sentry_mode_available: true,
              software_update: {
                expected_duration_sec: 2700,
                status: ''
              },
              speed_limit_mode: {
                active: false,
                current_limit_mph: 85,
                max_limit_mph: 90,
                min_limit_mph: 50,
                pin_code_set: false
              },
              timestamp: Date.now(),
              valet_mode: false,
              valet_pin_needed: true,
              vehicle_name: vehicleId === '1234567890123' ? 'My Tesla Model 3' : 'Family Model S'
            }
          };
          
          res.json({ response: mockVehicleData });
          return;
        }
        
        // For real Tesla tokens, proxy to Tesla Fleet API
        try {
          console.log('Proxying real Tesla vehicle data request');
          
          // Import fetch for Node.js environment
          let fetch;
          try {
            fetch = globalThis.fetch || require('node-fetch');
          } catch (e) {
            console.log('Failed to import fetch:', e.message);
          }
          
          if (!fetch) {
            console.log('Fetch not available, falling back to mock data');
            // Return mock data if fetch unavailable
            res.json({ response: mockVehicleData });
            return;
          }
          
          // Try multiple Tesla regions
          const regions = [
            'https://fleet-api.prd.na.vn.cloud.tesla.com',
            'https://fleet-api.prd.eu.vn.cloud.tesla.com', 
            'https://fleet-api.prd.ap.vn.cloud.tesla.com'
          ];
          
          let lastError = null;
          
          for (const regionUrl of regions) {
            try {
              console.log(`Trying Tesla region: ${regionUrl}`);
              const response = await fetch(`${regionUrl}/api/1/vehicles/${vehicleId}/vehicle_data`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log(`Successfully fetched vehicle data from Tesla`);
                res.json(data);
                return;
              } else if (response.status === 401) {
                return res.status(401).json({ error: 'Token expired' });
              } else if (response.status === 408) {
                return res.status(408).json({ error: 'Vehicle is asleep' });
              } else {
                lastError = `HTTP ${response.status}: ${response.statusText}`;
                console.log(`Region ${regionUrl} failed: ${lastError}`);
              }
            } catch (error) {
              lastError = error.message;
              console.log(`Region ${regionUrl} error: ${lastError}`);
              continue;
            }
          }
          
          // If all regions failed, fallback to mock data
          console.log('All Tesla regions failed, falling back to mock data');
          const mockVehicleData = {
            // ... (same mock data as above)
            id: parseInt(vehicleId),
            user_id: 123,
            vehicle_id: parseInt(vehicleId),
            vin: vehicleId === '1234567890123' ? '5YJ3E1EA7PF123456' : '5YJSA1E26PF987654',
            display_name: vehicleId === '1234567890123' ? 'My Tesla Model 3 (Connected Account)' : 'Family Model S (Connected Account)',
            state: vehicleId === '1234567890123' ? 'online' : 'asleep',
            charge_state: {
              battery_level: vehicleId === '1234567890123' ? 85 : 92,
              battery_range: vehicleId === '1234567890123' ? 280.5 : 390.2,
              charging_state: 'Complete',
              timestamp: Date.now(),
            },
            drive_state: {
              gps_as_of: Date.now(),
              latitude: 37.7749,
              longitude: -122.4194,
              timestamp: Date.now()
            },
            vehicle_state: {
              api_version: 62,
              car_version: '2024.14.9',
              locked: true,
              odometer: 12543.7,
              timestamp: Date.now(),
            }
          };
          res.json({ response: mockVehicleData });
          
        } catch (error) {
          console.error('Error proxying Tesla vehicle data request:', error);
          res.status(500).json({ 
            error: 'server_error', 
            error_description: 'Internal server error fetching vehicle data' 
          });
        }
      });

      return middlewares;
    },
  },
};
