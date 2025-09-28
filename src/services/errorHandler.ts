import type { AppError, AuthError, APIError, LLMError, TemplateError } from '../types';
import { notificationService } from './notification';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

export interface ErrorHandlerOptions {
  showNotification?: boolean;
  logError?: boolean;
  retryOptions?: RetryOptions;
}

export class ErrorHandler {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error: any) => {
      // Retry on network errors, rate limits, and server errors
      if (error?.type === 'api') {
        const apiError = error as APIError;
        return ['network_error', 'rate_limit', 'server_error'].includes(apiError.reason);
      }
      if (error?.type === 'llm') {
        const llmError = error as LLMError;
        return ['api_failure', 'timeout'].includes(llmError.reason);
      }
      return false;
    },
  };

  /**
   * Handle different types of application errors with appropriate user feedback
   */
  static handleError(error: AppError | Error, options: ErrorHandlerOptions = {}): void {
    const { showNotification = true, logError = true } = options;

    if (logError) {
      console.error('Application Error:', error);
    }

    if (!showNotification) {
      return;
    }

    // Handle known application errors
    if (this.isAppError(error)) {
      this.handleAppError(error);
    } else {
      // Handle unknown errors
      this.handleUnknownError(error);
    }
  }

  /**
   * Execute an operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const retryOptions = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if this is the last attempt
        if (attempt === retryOptions.maxRetries) {
          break;
        }

        // Check if we should retry this error
        if (retryOptions.retryCondition && !retryOptions.retryCondition(error)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryOptions.baseDelay * Math.pow(retryOptions.backoffFactor, attempt),
          retryOptions.maxDelay
        );

        console.warn(`Operation failed (attempt ${attempt + 1}/${retryOptions.maxRetries + 1}), retrying in ${delay}ms:`, error);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  /**
   * Create a retry wrapper for a function
   */
  static createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: Partial<RetryOptions> = {}
  ): T {
    return ((...args: Parameters<T>) => {
      return this.withRetry(() => fn(...args), options);
    }) as T;
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: AuthError): void {
    const actions = [];

    switch (error.reason) {
      case 'invalid_token':
        actions.push({
          label: 'Re-authenticate',
          action: () => {
            // This will be handled by the auth service
            window.location.hash = '#auth';
          },
          style: 'primary' as const,
        });
        notificationService.error(
          'Authentication Failed',
          'Your GitHub token is invalid. Please check your token and try again.',
          actions
        );
        break;

      case 'expired_token':
        actions.push({
          label: 'Refresh Token',
          action: () => {
            window.location.hash = '#auth';
          },
          style: 'primary' as const,
        });
        notificationService.error(
          'Token Expired',
          'Your GitHub token has expired. Please authenticate again.',
          actions
        );
        break;

      case 'insufficient_permissions':
        notificationService.error(
          'Insufficient Permissions',
          'Your GitHub token does not have the required permissions. Please ensure your token has "repo" and "user" scopes.',
          [{
            label: 'Learn More',
            action: () => {
              window.open('https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token', '_blank');
            },
            style: 'secondary' as const,
          }]
        );
        break;

      case 'network_error':
        actions.push({
          label: 'Retry',
          action: () => {
            // This will be handled by the calling component
          },
          style: 'primary' as const,
        });
        notificationService.error(
          'Network Error',
          'Unable to connect to GitHub. Please check your internet connection and try again.',
          actions
        );
        break;

      default:
        notificationService.error(
          'Authentication Error',
          error.message || 'An authentication error occurred.'
        );
    }
  }

  /**
   * Handle API errors
   */
  private static handleAPIError(error: APIError): void {
    const actions = [];

    switch (error.reason) {
      case 'rate_limit':
        const retryAfter = error.retryAfter ? Math.ceil(error.retryAfter / 60) : 60;
        notificationService.warning(
          'Rate Limited',
          `GitHub API rate limit exceeded. Please wait ${retryAfter} minutes before trying again.`,
          [{
            label: 'Learn More',
            action: () => {
              window.open('https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting', '_blank');
            },
            style: 'secondary' as const,
          }]
        );
        break;

      case 'not_found':
        notificationService.error(
          'Resource Not Found',
          'The requested repository or pull request could not be found. It may have been deleted or you may not have access to it.'
        );
        break;

      case 'forbidden':
        notificationService.error(
          'Access Denied',
          'You do not have permission to access this resource. Please check your GitHub token permissions.',
          [{
            label: 'Check Permissions',
            action: () => {
              window.open('https://github.com/settings/tokens', '_blank');
            },
            style: 'secondary' as const,
          }]
        );
        break;

      case 'network_error':
        actions.push({
          label: 'Retry',
          action: () => {
            // This will be handled by the calling component
          },
          style: 'primary' as const,
        });
        notificationService.error(
          'Network Error',
          'Unable to connect to GitHub API. Please check your internet connection and try again.',
          actions
        );
        break;

      case 'server_error':
        actions.push({
          label: 'Retry',
          action: () => {
            // This will be handled by the calling component
          },
          style: 'primary' as const,
        });
        notificationService.error(
          'Server Error',
          'GitHub API is experiencing issues. Please try again in a few minutes.',
          actions
        );
        break;

      default:
        notificationService.error(
          'API Error',
          error.message || 'An API error occurred.'
        );
    }
  }

  /**
   * Handle LLM service errors
   */
  private static handleLLMError(error: LLMError): void {
    const actions = [];

    switch (error.reason) {
      case 'api_failure':
        actions.push({
          label: 'Retry',
          action: () => {
            // This will be handled by the calling component
          },
          style: 'primary' as const,
        });
        notificationService.error(
          'LLM Service Error',
          'The AI service is currently unavailable. Please try again in a few minutes.',
          actions
        );
        break;

      case 'quota_exceeded':
        notificationService.error(
          'Quota Exceeded',
          'Your AI service quota has been exceeded. Please check your account limits or try again later.',
          [{
            label: 'Check Usage',
            action: () => {
              // This would open the appropriate provider's dashboard
              window.open('https://platform.openai.com/usage', '_blank');
            },
            style: 'secondary' as const,
          }]
        );
        break;

      case 'invalid_response':
        actions.push({
          label: 'Retry',
          action: () => {
            // This will be handled by the calling component
          },
          style: 'primary' as const,
        });
        notificationService.warning(
          'Invalid Response',
          'The AI service returned an unexpected response. Please try again.',
          actions
        );
        break;

      case 'timeout':
        actions.push({
          label: 'Retry',
          action: () => {
            // This will be handled by the calling component
          },
          style: 'primary' as const,
        });
        notificationService.warning(
          'Request Timeout',
          'The AI service request timed out. This may happen with large code reviews. Please try again.',
          actions
        );
        break;

      case 'configuration_error':
        notificationService.error(
          'Configuration Error',
          'The AI service is not properly configured. Please check your API key and settings.',
          [{
            label: 'Check Settings',
            action: () => {
              // This would navigate to settings
              window.location.hash = '#settings';
            },
            style: 'primary' as const,
          }]
        );
        break;

      default:
        notificationService.error(
          'AI Service Error',
          error.message || 'An error occurred with the AI service.'
        );
    }
  }

  /**
   * Handle template errors
   */
  private static handleTemplateError(error: TemplateError): void {
    const actions = [];

    switch (error.reason) {
      case 'invalid_markdown':
        notificationService.error(
          'Invalid Template',
          'The template contains invalid markdown syntax. Please check the template format.',
          [{
            label: 'Edit Template',
            action: () => {
              // This would navigate to template editor
              window.location.hash = '#templates';
            },
            style: 'primary' as const,
          }]
        );
        break;

      case 'missing_file':
        actions.push({
          label: 'Create Default',
          action: () => {
            // This will be handled by the template service
          },
          style: 'primary' as const,
        });
        notificationService.warning(
          'Template Not Found',
          'The requested template file could not be found. A default template will be used.',
          actions
        );
        break;

      case 'parsing_error':
        notificationService.error(
          'Template Parse Error',
          `Failed to parse template: ${error.details || error.message}`,
          [{
            label: 'Edit Template',
            action: () => {
              window.location.hash = '#templates';
            },
            style: 'primary' as const,
          }]
        );
        break;

      case 'validation_error':
        notificationService.error(
          'Template Validation Error',
          `Template validation failed: ${error.details || error.message}`,
          [{
            label: 'Fix Template',
            action: () => {
              window.location.hash = '#templates';
            },
            style: 'primary' as const,
          }]
        );
        break;

      default:
        notificationService.error(
          'Template Error',
          error.message || 'An error occurred with the template.'
        );
    }
  }

  /**
   * Handle unknown errors
   */
  private static handleUnknownError(error: Error): void {
    notificationService.error(
      'Unexpected Error',
      'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.',
      [
        {
          label: 'Refresh Page',
          action: () => window.location.reload(),
          style: 'primary' as const,
        },
        {
          label: 'Report Issue',
          action: () => {
            // Copy error to clipboard for reporting
            navigator.clipboard.writeText(JSON.stringify({
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            }, null, 2));
            notificationService.success('Error Details Copied', 'Error details copied to clipboard for reporting.');
          },
          style: 'secondary' as const,
        },
      ]
    );
  }

  /**
   * Handle application errors based on type
   */
  private static handleAppError(error: AppError): void {
    switch (error.type) {
      case 'auth':
        this.handleAuthError(error);
        break;
      case 'api':
        this.handleAPIError(error);
        break;
      case 'llm':
        this.handleLLMError(error);
        break;
      case 'template':
        this.handleTemplateError(error);
        break;
      default:
        this.handleUnknownError(error);
    }
  }

  /**
   * Type guard to check if error is an AppError
   */
  private static isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'message' in error;
  }

  /**
   * Utility function to create a delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create an error object with proper typing
   */
  static createError(
    type: AppError['type'],
    reason: string,
    message: string,
    additionalProps: Record<string, any> = {}
  ): AppError {
    const baseError = {
      message,
      code: `${type.toUpperCase()}_${reason.toUpperCase()}`,
      timestamp: new Date().toISOString(),
      type,
      reason,
      ...additionalProps,
    };

    return baseError as AppError;
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handleError.bind(ErrorHandler);
export const withRetry = ErrorHandler.withRetry.bind(ErrorHandler);
export const createRetryWrapper = ErrorHandler.createRetryWrapper.bind(ErrorHandler);
export const createError = ErrorHandler.createError.bind(ErrorHandler);