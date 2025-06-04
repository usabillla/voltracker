/**
 * @jest-environment jsdom
 */

import {
  sanitizeString,
  validateEmailSecurity,
  validateTeslaToken,
  encryptForStorage,
  decryptFromStorage,
  validateOAuthState,
  logSecurityEvent
} from '../../src/utils/security';

describe('Security Utils', () => {
  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeString(input);
      expect(result).toBe('Hello  World');
    });

    it('should remove javascript: protocols', () => {
      const input = 'Click <a href="javascript:alert()">here</a>';
      const result = sanitizeString(input);
      expect(result).toBe('Click <a href="alert()">here</a>');
    });

    it('should remove null bytes and control characters', () => {
      const input = 'Hello\x00\x01\x1F World';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      const result = sanitizeString(null as any);
      expect(result).toBe('');
    });

    it('should preserve safe strings', () => {
      const input = 'Hello World! This is a safe string.';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@domain.org'
      ];

      validEmails.forEach(email => {
        const result = validateEmailSecurity(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        const result = validateEmailSecurity(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateTeslaToken', () => {
    it('should validate correct Tesla token structure', () => {
      const validToken = {
        access_token: 'valid-token',
        refresh_token: 'valid-refresh',
        expires_in: 3600,
        token_type: 'Bearer'
      };

      const result = validateTeslaToken(validToken);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid token structures', () => {
      const invalidTokens = [
        null,
        undefined,
        {},
        { access_token: '' },
        { access_token: 'token', expires_in: -1 },
        { access_token: 'token', expires_in: 'invalid' }
      ];

      invalidTokens.forEach(token => {
        const result = validateTeslaToken(token);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('encryptForStorage and decryptFromStorage', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive-data-123';
      
      const encrypted = encryptForStorage(originalData);
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = decryptFromStorage(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptForStorage('');
      const decrypted = decryptFromStorage(encrypted);
      expect(decrypted).toBe('');
    });

    it('should produce same encrypted values for same input', () => {
      const data = 'test-data';
      const encrypted1 = encryptForStorage(data);
      const encrypted2 = encryptForStorage(data);
      
      // Since this uses device-based key, same input = same output
      expect(encrypted1).toBe(encrypted2);
      
      // Both should decrypt to same value
      expect(decryptFromStorage(encrypted1)).toBe(data);
      expect(decryptFromStorage(encrypted2)).toBe(data);
    });
  });

  describe('validateOAuthState', () => {
    it('should validate matching state parameters', () => {
      const state = 'random-state-123';
      const result = validateOAuthState(state, state);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject mismatched state parameters', () => {
      const result = validateOAuthState('state1', 'state2');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty or null state parameters', () => {
      const invalidStates = [
        ['', 'state'],
        ['state', ''],
        [null, 'state'],
        ['state', null],
        [undefined, 'state']
      ];

      invalidStates.forEach(([stored, received]) => {
        const result = validateOAuthState(stored as any, received as any);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('logSecurityEvent', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log security events with timestamp', () => {
      logSecurityEvent('TEST_EVENT', { detail: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.objectContaining({
          event: 'TEST_EVENT',
          details: expect.objectContaining({ detail: 'test' })
        })
      );
    });

    it('should handle events without metadata', () => {
      logSecurityEvent('SIMPLE_EVENT', {});

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]'),
        expect.objectContaining({
          event: 'SIMPLE_EVENT'
        })
      );
    });
  });
});