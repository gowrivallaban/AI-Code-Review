import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { GitHubService } from '../github';
import type { Repository, PullRequest, ReviewComment, GitHubUser } from '../../types';

// Mock axios completely
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      get: vi.fn(),
      isAxiosError: vi.fn(),
    },
  };
});

const mockedAxios = vi.mocked(axios);

describe('GitHubService', () => {
  let service: GitHubService;
  let mockAxiosInstance: any;
  const mockToken = 'ghp_test_token_123';
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://github.com/images/error/testuser_happy.gif',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };
    
    (mockedAxios.create as any).mockReturnValue(mockAxiosInstance);
    (mockedAxios.get as any).mockResolvedValue({ data: mockUser });
    (mockedAxios.isAxiosError as any).mockImplementation((error: any) => {
      return error && typeof error === 'object' && 'response' in error;
    });

    service = new GitHubService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate successfully with valid token', async () => {
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });

      await service.authenticate(mockToken);

      expect(service.isAuthenticated()).toBe(true);
      expect(service.getUser()).toEqual(mockUser);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-PR-Review-UI/1.0.0',
        },
      });
    });

    it('should throw AuthError for empty token', async () => {
      await expect(service.authenticate('')).rejects.toMatchObject({
        type: 'auth',
        reason: 'invalid_token',
        message: 'Token cannot be empty',
      });
    });

    it('should throw AuthError for invalid token (401)', async () => {
      const error = {
        response: { status: 401 },
      };
      (mockedAxios.get as any).mockRejectedValueOnce(error);
      (mockedAxios.isAxiosError as any).mockReturnValueOnce(true);

      await expect(service.authenticate(mockToken)).rejects.toMatchObject({
        type: 'auth',
        reason: 'invalid_token',
        message: 'Invalid GitHub token',
      });
    });

    it('should throw AuthError for insufficient permissions (403)', async () => {
      const error = {
        response: { status: 403 },
      };
      (mockedAxios.get as any).mockRejectedValueOnce(error);
      (mockedAxios.isAxiosError as any).mockReturnValueOnce(true);

      await expect(service.authenticate(mockToken)).rejects.toMatchObject({
        type: 'auth',
        reason: 'insufficient_permissions',
        message: 'Token lacks required permissions',
      });
    });

    it('should throw AuthError for network errors', async () => {
      const error = new Error('Network Error');
      (mockedAxios.get as any).mockRejectedValueOnce(error);
      (mockedAxios.isAxiosError as any).mockReturnValueOnce(false);

      await expect(service.authenticate(mockToken)).rejects.toMatchObject({
        type: 'auth',
        reason: 'network_error',
        message: 'Failed to authenticate with GitHub',
      });
    });
  });

  describe('getRepositories', () => {
    const mockRepositories: Repository[] = [
      {
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        owner: mockUser,
        private: false,
        description: 'A test repository',
        html_url: 'https://github.com/testuser/test-repo',
        clone_url: 'https://github.com/testuser/test-repo.git',
        default_branch: 'main',
      },
    ];

    beforeEach(async () => {
      // Authenticate first
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });
      await service.authenticate(mockToken);
      vi.clearAllMocks();
    });

    it('should fetch repositories successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockRepositories });

      const result = await service.getRepositories();

      expect(result).toEqual(mockRepositories);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/user/repos', {
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page: 1,
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const firstPage = Array(100).fill(null).map((_, i) => ({
        ...mockRepositories[0],
        id: i + 1,
        name: `repo-${i + 1}`,
      }));
      const secondPage = [{ ...mockRepositories[0], id: 101, name: 'repo-101' }];

      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: firstPage })
        .mockResolvedValueOnce({ data: secondPage });

      const result = await service.getRepositories();

      expect(result).toHaveLength(101);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should throw AuthError when not authenticated', async () => {
      const unauthenticatedService = new GitHubService();

      await expect(unauthenticatedService.getRepositories()).rejects.toMatchObject({
        type: 'auth',
        reason: 'invalid_token',
        message: 'Not authenticated. Please provide a valid GitHub token.',
      });
    });
  });

  describe('getPullRequests', () => {
    const mockPullRequests: PullRequest[] = [
      {
        id: 1,
        number: 1,
        title: 'Test PR',
        body: 'Test pull request',
        user: mockUser,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        head: {
          sha: 'abc123',
          ref: 'feature-branch',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'testuser/test-repo',
            owner: mockUser,
            private: false,
            html_url: 'https://github.com/testuser/test-repo',
            clone_url: 'https://github.com/testuser/test-repo.git',
            default_branch: 'main',
          },
        },
        base: {
          sha: 'def456',
          ref: 'main',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'testuser/test-repo',
            owner: mockUser,
            private: false,
            html_url: 'https://github.com/testuser/test-repo',
            clone_url: 'https://github.com/testuser/test-repo.git',
            default_branch: 'main',
          },
        },
        state: 'open',
        html_url: 'https://github.com/testuser/test-repo/pull/1',
        diff_url: 'https://github.com/testuser/test-repo/pull/1.diff',
      },
    ];

    beforeEach(async () => {
      // Authenticate first
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });
      await service.authenticate(mockToken);
      vi.clearAllMocks();
    });

    it('should fetch pull requests successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockPullRequests });

      const result = await service.getPullRequests('testuser/test-repo');

      expect(result).toEqual(mockPullRequests);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/testuser/test-repo/pulls', {
        params: {
          state: 'open',
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
        },
      });
    });

    it('should throw APIError for invalid repository format', async () => {
      await expect(service.getPullRequests('invalid-repo')).rejects.toMatchObject({
        type: 'api',
        reason: 'not_found',
        message: 'Invalid repository format. Expected "owner/repo"',
      });
    });

    it('should throw AuthError when not authenticated', async () => {
      const unauthenticatedService = new GitHubService();

      await expect(unauthenticatedService.getPullRequests('testuser/test-repo')).rejects.toMatchObject({
        type: 'auth',
        reason: 'invalid_token',
        message: 'Not authenticated. Please provide a valid GitHub token.',
      });
    });
  });

  describe('getPullRequestDiff', () => {
    const mockDiff = `diff --git a/file.js b/file.js
index 1234567..abcdefg 100644
--- a/file.js
+++ b/file.js
@@ -1,3 +1,4 @@
 function test() {
+  console.log('test');
   return true;
 }`;

    beforeEach(async () => {
      // Authenticate first
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });
      await service.authenticate(mockToken);
      vi.clearAllMocks();
    });

    it('should fetch pull request diff successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockDiff });

      const result = await service.getPullRequestDiff('testuser/test-repo', 1);

      expect(result).toBe(mockDiff);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/repos/testuser/test-repo/pulls/1', {
        headers: {
          'Accept': 'application/vnd.github.v3.diff',
        },
      });
    });

    it('should throw APIError for invalid repository format', async () => {
      await expect(service.getPullRequestDiff('invalid-repo', 1)).rejects.toMatchObject({
        type: 'api',
        reason: 'not_found',
        message: 'Invalid repository format. Expected "owner/repo"',
      });
    });

    it('should throw APIError for invalid PR number', async () => {
      await expect(service.getPullRequestDiff('testuser/test-repo', 0)).rejects.toMatchObject({
        type: 'api',
        reason: 'not_found',
        message: 'Invalid pull request number',
      });
    });
  });

  describe('postReviewComments', () => {
    const mockComments: ReviewComment[] = [
      {
        id: '1',
        file: 'src/test.js',
        line: 10,
        content: 'Consider using const instead of let',
        severity: 'warning',
        status: 'accepted',
        createdAt: '2023-01-01T00:00:00Z',
      },
      {
        id: '2',
        file: 'src/test.js',
        line: 15,
        content: 'This function is too complex',
        severity: 'error',
        status: 'rejected',
        createdAt: '2023-01-01T00:00:00Z',
      },
    ];

    beforeEach(async () => {
      // Authenticate first
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });
      await service.authenticate(mockToken);
      vi.clearAllMocks();
    });

    it('should post review comments successfully', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      await service.postReviewComments('testuser/test-repo', 1, mockComments);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/repos/testuser/test-repo/pulls/1/reviews', {
        body: expect.stringContaining('## Automated Code Review'),
        event: 'COMMENT',
      });
    });

    it('should only post accepted comments', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: {} });

      await service.postReviewComments('testuser/test-repo', 1, mockComments);

      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.body).toContain('Consider using const instead of let');
      expect(callArgs.body).not.toContain('This function is too complex');
    });

    it('should handle empty comments array', async () => {
      await service.postReviewComments('testuser/test-repo', 1, []);

      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });

    it('should handle no accepted comments', async () => {
      const rejectedComments = mockComments.map(c => ({ ...c, status: 'rejected' as const }));

      await service.postReviewComments('testuser/test-repo', 1, rejectedComments);

      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should return correct authentication status', () => {
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getUser()).toBe(null);
    });

    it('should clear authentication', async () => {
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });
      await service.authenticate(mockToken);

      expect(service.isAuthenticated()).toBe(true);

      service.clearAuth();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.getUser()).toBe(null);
    });
  });

  describe('error handling and retry logic', () => {
    beforeEach(async () => {
      // Authenticate first
      (mockedAxios.get as any).mockResolvedValueOnce({ data: mockUser });
      await service.authenticate(mockToken);
      vi.clearAllMocks();
    });

    it('should handle rate limiting with retry-after header', async () => {
      const rateLimitError = {
        response: {
          status: 403,
          headers: { 'retry-after': '2' },
        },
      };

      mockAxiosInstance.get
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: [] });

      // Mock the delay function to avoid actual waiting in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((callback) => callback()) as any;

      const result = await service.getRepositories();

      expect(result).toEqual([]);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      global.setTimeout = originalSetTimeout;
    });

    it('should handle network errors with retry', async () => {
      const networkError = new Error('Network Error');

      mockAxiosInstance.get
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: [] });

      // Mock the delay function to avoid actual waiting in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((callback) => callback()) as any;

      const result = await service.getRepositories();

      expect(result).toEqual([]);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      global.setTimeout = originalSetTimeout;
    });
  });
});