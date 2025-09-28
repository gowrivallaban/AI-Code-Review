import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CodeReviewInterface } from '../CodeReviewInterface';
import { AppProvider } from '../../context';
import { githubService, llmService, templateService } from '../../services';
import type { Repository, PullRequest, ReviewComment, ReviewTemplate } from '../../types';

// Mock the services
vi.mock('../../services', () => ({
  githubService: {
    getPullRequestDiff: vi.fn(),
  },
  llmService: {
    analyzeCode: vi.fn(),
  },
  templateService: {
    getDefaultTemplate: vi.fn(),
  },
}));

const mockRepository: Repository = {
  id: 1,
  name: 'test-repo',
  full_name: 'owner/test-repo',
  owner: {
    id: 1,
    login: 'owner',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  private: false,
  description: 'Test repository',
  html_url: 'https://github.com/owner/test-repo',
  clone_url: 'https://github.com/owner/test-repo.git',
  default_branch: 'main',
};

const mockPullRequest: PullRequest = {
  id: 1,
  number: 123,
  title: 'Test PR',
  body: 'Test PR description',
  user: {
    id: 2,
    login: 'contributor',
    avatar_url: 'https://example.com/contributor.jpg',
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  head: {
    sha: 'abc123',
    ref: 'feature-branch',
    repo: mockRepository,
  },
  base: {
    sha: 'def456',
    ref: 'main',
    repo: mockRepository,
  },
  state: 'open',
  html_url: 'https://github.com/owner/test-repo/pull/123',
  diff_url: 'https://github.com/owner/test-repo/pull/123.diff',
};

const mockTemplate: ReviewTemplate = {
  name: 'default',
  description: 'Default template',
  content: 'Default template content',
  prompts: {
    codeQuality: 'Review code quality',
    security: 'Check security',
    performance: 'Analyze performance',
    maintainability: 'Check maintainability',
    testing: 'Review tests',
  },
  rules: {
    maxComplexity: 10,
    requireTests: true,
    securityChecks: ['input_validation'],
  },
  criteria: ['Code Quality', 'Security'],
};

const mockComments: ReviewComment[] = [
  {
    id: '1',
    file: 'src/test.js',
    line: 10,
    content: 'Consider using const instead of let',
    severity: 'info',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z',
    category: 'code_quality',
  },
  {
    id: '2',
    file: 'src/test.js',
    line: 20,
    content: 'Potential security vulnerability',
    severity: 'error',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z',
    category: 'security',
  },
];

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AppProvider>
      {component}
    </AppProvider>
  );
};

