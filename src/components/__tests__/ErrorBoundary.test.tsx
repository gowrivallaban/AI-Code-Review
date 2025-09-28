import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { notificationService } from '../../services';

// Mock the notification service
vi.mock('../../services', () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred in the application.')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows notification when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(notificationService.error).toHaveBeenCalledWith(
      'Application Error',
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

  it('refreshes page when refresh button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('copies error details when copy button is clicked', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const copyButton = screen.getByText('Copy Error Details');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    expect(notificationService.success).toHaveBeenCalledWith(
      'Error Details Copied',
      'Error details have been copied to your clipboard for reporting.'
    );
  });

  it('handles clipboard copy failure gracefully', async () => {
    // Mock clipboard failure
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Clipboard failed'));

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const copyButton = screen.getByText('Copy Error Details');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(notificationService.warning).toHaveBeenCalledWith(
        'Copy Failed',
        'Could not copy error details. Please manually copy the error information from the console.'
      );
    });
  });

  it('allows retry after error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    // After retry, the error boundary should reset and try to render children again
    // Since we're still passing shouldThrow=true, it will error again
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('logs error details to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('includes error context in error report', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const copyButton = screen.getByText('Copy Error Details');
    fireEvent.click(copyButton);

    await waitFor(() => {
      const copyCall = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
      const errorReport = JSON.parse(copyCall);

      expect(errorReport).toMatchObject({
        message: 'Test error message',
        timestamp: expect.any(String),
        userAgent: expect.any(String),
        url: 'http://localhost:3000',
      });
      expect(errorReport.stack).toBeDefined();
      expect(errorReport.componentStack).toBeDefined();
    });
  });
});