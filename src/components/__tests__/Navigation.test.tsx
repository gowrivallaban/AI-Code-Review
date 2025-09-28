import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '../Navigation';
import { AppProvider } from '../../context';
import { vi } from 'vitest';

// Mock the hooks
const mockSetCurrentView = vi.fn();
const mockLogout = vi.fn();

vi.mock('../../hooks', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { 
      login: 'testuser', 
      avatar_url: 'https://example.com/avatar.jpg',
      name: 'Test User'
    },
    logout: mockLogout,
  }),
  useUI: () => ({
    currentView: 'repos',
    setCurrentView: mockSetCurrentView,
  }),
  useCurrentSelection: () => ({
    repository: { name: 'test-repo' },
    pullRequest: { number: 123, title: 'Test PR' },
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items when authenticated', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('Pull Requests')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('shows user avatar and name', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const avatar = screen.getByAltText('testuser');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('highlights current view', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const reposButton = screen.getByRole('button', { name: /repositories/i });
    expect(reposButton).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('handles navigation clicks', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const templatesButton = screen.getByRole('button', { name: /templates/i });
    fireEvent.click(templatesButton);

    expect(mockSetCurrentView).toHaveBeenCalledWith('templates');
  });

  it('disables unavailable navigation items', () => {
    // Re-render with different mock values
    const mockUseCurrentSelection = vi.fn().mockReturnValue({
      repository: null,
      pullRequest: null,
    });

    vi.doMock('../../hooks', () => ({
      useAuth: () => ({
        isAuthenticated: true,
        user: { 
          login: 'testuser', 
          avatar_url: 'https://example.com/avatar.jpg',
          name: 'Test User'
        },
        logout: mockLogout,
      }),
      useUI: () => ({
        currentView: 'repos',
        setCurrentView: mockSetCurrentView,
      }),
      useCurrentSelection: mockUseCurrentSelection,
    }));

    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const prsButton = screen.getByRole('button', { name: /pull requests/i });
    const reviewButton = screen.getByRole('button', { name: /code review/i });

    expect(prsButton).toBeDisabled();
    expect(reviewButton).toBeDisabled();
    expect(prsButton).toHaveClass('text-gray-400', 'cursor-not-allowed');
  });

  it('handles logout click', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('returns null when not authenticated', () => {
    const mockUseAuth = vi.fn().mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
    });

    vi.doMock('../../hooks', () => ({
      useAuth: mockUseAuth,
      useUI: () => ({
        currentView: 'repos',
        setCurrentView: mockSetCurrentView,
      }),
      useCurrentSelection: () => ({
        repository: { name: 'test-repo' },
        pullRequest: { number: 123, title: 'Test PR' },
      }),
    }));

    const { container } = render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows icons for all navigation items', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    // Check that SVG icons are present
    const svgElements = screen.getAllByRole('button').map(button => 
      button.querySelector('svg')
    ).filter(Boolean);

    expect(svgElements).toHaveLength(5); // 4 nav items + logout button
  });

  it('applies responsive classes for text visibility', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    const reposButton = screen.getByRole('button', { name: /repositories/i });
    const span = reposButton.querySelector('span');
    
    expect(span).toHaveClass('hidden', 'sm:inline');
  });
});