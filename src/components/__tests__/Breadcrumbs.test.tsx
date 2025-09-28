import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Breadcrumbs } from '../Breadcrumbs';
import { AppProvider } from '../../context';
import { vi } from 'vitest';

// Mock the hooks
const mockSetCurrentView = vi.fn();

vi.mock('../../hooks', () => ({
  useUI: () => ({
    currentView: 'review',
    isReviewRunning: false,
    setCurrentView: mockSetCurrentView,
  }),
  useCurrentSelection: () => ({
    repository: { name: 'test-repo' },
    pullRequest: { number: 123, title: 'Test Pull Request Title' },
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

describe('Breadcrumbs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders breadcrumbs with repository and PR selected', () => {
    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('test-repo')).toBeInTheDocument();
    expect(screen.getByText('PR #123: Test Pull Request Title')).toBeInTheDocument();
  });

  it('shows current view indicator', () => {
    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Current:')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
  });

  it('handles breadcrumb navigation clicks', () => {
    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);

    expect(mockSetCurrentView).toHaveBeenCalledWith('repos');
  });

  it('shows review running indicator when active', () => {
    const mockUseUI = vi.fn().mockReturnValue({
      currentView: 'review',
      isReviewRunning: true,
      setCurrentView: mockSetCurrentView,
    });

    vi.doMock('../../hooks', () => ({
      useUI: mockUseUI,
      useCurrentSelection: () => ({
        repository: { name: 'test-repo' },
        pullRequest: { number: 123, title: 'Test Pull Request Title' },
      }),
    }));

    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Reviewing...')).toBeInTheDocument();
  });

  it('returns null when only home breadcrumb exists', () => {
    const mockUseCurrentSelection = vi.fn().mockReturnValue({
      repository: null,
      pullRequest: null,
    });

    const mockUseUI = vi.fn().mockReturnValue({
      currentView: 'repos',
      isReviewRunning: false,
      setCurrentView: mockSetCurrentView,
    });

    vi.doMock('../../hooks', () => ({
      useUI: mockUseUI,
      useCurrentSelection: mockUseCurrentSelection,
    }));

    const { container } = render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows templates breadcrumb when in templates view', () => {
    const mockUseUI = vi.fn().mockReturnValue({
      currentView: 'templates',
      isReviewRunning: false,
      setCurrentView: mockSetCurrentView,
    });

    vi.doMock('../../hooks', () => ({
      useUI: mockUseUI,
      useCurrentSelection: () => ({
        repository: { name: 'test-repo' },
        pullRequest: { number: 123, title: 'Test Pull Request Title' },
      }),
    }));

    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('truncates long PR titles with proper classes', () => {
    const mockUseCurrentSelection = vi.fn().mockReturnValue({
      repository: { name: 'test-repo' },
      pullRequest: { 
        number: 123, 
        title: 'This is a very long pull request title that should be truncated on smaller screens to prevent layout issues'
      },
    });

    vi.doMock('../../hooks', () => ({
      useUI: () => ({
        currentView: 'review',
        isReviewRunning: false,
        setCurrentView: mockSetCurrentView,
      }),
      useCurrentSelection: mockUseCurrentSelection,
    }));

    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    const prElement = screen.getByText(/PR #123:/);
    expect(prElement).toHaveClass('truncate');
    expect(prElement).toHaveClass('max-w-xs', 'sm:max-w-sm', 'md:max-w-md', 'lg:max-w-lg');
  });

  it('shows proper separators between breadcrumb items', () => {
    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    // Should have 2 separators (between Home -> Repo -> PR)
    const separators = screen.getAllByRole('presentation', { hidden: true });
    expect(separators).toHaveLength(2);
  });

  it('marks current breadcrumb item correctly', () => {
    render(
      <TestWrapper>
        <Breadcrumbs />
      </TestWrapper>
    );

    const prElement = screen.getByText('PR #123: Test Pull Request Title');
    expect(prElement).toHaveAttribute('aria-current', 'page');
    expect(prElement.tagName).toBe('SPAN'); // Current item should be span, not button
  });
});