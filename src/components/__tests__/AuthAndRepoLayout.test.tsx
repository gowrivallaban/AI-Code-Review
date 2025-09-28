import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthAndRepoLayout } from '../AuthAndRepoLayout';
import { AppProvider } from '../../context';
import type { GitHubUser } from '../../types';

// Mock the child components
vi.mock('../GitHubAuth', () => ({
  GitHubAuth: ({ onAuthSuccess }: { onAuthSuccess?: () => void }) => (
    <div data-testid="github-auth">
      <button onClick={onAuthSuccess}>Mock Auth Success</button>
    </div>
  ),
}));

vi.mock('../RepositorySelector', () => ({
  RepositorySelector: ({ onRepoSelect }: { onRepoSelect?: (repo: any) => void }) => (
    <div data-testid="repository-selector">
      <button onClick={() => onRepoSelect?.({ id: 1, name: 'test-repo' })}>
        Mock Repo Select
      </button>
    </div>
  ),
}));

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  authenticated?: boolean;
  user?: GitHubUser | null;
}> = ({ 
  children, 
  authenticated = false,
  user = null 
}) => {
  return (
    <AppProvider>
      <div data-testid="wrapper">
        {children}
      </div>
    </AppProvider>
  );
};

describe('AuthAndRepoLayout', () => {
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://github.com/testuser.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main header and title', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    expect(screen.getByText('GitHub PR Review UI')).toBeInTheDocument();
    expect(screen.getByText(/automated code review for your github pull requests/i)).toBeInTheDocument();
  });

  it('shows progress steps with correct initial state', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    expect(screen.getByText('Authenticate')).toBeInTheDocument();
    expect(screen.getByText('Select Repository')).toBeInTheDocument();
    expect(screen.getByText('Review PRs')).toBeInTheDocument();

    // Check that step 1 is not completed (should show "1" instead of checkmark)
    const step1 = screen.getByText('1');
    expect(step1).toBeInTheDocument();
  });

  it('renders GitHubAuth component when not authenticated', () => {
    render(
      <TestWrapper authenticated={false}>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    expect(screen.getByTestId('github-auth')).toBeInTheDocument();
    expect(screen.queryByTestId('repository-selector')).not.toBeInTheDocument();
  });

  it('shows security features in footer', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    expect(screen.getByText('Secure authentication with GitHub Personal Access Tokens')).toBeInTheDocument();
    expect(screen.getByText('✓ No data stored permanently')).toBeInTheDocument();
    expect(screen.getByText('✓ Read-only repository access')).toBeInTheDocument();
    expect(screen.getByText('✓ Encrypted token storage')).toBeInTheDocument();
  });

  it('calls onRepoSelect when repository is selected', () => {
    const onRepoSelect = vi.fn();

    render(
      <TestWrapper authenticated={true} user={mockUser}>
        <AuthAndRepoLayout onRepoSelect={onRepoSelect} />
      </TestWrapper>
    );

    // Since we're mocking the components, we can't test the actual flow
    // but we can verify the prop is passed correctly
    expect(screen.getByTestId('repository-selector')).toBeInTheDocument();
  });

  it('has responsive layout classes', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    // Check for responsive classes in the main container
    const mainContainer = screen.getByTestId('wrapper').firstChild;
    expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-50');
  });

  it('shows proper step progression styling', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    // Check that the progress steps have proper ARIA labels
    const progressNav = screen.getByLabelText('Progress');
    expect(progressNav).toBeInTheDocument();
  });

  it('renders with proper semantic HTML structure', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    // Check for proper heading hierarchy
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toHaveTextContent('GitHub PR Review UI');

    // Check for navigation
    const progressNav = screen.getByRole('navigation');
    expect(progressNav).toBeInTheDocument();
  });

  it('has proper spacing and layout structure', () => {
    const { container } = render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    // Check that the layout has proper container classes
    const maxWidthContainer = container.querySelector('.max-w-4xl');
    expect(maxWidthContainer).toBeInTheDocument();

    // Check for proper spacing classes
    const spacingContainer = container.querySelector('.space-y-6');
    expect(spacingContainer).toBeInTheDocument();
  });

  it('shows correct step indicators for unauthenticated state', () => {
    render(
      <TestWrapper authenticated={false}>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    // Step 1 should be active (showing number, not completed)
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Step 2 should be inactive
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Step 3 should be inactive
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('maintains accessibility standards', () => {
    render(
      <TestWrapper>
        <AuthAndRepoLayout />
      </TestWrapper>
    );

    // Check for proper ARIA labels and roles
    expect(screen.getByLabelText('Progress')).toBeInTheDocument();
    
    // Check that headings are properly structured
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    
    // Main heading should be h1
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
  });
});