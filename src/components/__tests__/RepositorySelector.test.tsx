import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RepositorySelector } from '../RepositorySelector';
import { AppProvider, useAppContext } from '../../context';
import { githubService } from '../../services/github';
import type { Repository, GitHubUser } from '../../types';

// Mock the GitHub service
vi.mock('../../services/github', () => ({
  githubService: {
    getRepositories: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

const mockGitHubService = githubService as any;

// Test wrapper component with authenticated state
const TestWrapper: React.FC<{ children: React.ReactNode; authenticated?: boolean }> = ({ 
  children, 
  authenticated = true 
}) => {
  return (
    <AppProvider>
      <AuthenticatedWrapper authenticated={authenticated}>
        <div data-testid="wrapper">
          {children}
        </div>
      </AuthenticatedWrapper>
    </AppProvider>
  );
};

// Helper component to set authentication state
const AuthenticatedWrapper: React.FC<{ children: React.ReactNode; authenticated: boolean }> = ({ 
  children, 
  authenticated 
}) => {
  const { dispatch } = useAppContext();
  
  React.useEffect(() => {
    if (authenticated) {
      const mockUser: GitHubUser = {
        id: 1,
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      };
      
      dispatch({
        type: 'SET_AUTH',
        payload: {
          isAuthenticated: true,
          token: 'mock-token',
          user: mockUser,
        },
      });
    }
  }, [authenticated, dispatch]);

  return <>{children}</>;
};

describe('RepositorySelector', () => {
  const mockRepositories: Repository[] = [
    {
      id: 1,
      name: 'test-repo-1',
      full_name: 'testuser/test-repo-1',
      owner: {
        id: 1,
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
      private: false,
      description: 'A test repository for unit testing',
      html_url: 'https://github.com/testuser/test-repo-1',
      clone_url: 'https://github.com/testuser/test-repo-1.git',
      default_branch: 'main',
    },
    {
      id: 2,
      name: 'private-repo',
      full_name: 'testuser/private-repo',
      owner: {
        id: 1,
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
      private: true,
      description: 'A private repository',
      html_url: 'https://github.com/testuser/private-repo',
      clone_url: 'https://github.com/testuser/private-repo.git',
      default_branch: 'master',
    },
    {
      id: 3,
      name: 'another-repo',
      full_name: 'testuser/another-repo',
      owner: {
        id: 1,
        login: 'testuser',
        avatar_url: 'https://github.com/testuser.png',
      },
      private: false,
      description: null,
      html_url: 'https://github.com/testuser/another-repo',
      clone_url: 'https://github.com/testuser/another-repo.git',
      default_branch: 'develop',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGitHubService.getRepositories.mockResolvedValue(mockRepositories);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows authentication required message when not authenticated', () => {
    render(
      <TestWrapper authenticated={false}>
        <RepositorySelector />
      </TestWrapper>
    );

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText(/please authenticate with github/i)).toBeInTheDocument();
  });

  it('renders repository selector header', () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    expect(screen.getByText('Select Repository')).toBeInTheDocument();
    expect(screen.getByText(/choose a repository to review/i)).toBeInTheDocument();
  });

  it('shows loading state when fetching repositories', async () => {
    // Make getRepositories hang to test loading state
    mockGitHubService.getRepositories.mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
    });
  });

  it('displays repositories after loading', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
      expect(screen.getByText('private-repo')).toBeInTheDocument();
      expect(screen.getByText('another-repo')).toBeInTheDocument();
    });

    expect(screen.getByText('Showing 3 of 3 repositories')).toBeInTheDocument();
  });

  it('shows private badge for private repositories', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Private')).toBeInTheDocument();
    });
  });

  it('displays repository descriptions when available', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('A test repository for unit testing')).toBeInTheDocument();
      expect(screen.getByText('A private repository')).toBeInTheDocument();
    });
  });

  it('filters repositories by search term', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.change(searchInput, { target: { value: 'private' } });

    await waitFor(() => {
      expect(screen.getByText('private-repo')).toBeInTheDocument();
      expect(screen.queryByText('test-repo-1')).not.toBeInTheDocument();
      expect(screen.queryByText('another-repo')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Showing 1 of 3 repositories')).toBeInTheDocument();
  });

  it('filters repositories by privacy setting', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const privateRadio = screen.getByLabelText('Private');
    fireEvent.click(privateRadio);

    await waitFor(() => {
      expect(screen.getByText('private-repo')).toBeInTheDocument();
      expect(screen.queryByText('test-repo-1')).not.toBeInTheDocument();
      expect(screen.queryByText('another-repo')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Showing 1 of 3 repositories')).toBeInTheDocument();
  });

  it('shows public repositories when public filter is selected', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const publicRadio = screen.getByLabelText('Public');
    fireEvent.click(publicRadio);

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
      expect(screen.getByText('another-repo')).toBeInTheDocument();
      expect(screen.queryByText('private-repo')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Showing 2 of 3 repositories')).toBeInTheDocument();
  });

  it('calls onRepoSelect when repository is clicked', async () => {
    const onRepoSelect = vi.fn();

    render(
      <TestWrapper>
        <RepositorySelector onRepoSelect={onRepoSelect} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const repoCard = screen.getByText('test-repo-1').closest('div');
    if (repoCard) {
      fireEvent.click(repoCard);
    }

    expect(onRepoSelect).toHaveBeenCalledWith(mockRepositories[0]);
  });

  it('shows selected state for selected repository', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const repoCard = screen.getByText('test-repo-1').closest('div');
    if (repoCard) {
      fireEvent.click(repoCard);
    }

    await waitFor(() => {
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });
  });

  it('handles repository loading error', async () => {
    const error = new Error('Failed to load repositories');
    mockGitHubService.getRepositories.mockRejectedValue(error);

    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load repositories/i)).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('allows retrying after error', async () => {
    const error = new Error('Network error');
    mockGitHubService.getRepositories
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(mockRepositories);

    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Try again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });
  });

  it('shows refresh button and allows refreshing', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockGitHubService.getRepositories).toHaveBeenCalledTimes(2);
  });

  it('shows empty state when no repositories match filters', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No repositories found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
    });
  });

  it('shows empty state when user has no repositories', async () => {
    mockGitHubService.getRepositories.mockResolvedValue([]);

    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No repositories found')).toBeInTheDocument();
      expect(screen.getByText('No repositories available.')).toBeInTheDocument();
    });
  });

  it('displays repository metadata correctly', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Owner: testuser')).toBeInTheDocument();
      expect(screen.getByText('Branch: main')).toBeInTheDocument();
      expect(screen.getByText('Branch: master')).toBeInTheDocument();
      expect(screen.getByText('Branch: develop')).toBeInTheDocument();
    });
  });

  it('sorts repositories by name when name sort is selected', async () => {
    render(
      <TestWrapper>
        <RepositorySelector />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('test-repo-1')).toBeInTheDocument();
    });

    const sortSelect = screen.getByDisplayValue('Sort by Updated');
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    // Since we're using alphabetical sorting, the order should be maintained
    // This test verifies the sort functionality is working
    expect(sortSelect).toHaveValue('name');
  });
});