import { logSecurityEvent, maskSensitiveData } from './security';

/**
 * Secure error handling utilities that prevent information leakage
 */

export interface SafeError {
  message: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Create a safe error object that doesn't leak sensitive information
 */
export function createSafeError(
  error: Error | unknown, 
  userMessage?: string,
  code?: string
): SafeError {
  const timestamp = new Date().toISOString();
  const requestId = generateRequestId();

  // Log the actual error for debugging (with sensitive data masked)
  logSecurityEvent('error_occurred', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? maskSensitiveData(error.stack || '', 10) : undefined,
    code,
    requestId,
  });

  // Return sanitized error for user
  return {
    message: userMessage || 'An unexpected error occurred. Please try again.',
    code,
    timestamp,
    requestId,
  };
}

/**
 * Generate a unique request ID for error tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Wrap async functions with secure error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  userMessage?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const safeError = createSafeError(error, userMessage);
      throw new Error(safeError.message);
    }
  };
}

/**
 * Error boundary for React components (hook version)
 */
export function useErrorBoundary() {
  const handleError = (error: Error, errorInfo?: any) => {
    const safeError = createSafeError(error, 'A component error occurred');
    console.error('[Error Boundary]', safeError);
    
    // In production, report to error tracking service
    logSecurityEvent('component_error', {
      error: error.message,
      componentStack: errorInfo?.componentStack ? maskSensitiveData(errorInfo.componentStack, 20) : undefined,
      requestId: safeError.requestId,
    });
  };

  return { handleError };
}

/**
 * Validate API responses for security
 */
export function validateApiResponse(response: any, expectedKeys: string[]): boolean {
  if (!response || typeof response !== 'object') {
    logSecurityEvent('api_response_validation_failed', { 
      reason: 'Invalid response format',
      responseType: typeof response 
    });
    return false;
  }

  // Check for required keys
  for (const key of expectedKeys) {
    if (!(key in response)) {
      logSecurityEvent('api_response_validation_failed', { 
        reason: 'Missing required key',
        missingKey: key 
      });
      return false;
    }
  }

  // Check for suspicious properties
  const suspiciousKeys = ['__proto__', 'constructor', 'prototype'];
  for (const key of suspiciousKeys) {
    if (key in response) {
      logSecurityEvent('api_response_security_warning', { 
        reason: 'Suspicious property detected',
        suspiciousKey: key 
      });
      delete response[key];
    }
  }

  return true;
}

/**
 * Secure timeout wrapper for API calls
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 30000,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      logSecurityEvent('request_timeout', { timeoutMs });
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        logSecurityEvent('retry_exhausted', { 
          attempts: maxRetries,
          error: error instanceof Error ? error.message : String(error)
        });
        break;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      logSecurityEvent('retry_attempt', { 
        attempt,
        delayMs,
        error: error instanceof Error ? error.message : String(error)
      });
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern for failing services
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logSecurityEvent('circuit_breaker_opened', { 
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }

  getState() {
    return this.state;
  }
}

export { CircuitBreaker };