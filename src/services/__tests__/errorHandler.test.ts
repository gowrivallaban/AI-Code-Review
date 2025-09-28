import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handleError, withRetry, createRetryWrapper, createError } from '../errorHandler';
import { notificationService } from '../notification';
import type { AuthError, APIError, LLMError, TemplateError } from '../../types';

// Mock the notification service
vi.mock('../notification', () => ({
  notificationService: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
    hash: '',
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleError', () => {
    it('handles authentication errors correctly', () => {
      const authError: AuthError = {
        type: 'auth',
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid token',
        reason: 'invalid_token',
        timestamp: new Date().toISOString(),
      };

      handleError(authError);

      expect(notificationService.error).toHaveBeenCalledWith(
        'Authentication Failed',
        'Your GitHub token is invalid. Please check your token and try again.',
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Re-authenticate',
            style: 'primary',
          }),
        ])
      );
    });

    it('handles API rate limit errors correctly', () => {
      const apiError: APIError = {
        type: 'api',
        code: 'API_RATE_LIMIT',
        message: 'Rate limited',
        reason: 'rate_limit',
        status: 429,
        retryAfter: 3600,
        timestamp: new Date().toISOString(),
      };

      handleError(apiError);

      expect(notificationService.warning).toHaveBeenCalledWith(
        'Rate Limited',
        'GitHub API rate limit exceeded. Please wait 60 minutes before trying again.',
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Learn More',
            style: 'secondary',
          }),
        ])
      );
    });

    it('handles LLM quota exceeded errors correctly', () => {
      const llmError: LLMError = {
        type: 'llm',
        code: 'LLM_QUOTA_EXCEEDED',
        message: 'Quota exceeded',
        reason: 'quota_exceeded',
        timestamp: new Date().toISOString(),
      };

      handleError(llmError);

      expect(notificationService.error).toHaveBeenCalledWith(
        'Quota Exceeded',
        'Your AI service quota has been exceeded. Please check your account limits or try again later.',
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Check Usage',
            style: 'secondary',
          }),
        ])
      );
    });

    it('handles template errors correctly', () => {
      const templateError: TemplateError = {
        type: 'template',
        code: 'TEMPLATE_INVALID_MARKDOWN',
        message: 'Invalid markdown',
        reason: 'invalid_markdown',
        timestamp: new Date().toISOString(),
      };

      handleError(templateError);

      expect(notificationService.error).toHaveBeenCalledWith(
        'Invalid Template',
        'The template contains invalid markdown syntax. Please check the template format.',
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Edit Template',
            style: 'primary',
          }),
        ])
      );
    });

    it('handles unknown errors correctly', () => {
      const unknownError = new Error('Unknown error');

      handleError(unknownError);

      expect(notificationService.error).toHaveBeenCalledWith(
        'Unexpected Error',
        'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.',
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Refresh Page',
            style: 'primary',
          }),
          expect.objectContaining({
            label: 'Report Issue',
            style: 'secondary',
          }),
        ])
      );
    });

    it('does not show notification when showNotification is false', () => {
      const error = new Error('Test error');

      handleError(error, { showNotification: false });

      expect(notificationService.error).not.toHaveBeenCalled();
    });

    it('logs error when logError is true', () => {
      const error = new Error('Test error');

      handleError(error, { logError: true });

      expect(console.error).toHaveBeenCalledWith('Application Error:', error);
    });
  });

  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, { 
        maxRetries: 3, 
        baseDelay: 10,
        retryCondition: () => true // Allow all errors to be retried
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(withRetry(operation, { 
        maxRetries: 2, 
        baseDelay: 10,
        retryCondition: () => true // Allow all errors to be retried
      })).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('respects retry condition', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Non-retryable error'));
      const retryCondition = vi.fn().mockReturnValue(false);

      await expect(withRetry(operation, { retryCondition, baseDelay: 10 })).rejects.toThrow('Non-retryable error');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(retryCondition).toHaveBeenCalledWith(expect.any(Error));
    });

    it('uses exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(operation, { 
        maxRetries: 2, 
        baseDelay: 100, 
        backoffFactor: 2,
        retryCondition: () => true // Allow all errors to be retried
      });
      const endTime = Date.now();

      // Should have waited at least 100ms + 200ms = 300ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    });

    it('respects max delay', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(operation, { 
        maxRetries: 1, 
        baseDelay: 1000, 
        maxDelay: 100,
        backoffFactor: 10,
        retryCondition: () => true // Allow all errors to be retried
      });
      const endTime = Date.now();

      // Should have waited max 100ms, not 1000ms
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('createRetryWrapper', () => {
    it('creates a function that retries automatically', async () => {
      const originalFn = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');

      const wrappedFn = createRetryWrapper(originalFn, { 
        maxRetries: 2, 
        baseDelay: 10,
        retryCondition: () => true // Allow all errors to be retried
      });
      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('createError', () => {
    it('creates properly formatted error objects', () => {
      const error = createError('api', 'rate_limit', 'Rate limited', { status: 429 });

      expect(error).toMatchObject({
        type: 'api',
        code: 'API_RATE_LIMIT',
        message: 'Rate limited',
        reason: 'rate_limit',
        status: 429,
        timestamp: expect.any(String),
      });
    });
  });

  describe('default retry conditions', () => {
    it('retries on API network errors', async () => {
      const apiError: APIError = {
        type: 'api',
        code: 'API_NETWORK_ERROR',
        message: 'Network error',
        reason: 'network_error',
        timestamp: new Date().toISOString(),
      };

      const operation = vi.fn()
        .mockRejectedValueOnce(apiError)
        .mockResolvedValue('success');

      const result = await withRetry(operation, { baseDelay: 10 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('retries on API rate limits', async () => {
      const apiError: APIError = {
        type: 'api',
        code: 'API_RATE_LIMIT',
        message: 'Rate limited',
        reason: 'rate_limit',
        timestamp: new Date().toISOString(),
      };

      const operation = vi.fn()
        .mockRejectedValueOnce(apiError)
        .mockResolvedValue('success');

      const result = await withRetry(operation, { baseDelay: 10 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('does not retry on auth errors', async () => {
      const authError: AuthError = {
        type: 'auth',
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid token',
        reason: 'invalid_token',
        timestamp: new Date().toISOString(),
      };

      const operation = vi.fn().mockRejectedValue(authError);

      await expect(withRetry(operation, { baseDelay: 10 })).rejects.toEqual(authError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on LLM API failures', async () => {
      const llmError: LLMError = {
        type: 'llm',
        code: 'LLM_API_FAILURE',
        message: 'API failure',
        reason: 'api_failure',
        timestamp: new Date().toISOString(),
      };

      const operation = vi.fn()
        .mockRejectedValueOnce(llmError)
        .mockResolvedValue('success');

      const result = await withRetry(operation, { baseDelay: 10 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('does not retry on LLM quota exceeded', async () => {
      const llmError: LLMError = {
        type: 'llm',
        code: 'LLM_QUOTA_EXCEEDED',
        message: 'Quota exceeded',
        reason: 'quota_exceeded',
        timestamp: new Date().toISOString(),
      };

      const operation = vi.fn().mockRejectedValue(llmError);

      await expect(withRetry(operation, { baseDelay: 10 })).rejects.toEqual(llmError);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});