import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService } from '../export';
import type { ReviewComment, PullRequest, Repository } from '../../types';

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
    content: 'This function could be optimized',
    severity: 'warning',
    status: 'accepted',
    createdAt: '2023-01-01T10:00:00Z',
    category: 'performance',
  },
  {
    id: '2',
    file: 'src/utils.ts',
    line: 25,
    content: 'Missing error handling',
    severity: 'error',
    status: 'accepted',
    createdAt: '2023-01-01T10:05:00Z',
    category: 'error-handling',
  },
  {
    id: '3',
    file: 'src/components/Button.tsx',
    line: 5,
    content: 'Consider using semantic HTML',
    severity: 'info',
    status: 'rejected',
    createdAt: '2023-01-01T10:10:00Z',
    category: 'accessibility',
  },
  {
    id: '4',
    file: 'src/components/Button.tsx',
    line: 15,
    content: 'Add prop validation',
    severity: 'warning',
    status: 'pending',
    createdAt: '2023-01-01T10:15:00Z',
    category: 'validation',
  },
];

describe('ExportService', () => {
  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
    // Mock Date.now() for consistent timestamps
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('exportReview', () => {
    it('should export review as markdown with default options', () => {
      const result = exportService.exportReview(
        mockComments,
        mockPullRequest,
        mockRepository
      );

      expect(result.filename).toMatch(/review-test-repo-pr123-\d{4}-\d{2}-\d{2}\.md/);
      expect(result.mimeType).toBe('text/markdown');
      expect(result.content).toContain('# Code Review Report');
      expect(result.content).toContain('**Repository:** [owner/test-repo]');
      expect(result.content).toContain('**Pull Request:** [#123 - Test PR]');
      expect(result.content).toContain('## 📁 src/utils.ts');
      expect(result.content).toContain('This function could be optimized');
      expect(result.content).toContain('Missing error handling');
      expect(result.content).not.toContain('Consider using semantic HTML'); // rejected comment
    });

    it('should export review as text format', () => {
      const result = exportService.exportReview(
        mockComments,
        mockPullRequest,
        mockRepository,
        { format: 'text', includeMetadata: true, includeRejected: false, groupByFile: true }
      );

      expect(result.filename).toMatch(/review-test-repo-pr123-\d{4}-\d{2}-\d{2}\.txt/);
      expect(result.mimeType).toBe('text/plain');
      expect(result.content).toContain('Code Review Report');
      expect(result.content).toContain('Repository: owner/test-repo');
      expect(result.content).toContain('FILE: src/utils.ts');
      expect(result.content).toContain('Line 10 [WARNING]');
      expect(result.content).toContain('This function could be optimized');
    });

    it('should export review as JSON format', () => {
      const result = exportService.exportReview(
        mockComments,
        mockPullRequest,
        mockRepository,
        { format: 'json', includeMetadata: true, includeRejected: false, groupByFile: true }
      );

      expect(result.filename).toMatch(/review-test-repo-pr123-\d{4}-\d{2}-\d{2}\.json/);
      expect(result.mimeType).toBe('application/json');
      
      const parsed = JSON.parse(result.content);
      expect(parsed.metadata.repository.name).toBe('test-repo');
      expect(parsed.metadata.pullRequest.number).toBe(123);
      expect(parsed.comments).toHaveLength(2); // Only accepted comments
      expect(parsed.summary.total).toBe(2);
      expect(parsed.summary.errors).toBe(1);
      expect(parsed.summary.warnings).toBe(1);
    });

    it('should include rejected comments when option is enabled', () => {
      const result = exportService.exportReview(
        mockComments,
        mockPullRequest,
        mockRepository,
        { format: 'markdown', includeMetadata: true, includeRejected: true, groupByFile: true }
      );

      expect(result.content).toContain('Consider using semantic HTML'); // rejected comment
    });

    it('should exclude metadata when option is disabled', () => {
      const result = exportService.exportReview(
        mockComments,
        mockPullRequest,
        mockRepository,
        { format: 'markdown', includeMetadata: false, includeRejected: false, groupByFile: true }
      );

      expect(result.content).not.toContain('# Code Review Report');
      expect(result.content).not.toContain('**Repository:**');
      expect(result.content).toContain('## Automated Code Review Summary');
    });

    it('should group comments by order when groupByFile is false', () => {
      const result = exportService.exportReview(
        mockComments,
        mockPullRequest,
        mockRepository,
        { format: 'markdown', includeMetadata: true, includeRejected: false, groupByFile: false }
      );

      expect(result.content).toContain('## Review Comments');
      expect(result.content).not.toContain('## 📁 src/utils.ts');
      expect(result.content).toContain('### 1. ⚠️ src/utils.ts:10 (warning)');
      expect(result.content).toContain('### 2. 🚨 src/utils.ts:25 (error)');
    });

    it('should throw error when no comments to export', () => {
      expect(() => {
        exportService.exportReview(
          [],
          mockPullRequest,
          mockRepository
        );
      }).toThrow('No comments to export');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        exportService.exportReview(
          mockComments,
          mockPullRequest,
          mockRepository,
          { format: 'xml' as any, includeMetadata: true, includeRejected: false, groupByFile: true }
        );
      }).toThrow('Unsupported export format: xml');
    });
  });

  describe('generateSubmissionSummary', () => {
    it('should generate summary for accepted comments', () => {
      const summary = exportService.generateSubmissionSummary(mockComments);

      expect(summary).toContain('## Automated Code Review Summary');
      expect(summary).toContain('Found **2** issues across **1** files'); // Both accepted comments are in same file
      expect(summary).toContain('- 🚨 **1** Critical Issues');
      expect(summary).toContain('- ⚠️ **1** Warnings');
      expect(summary).not.toContain('Suggestions'); // No info level accepted comments
    });

    it('should handle no accepted comments', () => {
      const rejectedComments = mockComments.filter(c => c.status === 'rejected');
      const summary = exportService.generateSubmissionSummary(rejectedComments);

      expect(summary).toBe('No review comments to submit.');
    });
  });

  describe('downloadFile', () => {
    it('should create download link and trigger download', () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const mockCreateElement = vi.fn().mockReturnValue(mockLink);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true,
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      });
      Object.defineProperty(URL, 'createObjectURL', {
        value: mockCreateObjectURL,
        writable: true,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true,
      });

      const result = {
        content: 'test content',
        filename: 'test.md',
        mimeType: 'text/markdown',
      };

      exportService.downloadFile(result);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test.md');
      expect(mockLink.href).toBe('blob:mock-url');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy content to clipboard using modern API', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        writable: true,
      });

      await exportService.copyToClipboard('test content');

      expect(mockWriteText).toHaveBeenCalledWith('test content');
    });

    it('should fallback to legacy method when clipboard API is not available', async () => {
      // Mock legacy clipboard methods
      const mockTextArea = {
        value: '',
        select: vi.fn(),
      };
      const mockCreateElement = vi.fn().mockReturnValue(mockTextArea);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockExecCommand = vi.fn().mockReturnValue(true);

      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      });
      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true,
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true,
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true,
      });
      Object.defineProperty(document, 'execCommand', {
        value: mockExecCommand,
        writable: true,
      });

      await exportService.copyToClipboard('test content');

      expect(mockCreateElement).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe('test content');
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(mockAppendChild).toHaveBeenCalledWith(mockTextArea);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockTextArea);
    });
  });
});