import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { CodeReviewInterface } from '../../components/CodeReviewInterface';
import { GitHubService } from '../../services/github';
import { LLMService } from '../../services/llm';

// Mock services
vi.mock('../../services/github');
vi.mock('../../services/llm');

const mockGitHubService = GitHubService as vi.MockedClass<typeof GitHubService>;
const mockLLMService = LLMService as vi.MockedClass<typeof LLMService>;

describe('GitHub-LLM Integration', () => {
  const mockPR = {
    id: 1,
    number: 1,
    title: 'Test PR',
    user: { login: 'testuser', avatar_url: 'test.jpg' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    head: { sha: 'abc123', ref: 'feature' },
    base: { sha: 'def456', ref: 'main' }
  };

  const mockRepo = {
    id: 1,
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    owner: { login: 'testuser', avatar_url: 'test.jpg' },
    private: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate GitHub API and LLM service for code review', async () => {
    const mockDiff = `diff --git a/src/example.js b/src/example.js
index 1234567..abcdefg 100644
--- a/src/example.js
+++ b/src/example.js
@@ -1,3 +1,5 @@
 function example() {
+  console.log('Hello World');
   return true;
 }`;

    const mockComments = [
      {
        id: '1',
        file: 'src/example.js',
        line: 2,
        content: 'Consider using a proper logging library instead of console.log',
        severity: 'warning' as const,
        status: 'pending' as const
      }
    ];

    // Mock GitHub service
    mockGitHubService.prototype.getPullRequestDiff = vi.fn().mockResolvedValue(mockDiff);
    
    // Mock LLM service
    mockLLMService.prototype.analyzeCode = vi.fn().mockResolvedValue(mockComments);

    render(
      <AppProvider>
        <CodeReviewInterface pullRequest={mockPR} repository={mockRepo} />
      </AppProvider>
    );

    const runReviewButton = screen.getByRole('button', { name: /run code review/i });
    fireEvent.click(runReviewButton);

    await waitFor(() => {
      expect(mockGitHubService.prototype.getPullRequestDiff).toHaveBeenCalledWith(
        'testuser/test-repo',
        1
      );
    });

    await waitFor(() => {
      expect(mockLLMService.prototype.analyzeCode).toHaveBeenCalledWith(
        mockDiff,
        expect.any(String)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Consider using a proper logging library')).toBeInTheDocument();
    });
  });

  it('should handle GitHub API errors gracefully', async () => {
    mockGitHubService.prototype.getPullRequestDiff = vi.fn().mockRejectedValue(
      new Error('GitHub API rate limit exceeded')
    );

    render(
      <AppProvider>
        <CodeReviewInterface pullRequest={mockPR} repository={mockRepo} />
      </AppProvider>
    );

    const runReviewButton = screen.getByRole('button', { name: /run code review/i });
    fireEvent.click(runReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/github api rate limit exceeded/i)).toBeInTheDocument();
    });

    // Should show retry option
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle LLM service errors gracefully', async () => {
    const mockDiff = 'diff --git a/src/example.js b/src/example.js\n+console.log("test");';
    
    mockGitHubService.prototype.getPullRequestDiff = vi.fn().mockResolvedValue(mockDiff);
    mockLLMService.prototype.analyzeCode = vi.fn().mockRejectedValue(
      new Error('LLM service unavailable')
    );

    render(
      <AppProvider>
        <CodeReviewInterface pullRequest={mockPR} repository={mockRepo} />
      </AppProvider>
    );

    const runReviewButton = screen.getByRole('button', { name: /run code review/i });
    fireEvent.click(runReviewButton);

    await waitFor(() => {
      expect(screen.getByText(/llm service unavailable/i)).toBeInTheDocument();
    });

    // Should show retry option
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle large PR diffs by chunking', async () => {
    // Create a large diff
    const largeDiff = Array(1000).fill('+ console.log("line");').join('\n');
    
    mockGitHubService.prototype.getPullRequestDiff = vi.fn().mockResolvedValue(largeDiff);
    mockLLMService.prototype.analyzeCode = vi.fn().mockResolvedValue([]);

    render(
      <AppProvider>
        <CodeReviewInterface pullRequest={mockPR} repository={mockRepo} />
      </AppProvider>
    );

    const runReviewButton = screen.getByRole('button', { name: /run code review/i });
    fireEvent.click(runReviewButton);

    await waitFor(() => {
      // Should call LLM service multiple times for chunked processing
      expect(mockLLMService.prototype.analyzeCode).toHaveBeenCalled();
    });
  });

  it('should preserve comment state during service interactions', async () => {
    const mockDiff = 'diff --git a/src/example.js b/src/example.js\n+console.log("test");';
    const mockComments = [
      {
        id: '1',
        file: 'src/example.js',
        line: 1,
        content: 'Original comment',
        severity: 'info' as const,
        status: 'pending' as const
      }
    ];

    mockGitHubService.prototype.getPullRequestDiff = vi.fn().mockResolvedValue(mockDiff);
    mockLLMService.prototype.analyzeCode = vi.fn().mockResolvedValue(mockComments);

    render(
      <AppProvider>
        <CodeReviewInterface pullRequest={mockPR} repository={mockRepo} />
      </AppProvider>
    );

    // Run initial review
    const runReviewButton = screen.getByRole('button', { name: /run code review/i });
    fireEvent.click(runReviewButton);

    await waitFor(() => {
      expect(screen.getByText('Original comment')).toBeInTheDocument();
    });

    // Edit comment
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    const textArea = screen.getByRole('textbox');
    fireEvent.change(textArea, { target: { value: 'Edited comment' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Edited comment')).toBeInTheDocument();
    });

    // Run review again - edited comments should be preserved
    fireEvent.click(runReviewButton);

    await waitFor(() => {
      expect(screen.getByText('Edited comment')).toBeInTheDocument();
    });
  });
});