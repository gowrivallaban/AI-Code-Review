import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { App } from '../../components';
import { githubService, notificationService } from '../../services';
import type { AuthError, APIError } from '../../types';

// Mock all services
vi.mock('../../services', () => ({
  githubService: {
    authenticate: vi.fn(),
    getRepositories: vi.fn(),
    getPullRequests: vi.fn(),
    getPullRequestDiff: vi.fn(),
    postReviewComments: vi.fn(),
    isAuthenticated: vi.fn(),
    getUser: vi.fn(),
    clearAuth: vi.fn(),
  },
  llmService: {
    analyzeCode: vi.fn(),
    configure: vi.fn(),
    isConfigured: vi.fn(),
  },
  templateService: {
    loadTemplate: vi.fn(),
    saveTemplate: vi.fn(),
    listTemplates: vi.fn(),
    getDefaultTemplate: vi.fn(),
  },
  notificationService: {
    add: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    getAll: vi.fn(() => []),
    subscribe: vi.fn(() => () => {}),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    exportSuccess: vi.fn(),
    exportError: vi.fn(),
    submissionSuccess: vi.fn(),
    submissionError: vi.fn(),
    copySuccess: vi.fn(),
    copyError: vi.fn(),
  },
}));

// Mock window methods
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
    hash: '',
    href: 'http://localhost:3000',
  },
  writable: true,
});

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(githubService.isAuthenticated).mockReturnValue(false);
    vi.mocked(githubService.getUser).mockReturnValue(null);
  });

  describe('Authentication Error Handling', () => {
    it('handles invalid token error during authentication', async () => {
      const authError: AuthError = {
        type: 'auth',
        code: 'AUTH_INVALID_TOKEN',
        message: 'Invalid GitHub token',
        reason: 'invalid_token',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(githubService.authenticate).mockRejectedValue(authError);

      render(<App />);

      // Find and fill the token input
      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      const authenticateButton = screen.getByRole('button', { name: /Connect to GitHub/i });

      fireEvent.change(tokenInput, { target: { value: 'invalid-token' } });
      fireEvent.click(authenticateButton);

      await waitFor(() => {
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
    });

    it('handles insufficient permissions error', async () => {
      const authError: AuthError = {
        type: 'auth',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions',
        reason: 'insufficient_permissions',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(githubService.authenticate).mockRejectedValue(authError);

      render(<App />);

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      const authenticateButton = screen.getByRole('button', { name: /Connect to GitHub/i });

      fireEvent.change(tokenInput, { target: { value: 'limited-token' } });
      fireEvent.click(authenticateButton);

      await waitFor(() => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Insufficient Permissions',
          'Your GitHub token does not have the required permissions. Please ensure your token has "repo" and "user" scopes.',
          expect.arrayContaining([
            expect.objectContaining({
              label: 'Learn More',
              style: 'secondary',
            }),
          ])
        );
      });
    });
  });

  describe('API Error Handling', () => {
    it('handles network error with retry option', async () => {
      const apiError: APIError = {
        type: 'api',
        code: 'API_NETWORK_ERROR',
        message: 'Network error',
        reason: 'network_error',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(githubService.authenticate).mockRejectedValue(apiError);

      render(<App />);

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      const authenticateButton = screen.getByRole('button', { name: /Connect to GitHub/i });

      fireEvent.change(tokenInput, { target: { value: 'valid-token' } });
      fireEvent.click(authenticateButton);

      await waitFor(() => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Network Error',
          expect.stringContaining('Unable to connect to GitHub'),
          expect.arrayContaining([
            expect.objectContaining({
              label: 'Retry',
              style: 'primary',
            }),
          ])
        );
      });
    });
  });

  describe('Error Recovery', () => {
    it('allows retry after network error', async () => {
      const networkError: APIError = {
        type: 'api',
        code: 'API_NETWORK_ERROR',
        message: 'Network error',
        reason: 'network_error',
        timestamp: new Date().toISOString(),
      };

      vi.mocked(githubService.authenticate)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(undefined);
      
      vi.mocked(githubService.isAuthenticated)
        .mockReturnValueOnce(false)
        .mockReturnValue(true);
      
      vi.mocked(githubService.getUser).mockReturnValue({
        id: 1,
        login: 'testuser',
        avatar_url: 'https://github.com/avatar.jpg',
      });

      render(<App />);

      const tokenInput = screen.getByPlaceholderText(/ghp_/);
      const authenticateButton = screen.getByRole('button', { name: /Connect to GitHub/i });

      // First attempt fails
      fireEvent.change(tokenInput, { target: { value: 'valid-token' } });
      fireEvent.click(authenticateButton);

      await waitFor(() => {
        expect(notificationService.error).toHaveBeenCalledWith(
          'Network Error',
          expect.stringContaining('Unable to connect to GitHub'),
          expect.arrayContaining([
            expect.objectContaining({
              label: 'Retry',
              style: 'primary',
            }),
          ])
        );
      });

      // Second attempt succeeds
      fireEvent.click(authenticateButton);

      await waitFor(() => {
        expect(githubService.authenticate).toHaveBeenCalledTimes(2);
      });
    });
  });
});