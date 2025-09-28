import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from '../appReducer';
import type { AppState, Repository, PullRequest, ReviewComment, GitHubUser } from '../../types';

describe('appReducer', () => {
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
    name: 'Test User',
  };

  const mockRepository: Repository = {
    id: 1,
    name: 'test-repo',
    full_name: 'testuser/test-repo',
    owner: mockUser,
    private: false,
    html_url: 'https://github.com/testuser/test-repo',
    clone_url: 'https://github.com/testuser/test-repo.git',
    default_branch: 'main',
  };

  const mockPullRequest: PullRequest = {
    id: 1,
    number: 123,
    title: 'Test PR',
    user: mockUser,
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
    html_url: 'https://github.com/testuser/test-repo/pull/123',
    diff_url: 'https://github.com/testuser/test-repo/pull/123.diff',
  };

  const mockComment: ReviewComment = {
    id: 'comment-1',
    file: 'src/test.ts',
    line: 10,
    content: 'This is a test comment',
    severity: 'warning',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z',
  };

  describe('UI Actions', () => {
    it('should handle SET_LOADING', () => {
      const action = { type: 'SET_LOADING' as const, payload: true };
      const newState = appReducer(initialState, action);
      
      expect(newState.ui.loading).toBe(true);
      expect(newState).not.toBe(initialState); // Immutability check
    });

    it('should handle SET_ERROR', () => {
      const errorMessage = 'Test error';
      const action = { type: 'SET_ERROR' as const, payload: errorMessage };
      const newState = appReducer(initialState, action);
      
      expect(newState.ui.error).toBe(errorMessage);
    });

    it('should handle SET_CURRENT_VIEW', () => {
      const action = { type: 'SET_CURRENT_VIEW' as const, payload: 'prs' as const };
      const newState = appReducer(initialState, action);
      
      expect(newState.ui.currentView).toBe('prs');
    });

    it('should handle SET_REVIEW_RUNNING', () => {
      const action = { type: 'SET_REVIEW_RUNNING' as const, payload: true };
      const newState = appReducer(initialState, action);
      
      expect(newState.ui.isReviewRunning).toBe(true);
    });
  });

  describe('Auth Actions', () => {
    it('should handle SET_AUTH with partial data', () => {
      const authData = { isAuthenticated: true, token: 'test-token' };
      const action = { type: 'SET_AUTH' as const, payload: authData };
      const newState = appReducer(initialState, action);
      
      expect(newState.auth.isAuthenticated).toBe(true);
      expect(newState.auth.token).toBe('test-token');
      expect(newState.auth.user).toBe(null); // Should remain unchanged
    });

    it('should handle SET_AUTH with complete authentication', () => {
      const authData = { 
        isAuthenticated: true, 
        token: 'test-token', 
        user: mockUser 
      };
      const action = { type: 'SET_AUTH' as const, payload: authData };
      const newState = appReducer(initialState, action);
      
      expect(newState.auth).toEqual(authData);
    });
  });

  describe('Repository Actions', () => {
    it('should handle SET_REPOSITORIES', () => {
      const repositories = [mockRepository];
      const action = { type: 'SET_REPOSITORIES' as const, payload: repositories };
      const newState = appReducer(initialState, action);
      
      expect(newState.repositories).toEqual(repositories);
    });

    it('should handle SELECT_REPOSITORY and clear related state', () => {
      const stateWithData: AppState = {
        ...initialState,
        pullRequests: [mockPullRequest],
        selectedPR: mockPullRequest,
        reviewComments: [mockComment],
      };
      
      const action = { type: 'SELECT_REPOSITORY' as const, payload: mockRepository };
      const newState = appReducer(stateWithData, action);
      
      expect(newState.selectedRepository).toEqual(mockRepository);
      expect(newState.pullRequests).toEqual([]);
      expect(newState.selectedPR).toBe(null);
      expect(newState.reviewComments).toEqual([]);
    });
  });

  describe('Pull Request Actions', () => {
    it('should handle SET_PULL_REQUESTS', () => {
      const pullRequests = [mockPullRequest];
      const action = { type: 'SET_PULL_REQUESTS' as const, payload: pullRequests };
      const newState = appReducer(initialState, action);
      
      expect(newState.pullRequests).toEqual(pullRequests);
    });

    it('should handle SELECT_PULL_REQUEST and clear review comments', () => {
      const stateWithComments: AppState = {
        ...initialState,
        reviewComments: [mockComment],
      };
      
      const action = { type: 'SELECT_PULL_REQUEST' as const, payload: mockPullRequest };
      const newState = appReducer(stateWithComments, action);
      
      expect(newState.selectedPR).toEqual(mockPullRequest);
      expect(newState.reviewComments).toEqual([]);
    });
  });

  describe('Review Comment Actions', () => {
    it('should handle SET_REVIEW_COMMENTS', () => {
      const comments = [mockComment];
      const action = { type: 'SET_REVIEW_COMMENTS' as const, payload: comments };
      const newState = appReducer(initialState, action);
      
      expect(newState.reviewComments).toEqual(comments);
    });

    it('should handle UPDATE_COMMENT', () => {
      const stateWithComments: AppState = {
        ...initialState,
        reviewComments: [mockComment],
      };
      
      const updates = { status: 'accepted' as const, content: 'Updated content' };
      const action = { 
        type: 'UPDATE_COMMENT' as const, 
        payload: { id: 'comment-1', updates } 
      };
      const newState = appReducer(stateWithComments, action);
      
      expect(newState.reviewComments[0].status).toBe('accepted');
      expect(newState.reviewComments[0].content).toBe('Updated content');
      expect(newState.reviewComments[0].id).toBe('comment-1'); // Other fields unchanged
    });

    it('should handle UPDATE_COMMENT for non-existent comment', () => {
      const stateWithComments: AppState = {
        ...initialState,
        reviewComments: [mockComment],
      };
      
      const updates = { status: 'accepted' as const };
      const action = { 
        type: 'UPDATE_COMMENT' as const, 
        payload: { id: 'non-existent', updates } 
      };
      const newState = appReducer(stateWithComments, action);
      
      expect(newState.reviewComments).toEqual([mockComment]); // No changes
    });

    it('should handle DELETE_COMMENT', () => {
      const comment2: ReviewComment = { ...mockComment, id: 'comment-2' };
      const stateWithComments: AppState = {
        ...initialState,
        reviewComments: [mockComment, comment2],
      };
      
      const action = { type: 'DELETE_COMMENT' as const, payload: 'comment-1' };
      const newState = appReducer(stateWithComments, action);
      
      expect(newState.reviewComments).toEqual([comment2]);
    });
  });

  describe('Template Actions', () => {
    it('should handle SET_TEMPLATES', () => {
      const templates = [{
        name: 'Test Template',
        description: 'A test template',
        content: '# Test',
        prompts: {
          codeQuality: 'Check code quality',
          security: 'Check security',
          performance: 'Check performance',
          maintainability: 'Check maintainability',
          testing: 'Check testing',
        },
        rules: {
          maxComplexity: 10,
          requireTests: true,
          securityChecks: ['xss', 'sql-injection'],
        },
        criteria: ['quality', 'security'],
      }];
      
      const action = { type: 'SET_TEMPLATES' as const, payload: templates };
      const newState = appReducer(initialState, action);
      
      expect(newState.templates).toEqual(templates);
    });
  });

  describe('Global Actions', () => {
    it('should handle RESET_STATE', () => {
      const modifiedState: AppState = {
        ...initialState,
        auth: { isAuthenticated: true, token: 'test', user: mockUser },
        repositories: [mockRepository],
        ui: { ...initialState.ui, loading: true, error: 'test error' },
      };
      
      const action = { type: 'RESET_STATE' as const };
      const newState = appReducer(modifiedState, action);
      
      expect(newState).toEqual(initialState);
    });
  });

  describe('Unknown Actions', () => {
    it('should return current state for unknown actions', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' as any, payload: 'test' };
      const newState = appReducer(initialState, unknownAction);
      
      expect(newState).toBe(initialState);
    });
  });

  describe('State Immutability', () => {
    it('should not mutate the original state', () => {
      const originalState = { ...initialState };
      const action = { type: 'SET_LOADING' as const, payload: true };
      
      appReducer(initialState, action);
      
      expect(initialState).toEqual(originalState);
    });

    it('should create new objects for nested updates', () => {
      const action = { type: 'SET_ERROR' as const, payload: 'test error' };
      const newState = appReducer(initialState, action);
      
      expect(newState).not.toBe(initialState);
      expect(newState.ui).not.toBe(initialState.ui);
      expect(newState.auth).toBe(initialState.auth); // Unchanged references should be preserved
    });
  });
});