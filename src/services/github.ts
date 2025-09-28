import axios, { AxiosInstance, AxiosError } from 'axios';
import { apiCache, CacheKeys, CacheTTL, CacheInvalidation } from './cache';
import {
  GitHubServiceInterface,
  Repository,
  PullRequest,
  ReviewComment,
  GitHubUser,
  APIError,
  AuthError,
} from '../types';

export class GitHubService implements GitHubServiceInterface {
  private client: AxiosInstance;
  private token: string | null = null;
  private user: GitHubUser | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-PR-Review-UI/1.0.0',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleAPIError(error);
      }
    );
  }

  /**
   * Authenticate with GitHub using a personal access token
   */
  async authenticate(token: string): Promise<void> {
    if (!token || token.trim() === '') {
      throw this.createAuthError('invalid_token', 'Token cannot be empty');
    }

    try {
      // Check cache first
      const cacheKey = CacheKeys.user(token);
      const cachedUser = apiCache.get<GitHubUser>(cacheKey);
      
      if (cachedUser) {
        this.token = token;
        this.user = cachedUser;
        return;
      }

      // Test the token by fetching user information
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GitHub-PR-Review-UI/1.0.0',
        },
      });

      this.token = token;
      this.user = response.data;
      
      // Cache the user data
      apiCache.set(cacheKey, this.user, CacheTTL.user);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw this.createAuthError('invalid_token', 'Invalid GitHub token');
        }
        if (error.response?.status === 403) {
          throw this.createAuthError('insufficient_permissions', 'Token lacks required permissions');
        }
      }
      throw this.createAuthError('network_error', 'Failed to authenticate with GitHub');
    }
  }

  /**
   * Fetch repositories accessible to the authenticated user
   */
  async getRepositories(): Promise<Repository[]> {
    this.ensureAuthenticated();

    const cacheKey = CacheKeys.repositories(this.token!);
    
    return apiCache.getOrSet(
      cacheKey,
      async () => {
        try {
          const repositories: Repository[] = [];
          let page = 1;
          const perPage = 100;

          while (true) {
            const response = await this.retryOperation(async () => {
              return this.client.get('/user/repos', {
                params: {
                  sort: 'updated',
                  direction: 'desc',
                  per_page: perPage,
                  page,
                },
              });
            });

            const repos = response.data as Repository[];
            repositories.push(...repos);

            // If we got fewer than perPage results, we've reached the end
            if (repos.length < perPage) {
              break;
            }
            page++;
          }

          return repositories;
        } catch (error) {
          if (error && typeof error === 'object' && 'type' in error) {
            throw error;
          }
          throw this.createAPIError('server_error', 'Failed to fetch repositories');
        }
      },
      CacheTTL.repositories
    );
  }

  /**
   * Fetch pull requests for a specific repository
   */
  async getPullRequests(repo: string): Promise<PullRequest[]> {
    this.ensureAuthenticated();

    if (!repo || !repo.includes('/')) {
      throw this.createAPIError('not_found', 'Invalid repository format. Expected "owner/repo"');
    }

    const cacheKey = CacheKeys.pullRequests(repo);
    
    return apiCache.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await this.retryOperation(async () => {
            return this.client.get(`/repos/${repo}/pulls`, {
              params: {
                state: 'open',
                sort: 'updated',
                direction: 'desc',
                per_page: 100,
              },
            });
          });

          return response.data as PullRequest[];
        } catch (error) {
          if (error && typeof error === 'object' && 'type' in error) {
            throw error;
          }
          throw this.createAPIError('server_error', `Failed to fetch pull requests for ${repo}`);
        }
      },
      CacheTTL.pullRequests
    );
  }

  /**
   * Fetch the diff for a specific pull request
   */
  async getPullRequestDiff(repo: string, prNumber: number): Promise<string> {
    this.ensureAuthenticated();

    if (!repo || !repo.includes('/')) {
      throw this.createAPIError('not_found', 'Invalid repository format. Expected "owner/repo"');
    }

    if (!prNumber || prNumber <= 0) {
      throw this.createAPIError('not_found', 'Invalid pull request number');
    }

    const cacheKey = CacheKeys.pullRequestDiff(repo, prNumber);
    
    return apiCache.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await this.retryOperation(async () => {
            return this.client.get(`/repos/${repo}/pulls/${prNumber}`, {
              headers: {
                'Accept': 'application/vnd.github.v3.diff',
              },
            });
          });

          return response.data as string;
        } catch (error) {
          if (error && typeof error === 'object' && 'type' in error) {
            throw error;
          }
          throw this.createAPIError('server_error', `Failed to fetch diff for PR #${prNumber} in ${repo}`);
        }
      },
      CacheTTL.pullRequestDiff
    );
  }

  /**
   * Post review comments to a GitHub pull request
   */
  async postReviewComments(repo: string, prNumber: number, comments: ReviewComment[]): Promise<void> {
    this.ensureAuthenticated();

    if (!repo || !repo.includes('/')) {
      throw this.createAPIError('not_found', 'Invalid repository format. Expected "owner/repo"');
    }

    if (!prNumber || prNumber <= 0) {
      throw this.createAPIError('not_found', 'Invalid pull request number');
    }

    if (!comments || comments.length === 0) {
      return; // Nothing to post
    }

    try {
      // Filter only accepted comments
      const acceptedComments = comments.filter(comment => comment.status === 'accepted');
      
      if (acceptedComments.length === 0) {
        return; // No accepted comments to post
      }

      // Create a review with comments
      const reviewBody = this.formatReviewBody(acceptedComments);
      
      await this.retryOperation(async () => {
        return this.client.post(`/repos/${repo}/pulls/${prNumber}/reviews`, {
          body: reviewBody,
          event: 'COMMENT', // Use COMMENT instead of APPROVE/REQUEST_CHANGES
        });
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error;
      }
      throw this.createAPIError('server_error', `Failed to post review comments for PR #${prNumber} in ${repo}`);
    }
  }

  /**
   * Get the authenticated user information
   */
  getUser(): GitHubUser | null {
    return this.user;
  }

  /**
   * Check if the service is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  /**
   * Clear authentication state
   */
  clearAuth(): void {
    // Invalidate all caches when clearing auth
    CacheInvalidation.invalidateAll();
    this.token = null;
    this.user = null;
  }

  // Private helper methods

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw this.createAuthError('invalid_token', 'Not authenticated. Please provide a valid GitHub token.');
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors or client errors (4xx)
        if (error && typeof error === 'object' && 'type' in error) {
          const typedError = error as any;
          
          if (typedError.type === 'auth') {
            throw error;
          }

          if (typedError.type === 'api') {
            // Don't retry on client errors (4xx) except rate limiting
            if (typedError.status && typedError.status >= 400 && typedError.status < 500 && typedError.reason !== 'rate_limit') {
              throw error;
            }

            // Handle rate limiting with exponential backoff
            if (typedError.reason === 'rate_limit' && typedError.retryAfter) {
              const delay = typedError.retryAfter * 1000; // Convert to milliseconds
              await this.delay(delay);
              continue;
            }
          }
        }

        // For other errors, use exponential backoff
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleAPIError(error: AxiosError): APIError | AuthError {
    const status = error.response?.status;
    const message = error.message;

    // Handle authentication errors
    if (status === 401) {
      return this.createAuthError('invalid_token', 'Authentication failed');
    }

    if (status === 403) {
      // Check if it's rate limiting
      const retryAfter = error.response?.headers['retry-after'];
      if (retryAfter) {
        return this.createAPIError('rate_limit', 'Rate limit exceeded', status, parseInt(retryAfter));
      }
      return this.createAuthError('insufficient_permissions', 'Insufficient permissions');
    }

    // Handle other API errors
    if (status === 404) {
      return this.createAPIError('not_found', 'Resource not found', status);
    }

    if (status && status >= 500) {
      return this.createAPIError('server_error', 'GitHub server error', status);
    }

    if (!error.response) {
      return this.createAPIError('network_error', 'Network error occurred');
    }

    return this.createAPIError('server_error', message || 'Unknown API error', status);
  }

  private createAuthError(reason: AuthError['reason'], message: string): AuthError {
    return {
      type: 'auth',
      code: `AUTH_${reason.toUpperCase()}`,
      message,
      reason,
      timestamp: new Date().toISOString(),
    };
  }

  private createAPIError(
    reason: APIError['reason'],
    message: string,
    status?: number,
    retryAfter?: number
  ): APIError {
    return {
      type: 'api',
      code: `API_${reason.toUpperCase()}`,
      message,
      reason,
      status,
      retryAfter,
      timestamp: new Date().toISOString(),
    };
  }

  private formatReviewBody(comments: ReviewComment[]): string {
    let body = '## Automated Code Review\n\n';
    
    // Group comments by file
    const commentsByFile = comments.reduce((acc, comment) => {
      if (!acc[comment.file]) {
        acc[comment.file] = [];
      }
      acc[comment.file].push(comment);
      return acc;
    }, {} as Record<string, ReviewComment[]>);

    // Format comments by file
    Object.entries(commentsByFile).forEach(([file, fileComments]) => {
      body += `### ${file}\n\n`;
      
      fileComments.forEach((comment, index) => {
        const severityEmoji = {
          error: '🚨',
          warning: '⚠️',
          info: 'ℹ️'
        }[comment.severity];
        
        body += `${index + 1}. ${severityEmoji} **Line ${comment.line}** (${comment.severity})\n`;
        body += `   ${comment.content}\n\n`;
      });
    });

    body += '\n---\n*Generated by GitHub PR Review UI*';
    
    return body;
  }
}

// Export a singleton instance
export const githubService = new GitHubService();