describe('CodeReviewInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(templateService.getDefaultTemplate).mockReturnValue(mockTemplate);
    vi.mocked(githubService.getPullRequestDiff).mockResolvedValue('mock diff content');
    vi.mocked(llmService.analyzeCode).mockResolvedValue(mockComments);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with initial state', () => {
    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('PR #123: Test PR')).toBeInTheDocument();
    expect(screen.getByText('Run Code Review')).toBeInTheDocument();
    expect(screen.getByText('Ready to Review')).toBeInTheDocument();
    expect(screen.getByText('Repository: owner/test-repo')).toBeInTheDocument();
    expect(screen.getByText('Branch: feature-branch → main')).toBeInTheDocument();
  });

  it('shows run code review button in enabled state initially', () => {
    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    expect(runButton).toBeInTheDocument();
    expect(runButton).not.toBeDisabled();
  });

  it('executes code review workflow successfully', async () => {
    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    // Should show loading state
    expect(screen.getByText('Running Review...')).toBeInTheDocument();
    expect(runButton).toBeDisabled();

    // Should show progress indicators
    expect(screen.getByText('Progress')).toBeInTheDocument();
    
    // Wait for the review to complete
    await waitFor(() => {
      expect(screen.getAllByText('Found 2 review comments')).toHaveLength(2); // Appears in both progress and success sections
    });

    // Should show success state
    expect(screen.getByText('Review Complete')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();

    // Verify service calls
    expect(githubService.getPullRequestDiff).toHaveBeenCalledWith('owner/test-repo', 123);
    expect(templateService.getDefaultTemplate).toHaveBeenCalled();
    expect(llmService.analyzeCode).toHaveBeenCalledWith('mock diff content', mockTemplate);
  });

  it('handles empty diff gracefully', async () => {
    vi.mocked(githubService.getPullRequestDiff).mockResolvedValue('');

    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Review Failed')).toBeInTheDocument();
      expect(screen.getAllByText('No changes found in this pull request')).toHaveLength(2); // Appears in both progress and error sections
    });

    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
  });

  it('handles no comments from LLM gracefully', async () => {
    vi.mocked(llmService.analyzeCode).mockResolvedValue([]);

    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getAllByText('No issues found in this pull request')).toHaveLength(2); // Appears in both progress and success sections
    });

    expect(screen.getByText('Review Complete')).toBeInTheDocument();
  });

  it('handles GitHub API errors with retry option', async () => {
    const error = new Error('GitHub API error');
    vi.mocked(githubService.getPullRequestDiff).mockRejectedValue(error);

    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Review Failed')).toBeInTheDocument();
      expect(screen.getAllByText('GitHub API error')).toHaveLength(2); // Appears in both progress and error sections
    });

    const retryButton = screen.getByRole('button', { name: /Retry/ });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.textContent).toContain('3 left');
  });

  it('handles LLM service errors with retry option', async () => {
    const error = new Error('LLM service error');
    vi.mocked(llmService.analyzeCode).mockRejectedValue(error);

    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Review Failed')).toBeInTheDocument();
      expect(screen.getAllByText('LLM service error')).toHaveLength(2); // Appears in both progress and error sections
    });

    expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();
  });

  it('allows retry after failure', async () => {
    const error = new Error('Temporary error');
    vi.mocked(githubService.getPullRequestDiff)
      .mockRejectedValueOnce(error)
      .mockResolvedValue('mock diff content');

    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    // First attempt fails
    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Review Failed')).toBeInTheDocument();
    });

    // Retry succeeds
    const retryButton = screen.getByRole('button', { name: /Retry/ });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getAllByText('Found 2 review comments')).toHaveLength(2); // Appears in both progress and success sections
    });

    expect(screen.getByText('Review Complete')).toBeInTheDocument();
  });

  it('limits retry attempts to 3', async () => {
    const error = new Error('Persistent error');
    vi.mocked(githubService.getPullRequestDiff).mockRejectedValue(error);

    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    // Initial attempt
    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Review Failed')).toBeInTheDocument();
    });

    // First retry
    let retryButton = screen.getByRole('button', { name: /Retry/ });
    expect(retryButton.textContent).toContain('3 left');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Retry attempt: 1/3')).toBeInTheDocument();
    });

    // Second retry
    retryButton = screen.getByRole('button', { name: /Retry/ });
    expect(retryButton.textContent).toContain('2 left');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Retry attempt: 2/3')).toBeInTheDocument();
    });

    // Third retry
    retryButton = screen.getByRole('button', { name: /Retry/ });
    expect(retryButton.textContent).toContain('1 left');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Retry attempt: 3/3')).toBeInTheDocument();
    });

    // No more retry button after 3 attempts
    expect(screen.queryByRole('button', { name: /Retry/ })).not.toBeInTheDocument();
  });

  it('allows reset after completion', async () => {
    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    // Complete a review
    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Review Complete')).toBeInTheDocument();
    });

    // Reset the review
    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    // Should return to initial state
    expect(screen.getByText('Ready to Review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Code Review' })).not.toBeDisabled();
    expect(screen.queryByText('Review Complete')).not.toBeInTheDocument();
  });

  it('shows progress stages during review execution', async () => {
    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    // Should show fetching diff stage
    expect(screen.getByText('Fetching pull request diff...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Found 2 review comments')).toHaveLength(2); // Appears in both progress and success sections
    });
  });

  it('updates progress bar during execution', async () => {
    renderWithProvider(
      <CodeReviewInterface 
        repository={mockRepository} 
        pullRequest={mockPullRequest} 
      />
    );

    const runButton = screen.getByRole('button', { name: 'Run Code Review' });
    fireEvent.click(runButton);

    // Should show progress bar
    expect(screen.getByText('Progress')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});