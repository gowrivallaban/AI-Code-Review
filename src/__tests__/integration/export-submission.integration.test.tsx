import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewExportSubmission } from '../../components/ReviewExportSubmission';
import { exportService, githubService, notificationService } from '../../services';
import type { ReviewComment, PullRequest, Repository } from '../../types';

// Mock services
vi.mock('../../services', () => ({
  exportService: {
    exportReview: vi.fn(),
    downloadFile: vi.fn(),
    copyToClipboard: vi.fn(),
  },
  githubService: {
    postReviewComments: vi.fn(),
  },
  notificationService: {
    warning: vi.fn(),
    submissionSuccess: vi.fn(),
    submissionError: vi.fn(),
    exportSuccess: vi.fn(),
    exportError: vi.fn(),
    copySuccess: vi.fn(),
    copyError: vi.fn(),
  },
}));

// Mock data
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
  updated_at: '2023-01-01T12:00:00Z',
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

const mockComments: ReviewComment[] = [
  {
    id: '1',
    file: 'src/utils.ts',
    line: 10,
    content: 'This function could be optimized for better performance',
    severity: 'warning',
    status: 'accepted',
    createdAt: '2023-01-01T10:00:00Z',
    category: 'performance',
  },
  {
    id: '2',
    file: 'src/utils.ts',
    line: 25,
    content: 'Missing error handling for edge cases',
    severity: 'error',
    status: 'accepted',
    createdAt: '2023-01-01T10:05:00Z',
    category: 'error-handling',
  },
  {
    id: '3',
    file: 'src/components/Button.tsx',
    line: 5,
    content: 'Consider using semantic HTML elements',
    severity: 'info',
    status: 'rejected',
    createdAt: '2023-01-01T10:10:00Z',
    category: 'accessibility',
  },
];

