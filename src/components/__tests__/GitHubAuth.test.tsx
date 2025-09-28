import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitHubAuth } from '../GitHubAuth';
import { AppProvider } from '../../context';
import { githubService } from '../../services/github';
import type { GitHubUser } from '../../types';

// Mock the GitHub service
vi.mock('../../services/github', () => ({
  githubService: {
    authenticate: vi.fn(),
    getUser: vi.fn(),
  },
}));

const mockGitHubService = githubService as any;

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>{children}</AppProvider>
);

describe('GitHubAuth', () => {
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://github.com/testuser.png',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders authentication form when not authenticated', () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    expect(screen.getByRole('heading', { name: 'Connect to GitHub' })).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Personal Access Token')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect to github/i })).toBeInTheDocument();
    expect(screen.getByText(/your token needs 'repo' scope/i)).toBeInTheDocument();
  });

  it('shows token input field with proper attributes', () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    expect(tokenInput).toHaveAttribute('type', 'password');
    expect(tokenInput).toHaveAttribute('placeholder', 'ghp_xxxxxxxxxxxxxxxxxxxx');
    expect(tokenInput).toHaveAttribute('autocomplete', 'off');
  });

  it('disables submit button when token is empty', () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /connect to github/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when token is entered', () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const submitButton = screen.getByRole('button', { name: /connect to github/i });

    fireEvent.change(tokenInput, { target: { value: 'ghp_test_token' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows error when submitting empty token', async () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const form = tokenInput.closest('form');
    
    if (form) {
      fireEvent.submit(form);
    } else {
      // Fallback: click the submit button
      const submitButton = screen.getByRole('button', { name: /connect to github/i });
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Please enter a GitHub token')).toBeInTheDocument();
    });
  });

  it('clears error when user starts typing', async () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    
    // First trigger an error
    const form = tokenInput.closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(screen.getByText('Please enter a GitHub token')).toBeInTheDocument();
    });

    // Then start typing to clear the error
    fireEvent.change(tokenInput, { target: { value: 'g' } });

    await waitFor(() => {
      expect(screen.queryByText('Please enter a GitHub token')).not.toBeInTheDocument();
    });
  });

  it('handles successful authentication', async () => {
    const onAuthSuccess = vi.fn();
    mockGitHubService.authenticate.mockResolvedValue(undefined);
    mockGitHubService.getUser.mockReturnValue(mockUser);

    render(
      <TestWrapper>
        <GitHubAuth onAuthSuccess={onAuthSuccess} />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const submitButton = screen.getByRole('button', { name: /connect to github/i });

    fireEvent.change(tokenInput, { target: { value: 'ghp_valid_token' } });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });

    // Wait for authentication to complete
    await waitFor(() => {
      expect(mockGitHubService.authenticate).toHaveBeenCalledWith('ghp_valid_token');
      expect(mockGitHubService.getUser).toHaveBeenCalled();
      expect(onAuthSuccess).toHaveBeenCalled();
    });
  });

  it('handles authentication failure with invalid token', async () => {
    const authError = {
      type: 'auth',
      reason: 'invalid_token',
      message: 'Invalid GitHub token',
      code: 'AUTH_INVALID_TOKEN',
      timestamp: new Date().toISOString(),
    };

    mockGitHubService.authenticate.mockRejectedValue(authError);

    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const submitButton = screen.getByRole('button', { name: /connect to github/i });

    fireEvent.change(tokenInput, { target: { value: 'invalid_token' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid github token/i)).toBeInTheDocument();
    });
  });

  it('handles authentication failure with insufficient permissions', async () => {
    const authError = {
      type: 'auth',
      reason: 'insufficient_permissions',
      message: 'Insufficient permissions',
      code: 'AUTH_INSUFFICIENT_PERMISSIONS',
      timestamp: new Date().toISOString(),
    };

    mockGitHubService.authenticate.mockRejectedValue(authError);

    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const submitButton = screen.getByRole('button', { name: /connect to github/i });

    fireEvent.change(tokenInput, { target: { value: 'limited_token' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/token lacks required permissions/i)).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    const authError = {
      type: 'auth',
      reason: 'network_error',
      message: 'Network error',
      code: 'AUTH_NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    };

    mockGitHubService.authenticate.mockRejectedValue(authError);

    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const submitButton = screen.getByRole('button', { name: /connect to github/i });

    fireEvent.change(tokenInput, { target: { value: 'any_token' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during authentication', async () => {
    // Make authenticate hang to test loading state
    mockGitHubService.authenticate.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const tokenInput = screen.getByLabelText('GitHub Personal Access Token');
    const submitButton = screen.getByRole('button', { name: /connect to github/i });

    fireEvent.change(tokenInput, { target: { value: 'test_token' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(tokenInput).toBeDisabled();
    });
  });

  it('includes link to GitHub token creation page', () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    const link = screen.getByRole('link', { name: /create token on github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/settings/tokens');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows instructions for creating a token', () => {
    render(
      <TestWrapper>
        <GitHubAuth />
      </TestWrapper>
    );

    expect(screen.getByText('How to create a Personal Access Token:')).toBeInTheDocument();
    expect(screen.getByText(/go to github settings/i)).toBeInTheDocument();
    expect(screen.getByText(/select the "repo" scope/i)).toBeInTheDocument();
  });
});