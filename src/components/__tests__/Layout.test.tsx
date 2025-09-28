import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';
import { AppProvider } from '../../context';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { login: 'testuser', avatar_url: 'https://example.com/avatar.jpg' },
    logout: vi.fn(),
  }),
  useUI: () => ({
    error: null,
    loading: false,
    currentView: 'repos',
    clearError: vi.fn(),
  }),
  useCurrentSelection: () => ({
    repository: { name: 'test-repo' },
    pullRequest: null,
    hasSelection: false,
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AppProvider>
      <Layout>{children}</Layout>
    </AppProvider>
  </BrowserRouter>
);

describe('Layout Component', () => {
  beforeEach(() => {
    // Reset viewport to desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('renders the main layout structure', () => {
    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    expect(screen.getByText('GitHub PR Review UI')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('GitHub PR Review UI - Powered by AI')).toBeInTheDocument();
  });

  it('shows navigation for authenticated users', () => {
    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('shows breadcrumbs for authenticated users', () => {
    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('test-repo')).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    const mobileMenuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(mobileMenuButton);

    // Mobile menu should now be visible
    expect(screen.getByText('Select a repository')).toBeInTheDocument();
  });

  it('displays user avatar and name in footer', () => {
    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    const avatar = screen.getByAltText('testuser');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('shows repository name in footer when selected', () => {
    render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    expect(screen.getByText('test-repo')).toBeInTheDocument();
  });

  it('applies responsive padding classes', () => {
    const { container } = render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
  });

  it('has proper responsive layout structure', () => {
    const { container } = render(
      <TestWrapper>
        <div>Test Content</div>
      </TestWrapper>
    );

    const headerDiv = container.querySelector('header > div');
    expect(headerDiv).toHaveClass('max-w-7xl', 'mx-auto');

    const mainElement = container.querySelector('main');
    expect(mainElement).toHaveClass('max-w-7xl', 'mx-auto');
  });
});

describe('Layout Responsive Behavior', () => {
  const testViewports = [
    { width: 320, height: 568, name: 'Mobile Small' },
    { width: 375, height: 667, name: 'Mobile Medium' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop Small' },
    { width: 1440, height: 900, name: 'Desktop Large' },
  ];

  testViewports.forEach(({ width, height, name }) => {
    it(`renders correctly on ${name} (${width}x${height})`, () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      });

      const { container } = render(
        <TestWrapper>
          <div>Test Content for {name}</div>
        </TestWrapper>
      );

      // Basic layout should always be present
      expect(screen.getByText('GitHub PR Review UI')).toBeInTheDocument();
      expect(screen.getByText(`Test Content for ${name}`)).toBeInTheDocument();

      // Check responsive classes are applied
      const headerDiv = container.querySelector('header > div');
      expect(headerDiv).toHaveClass('max-w-7xl', 'mx-auto');

      if (width < 768) {
        // Mobile: should have mobile menu button
        expect(screen.getByRole('button', { name: /open main menu/i })).toBeInTheDocument();
      } else {
        // Desktop: should have visible navigation (check for button with Repositories text)
        expect(screen.getByRole('button', { name: /repositories/i })).toBeInTheDocument();
      }
    });
  });
});