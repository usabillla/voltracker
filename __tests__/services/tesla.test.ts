/**
 * @jest-environment jsdom
 */

import { TeslaService } from '../../src/services/tesla';

// Mock fetch globally
global.fetch = jest.fn();

// Mock SecureStorage
jest.mock('../../src/services/secureStorage', () => ({
  SecureStorage: {
    storeTeslaTokens: jest.fn(() => Promise.resolve()),
    getTeslaTokens: jest.fn(() => Promise.resolve(null)),
    removeTeslaTokens: jest.fn(() => Promise.resolve()),
  }
}));

// Mock security utils
jest.mock('../../src/utils/security', () => ({
  validateTeslaToken: jest.fn(() => ({ isValid: true })),
  logSecurityEvent: jest.fn(),
  sanitizeString: jest.fn(str => str),
  validateOAuthState: jest.fn(() => ({ isValid: true }))
}));

describe('TeslaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getVehicles', () => {
    it('should fetch vehicles successfully', async () => {
      const mockVehicles = [
        {
          id: 123,
          vin: '5YJ3E1EA7PF123456',
          display_name: 'Test Model 3',
          state: 'online'
        }
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: mockVehicles })
      });

      const result = await TeslaService.getVehicles('test-token');

      expect(result.vehicles).toEqual(mockVehicles);
      expect(result.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith('/api/tesla/vehicles', {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle authentication errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'unauthorized' })
      });

      const result = await TeslaService.getVehicles('invalid-token');

      expect(result.vehicles).toBeNull();
      expect(result.error).toBe('Access token expired');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await TeslaService.getVehicles('test-token');

      expect(result.vehicles).toBeNull();
      expect(result.error).toBe('Network error');
    });
  });

  describe('getVehicleData', () => {
    it('should fetch vehicle data successfully', async () => {
      const mockVehicleData = {
        id: 123,
        charge_state: { battery_level: 85 },
        drive_state: { latitude: 37.7749, longitude: -122.4194 }
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ response: mockVehicleData })
      });

      const result = await TeslaService.getVehicleData(123, 'test-token');

      expect(result.vehicleData).toEqual(mockVehicleData);
      expect(result.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith('/api/tesla/vehicles/123/vehicle_data', {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
    });

    it('should handle vehicle asleep status', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 408,
        json: () => Promise.resolve({ error: 'vehicle_asleep' })
      });

      const result = await TeslaService.getVehicleData(123, 'test-token');

      expect(result.vehicleData).toBeNull();
      expect(result.error).toBe('Vehicle is asleep. Try waking it up first.');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockTokens = {
        access_token: 'access123',
        refresh_token: 'refresh123',
        id_token: 'id123',
        expires_in: 3600,
        token_type: 'Bearer'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockTokens)
      });

      const result = await TeslaService.exchangeCodeForTokens('auth-code', 'user123');

      expect(result.tokens).toEqual(mockTokens);
      expect(result.error).toBeNull();
      expect(fetch).toHaveBeenCalledWith('/api/tesla/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: 'auth-code',
          redirect_uri: process.env.REACT_APP_TESLA_REDIRECT_URI,
        }),
      });
    });

    it('should handle token exchange errors', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Map([['content-type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify({ 
          error: 'invalid_grant',
          error_description: 'Authorization code is invalid'
        }))
      });

      const result = await TeslaService.exchangeCodeForTokens('invalid-code', 'user123');

      expect(result.tokens).toBeNull();
      expect(result.error).toBe('Authorization code is invalid');
    });
  });
});