describe('Export and Submission Integration Tests', () => {
  const defaultProps = {
    comments: mockComments,
    pullRequest: mockPullRequest,
    repository: mockRepository,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Export Workflow', () => {
    it('should handle complete export workflow with success', async () => {
      const mockExportResult = {
        content: '# Code Review Report\n\n## Issues Found\n\n- Performance issue in utils.ts\n- Missing error handling',
        filename: 'review-test-repo-pr123-2023-01-01.md',
        mimeType: 'text/markdown',
      };

      vi.mocked(exportService.exportReview).mockReturnValue(mockExportResult);
      vi.mocked(exportService.downloadFile).mockImplementation(() => {});

      const onExportSuccess = vi.fn();

      render(
        <ReviewExportSubmission
          {...defaultProps}
          onExportSuccess={onExportSuccess}
        />
      );

      // Verify initial state
      expect(screen.getByText('Export & Submit Review')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Accepted comments

      // Trigger export
      const exportButton = screen.getByText(/Export as MARKDOWN/);
      fireEvent.click(exportButton);

      // Verify export service was called with correct parameters
      expect(exportService.exportReview).toHaveBeenCalledWith(
        mockComments,
        mockPullRequest,
        mockRepository,
        expect.objectContaining({
          format: 'markdown',
          includeMetadata: true,
          includeRejected: false,
          groupByFile: true,
        })
      );

      // Verify file download was triggered
      expect(exportService.downloadFile).toHaveBeenCalledWith(mockExportResult);

      // Verify success notification
      expect(notificationService.exportSuccess).toHaveBeenCalledWith(
        'markdown',
        mockExportResult.filename
      );

      // Verify callback was called
      expect(onExportSuccess).toHaveBeenCalled();
    });

    it('should handle export failure with fallback options', async () => {
      const exportError = new Error('Failed to generate export file');
      vi.mocked(exportService.exportReview).mockImplementation(() => {
        throw exportError;
      });

      render(<ReviewExportSubmission {...defaultProps} />);

      const exportButton = screen.getByText(/Export as MARKDOWN/);
      fireEvent.click(exportButton);

      // Verify error notification was shown
      expect(notificationService.exportError).toHaveBeenCalledWith(
        'markdown',
        'Failed to generate export file'
      );

      // Verify fallback options are still available
      expect(screen.getByText('Quick Export TXT')).toBeInTheDocument();
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    });

    it('should handle different export formats', async () => {
      const mockResults = {
        markdown: {
          content: '# Markdown Report',
          filename: 'review.md',
          mimeType: 'text/markdown',
        },
        text: {
          content: 'Text Report',
          filename: 'review.txt',
          mimeType: 'text/plain',
        },
        json: {
          content: '{"report": "data"}',
          filename: 'review.json',
          mimeType: 'application/json',
        },
      };

      vi.mocked(exportService.exportReview)
        .mockReturnValueOnce(mockResults.markdown)
        .mockReturnValueOnce(mockResults.text);

      render(<ReviewExportSubmission {...defaultProps} />);

      // Test markdown export
      const quickExportMD = screen.getByText('Quick Export MD');
      fireEvent.click(quickExportMD);

      expect(exportService.exportReview).toHaveBeenCalledWith(
        mockComments,
        mockPullRequest,
        mockRepository,
        expect.objectContaining({ format: 'markdown' })
      );

      // Test text export
      const quickExportTXT = screen.getByText('Quick Export TXT');
      fireEvent.click(quickExportTXT);

      expect(exportService.exportReview).toHaveBeenCalledWith(
        mockComments,
        mockPullRequest,
        mockRepository,
        expect.objectContaining({ format: 'text' })
      );
    });
  });

  describe('Complete Submission Workflow', () => {
    it('should handle complete GitHub submission workflow with success', async () => {
      vi.mocked(githubService.postReviewComments).mockResolvedValue();

      const onSubmissionSuccess = vi.fn();

      render(
        <ReviewExportSubmission
          {...defaultProps}
          onSubmissionSuccess={onSubmissionSuccess}
        />
      );

      // Verify submit button shows correct count
      const submitButton = screen.getByText(/Submit to GitHub \(2\)/);
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      // Trigger submission
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(githubService.postReviewComments).toHaveBeenCalledWith(
          'owner/test-repo',
          123,
          mockComments
        );
      });

      // Verify success notification
      expect(notificationService.submissionSuccess).toHaveBeenCalledWith(2, 123);

      // Verify callback was called
      expect(onSubmissionSuccess).toHaveBeenCalled();
    });

    it('should handle GitHub submission failure with fallback export', async () => {
      const submissionError = new Error('GitHub API rate limit exceeded');
      vi.mocked(githubService.postReviewComments).mockRejectedValue(submissionError);

      render(<ReviewExportSubmission {...defaultProps} />);

      const submitButton = screen.getByText(/Submit to GitHub \(2\)/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(notificationService.submissionError).toHaveBeenCalledWith(
          'GitHub API rate limit exceeded',
          true // fallback available
        );
      });

      // Verify export options are still available as fallback
      expect(screen.getByText(/Export as MARKDOWN/)).toBeInTheDocument();
      expect(screen.getByText('Quick Export MD')).toBeInTheDocument();
    });

    it('should handle submission with mixed comment statuses', async () => {
      const mixedComments: ReviewComment[] = [
        ...mockComments,
        {
          id: '4',
          file: 'src/test.ts',
          line: 15,
          content: 'Pending review comment',
          severity: 'info',
          status: 'pending',
          createdAt: '2023-01-01T10:15:00Z',
        },
      ];

      vi.mocked(githubService.postReviewComments).mockResolvedValue();

      render(
        <ReviewExportSubmission
          {...defaultProps}
          comments={mixedComments}
        />
      );

      // Should still show 2 accepted comments for submission
      const submitButton = screen.getByText(/Submit to GitHub \(2\)/);
      expect(submitButton).toBeInTheDocument();

      // Should show warning about pending comments
      expect(screen.getByText('Pending Comments')).toBeInTheDocument();
      expect(screen.getByText(/You have 1 pending comments/)).toBeInTheDocument();

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(githubService.postReviewComments).toHaveBeenCalledWith(
          'owner/test-repo',
          123,
          mixedComments // All comments passed, but service filters to accepted only
        );
      });
    });
  });

  describe('Copy to Clipboard Workflow', () => {
    it('should handle copy to clipboard workflow with success', async () => {
      const mockExportResult = {
        content: 'Review content for clipboard',
        filename: 'review.md',
        mimeType: 'text/markdown',
      };

      vi.mocked(exportService.exportReview).mockReturnValue(mockExportResult);
      vi.mocked(exportService.copyToClipboard).mockResolvedValue();

      render(<ReviewExportSubmission {...defaultProps} />);

      const copyButton = screen.getByText('Copy to Clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(exportService.exportReview).toHaveBeenCalledWith(
          mockComments,
          mockPullRequest,
          mockRepository,
          expect.objectContaining({ format: 'markdown' })
        );
      });

      expect(exportService.copyToClipboard).toHaveBeenCalledWith(mockExportResult.content);
      expect(notificationService.copySuccess).toHaveBeenCalled();
    });

    it('should handle copy to clipboard failure', async () => {
      const copyError = new Error('Clipboard access denied');
      vi.mocked(exportService.copyToClipboard).mockRejectedValue(copyError);

      render(<ReviewExportSubmission {...defaultProps} />);

      const copyButton = screen.getByText('Copy to Clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(notificationService.copyError).toHaveBeenCalled();
      });
    });
  });

  describe('Export Options Configuration', () => {
    it('should handle export options changes and apply them correctly', async () => {
      const mockExportResult = {
        content: 'Custom export content',
        filename: 'custom-review.json',
        mimeType: 'application/json',
      };

      vi.mocked(exportService.exportReview).mockReturnValue(mockExportResult);

      render(<ReviewExportSubmission {...defaultProps} />);

      // Show export options
      const showOptionsButton = screen.getByText('Show Options');
      fireEvent.click(showOptionsButton);

      // Change format to JSON
      const formatSelect = screen.getByDisplayValue('Markdown (.md)');
      fireEvent.change(formatSelect, { target: { value: 'json' } });

      // Enable rejected comments
      const includeRejectedCheckbox = screen.getByLabelText('Include rejected comments');
      fireEvent.click(includeRejectedCheckbox);

      // Disable metadata
      const includeMetadataCheckbox = screen.getByLabelText('Include metadata');
      fireEvent.click(includeMetadataCheckbox);

      // Disable grouping by file
      const groupByFileCheckbox = screen.getByLabelText('Group by file');
      fireEvent.click(groupByFileCheckbox);

      // Trigger export
      const exportButton = screen.getByText(/Export as JSON/);
      fireEvent.click(exportButton);

      // Verify export was called with updated options
      expect(exportService.exportReview).toHaveBeenCalledWith(
        mockComments,
        mockPullRequest,
        mockRepository,
        expect.objectContaining({
          format: 'json',
          includeMetadata: false,
          includeRejected: true,
          groupByFile: false,
        })
      );
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should provide multiple recovery options when submission fails', async () => {
      const submissionError = new Error('Network timeout');
      vi.mocked(githubService.postReviewComments).mockRejectedValue(submissionError);

      const mockExportResult = {
        content: 'Fallback export content',
        filename: 'fallback-review.md',
        mimeType: 'text/markdown',
      };
      vi.mocked(exportService.exportReview).mockReturnValue(mockExportResult);

      render(<ReviewExportSubmission {...defaultProps} />);

      // Try submission first
      const submitButton = screen.getByText(/Submit to GitHub \(2\)/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(notificationService.submissionError).toHaveBeenCalledWith(
          'Network timeout',
          true
        );
      });

      // Use export as fallback
      const exportButton = screen.getByText(/Export as MARKDOWN/);
      fireEvent.click(exportButton);

      expect(exportService.exportReview).toHaveBeenCalled();
      expect(exportService.downloadFile).toHaveBeenCalledWith(mockExportResult);
      expect(notificationService.exportSuccess).toHaveBeenCalled();
    });

    it('should handle multiple consecutive failures gracefully', async () => {
      // Setup multiple failures
      vi.mocked(githubService.postReviewComments).mockRejectedValue(new Error('Submission failed'));
      vi.mocked(exportService.exportReview).mockImplementation(() => {
        throw new Error('Export failed');
      });
      vi.mocked(exportService.copyToClipboard).mockRejectedValue(new Error('Copy failed'));

      render(<ReviewExportSubmission {...defaultProps} />);

      // Try submission
      const submitButton = screen.getByText(/Submit to GitHub \(2\)/);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(notificationService.submissionError).toHaveBeenCalled();
      });

      // Try export
      const exportButton = screen.getByText(/Export as MARKDOWN/);
      fireEvent.click(exportButton);

      expect(notificationService.exportError).toHaveBeenCalled();

      // Try copy
      const copyButton = screen.getByText('Copy to Clipboard');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(notificationService.copyError).toHaveBeenCalled();
      });

      // Verify UI is still functional
      expect(screen.getByText('Export & Submit Review')).toBeInTheDocument();
    });
  });
});