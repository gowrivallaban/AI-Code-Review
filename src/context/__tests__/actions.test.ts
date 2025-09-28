import { describe, it, expect } from 'vitest';
import * as actions from '../actions';
import type { GitHubUser, Repository, PullRequest, ReviewComment } from '../../types';

describe('Action Creators', () => {
  const mockUser: GitHubUser = {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
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
    it('should create setLoading action', () => {
      const action = actions.setLoading(true);
      expect(action).toEqual({
        type: 'SET_LOADING',
        payload: true,
      });
    });

    it('should create setError action', () => {
      const errorMessage = 'Test error';
      const action = actions.setError(errorMessage);
      expect(action).toEqual({
        type: 'SET_ERROR',
        payload: errorMessage,
      });
    });

    it('should create setCurrentView action', () => {
      const action = actions.setCurrentView('prs');
      expect(action).toEqual({
        type: 'SET_CURRENT_VIEW',
        payload: 'prs',
      });
    });

    it('should create setReviewRunning action', () => {
      const action = actions.setReviewRunning(true);
      expect(action).toEqual({
        type: 'SET_REVIEW_RUNNING',
        payload: true,
      });
    });
  });

  describe('Auth Actions', () => {
    it('should create setAuth action', () => {
      const authData = { isAuthenticated: true, token: 'test-token' };
      const action = actions.setAuth(authData);
      expect(action).toEqual({
        type: 'SET_AUTH',
        payload: authData,
      });
    });

    it('should create authenticate action', () => {
      const token = 'test-token';
      const action = actions.authenticate(token, mockUser);
      expect(action).toEqual({
        type: 'SET_AUTH',
        payload: {
          isAuthenticated: true,
          token,
          user: mockUser,
        },
      });
    });

    it('should create logout action', () => {
      const action = actions.logout();
      expect(action).toEqual({
        type: 'SET_AUTH',
        payload: {
          isAuthenticated: false,
          token: null,
          user: null,
        },
      });
    });
  });

  describe('Repository Actions', () => {
    it('should create setRepositories action', () => {
      const repositories = [mockRepository];
      const action = actions.setRepositories(repositories);
      expect(action).toEqual({
        type: 'SET_REPOSITORIES',
        payload: repositories,
      });
    });

    it('should create selectRepository action', () => {
      const action = actions.selectRepository(mockRepository);
      expect(action).toEqual({
        type: 'SELECT_REPOSITORY',
        payload: mockRepository,
      });
    });
  });

  describe('Pull Request Actions', () => {
    it('should create setPullRequests action', () => {
      const pullRequests = [mockPullRequest];
      const action = actions.setPullRequests(pullRequests);
      expect(action).toEqual({
        type: 'SET_PULL_REQUESTS',
        payload: pullRequests,
      });
    });

    it('should create selectPullRequest action', () => {
      const action = actions.selectPullRequest(mockPullRequest);
      expect(action).toEqual({
        type: 'SELECT_PULL_REQUEST',
        payload: mockPullRequest,
      });
    });
  });

  describe('Review Comment Actions', () => {
    it('should create setReviewComments action', () => {
      const comments = [mockComment];
      const action = actions.setReviewComments(comments);
      expect(action).toEqual({
        type: 'SET_REVIEW_COMMENTS',
        payload: comments,
      });
    });

    it('should create updateComment action', () => {
      const updates = { status: 'accepted' as const };
      const action = actions.updateComment('comment-1', updates);
      expect(action).toEqual({
        type: 'UPDATE_COMMENT',
        payload: { id: 'comment-1', updates },
      });
    });

    it('should create acceptComment action', () => {
      const action = actions.acceptComment('comment-1');
      expect(action).toEqual({
        type: 'UPDATE_COMMENT',
        payload: { id: 'comment-1', updates: { status: 'accepted' } },
      });
    });

    it('should create rejectComment action', () => {
      const action = actions.rejectComment('comment-1');
      expect(action).toEqual({
        type: 'UPDATE_COMMENT',
        payload: { id: 'comment-1', updates: { status: 'rejected' } },
      });
    });

    it('should create editComment action', () => {
      const content = 'Updated content';
      const action = actions.editComment('comment-1', content);
      expect(action).toEqual({
        type: 'UPDATE_COMMENT',
        payload: { 
          id: 'comment-1', 
          updates: { content, isEditing: false } 
        },
      });
    });

    it('should create startEditingComment action', () => {
      const action = actions.startEditingComment('comment-1');
      expect(action).toEqual({
        type: 'UPDATE_COMMENT',
        payload: { id: 'comment-1', updates: { isEditing: true } },
      });
    });

    it('should create cancelEditingComment action', () => {
      const originalContent = 'Original content';
      const action = actions.cancelEditingComment('comment-1', originalContent);
      expect(action).toEqual({
        type: 'UPDATE_COMMENT',
        payload: { 
          id: 'comment-1', 
          updates: { 
            isEditing: false, 
            content: originalContent 
          } 
        },
      });
    });

    it('should create deleteComment action', () => {
      const action = actions.deleteComment('comment-1');
      expect(action).toEqual({
        type: 'DELETE_COMMENT',
        payload: 'comment-1',
      });
    });
  });

  describe('Template Actions', () => {
    it('should create setTemplates action', () => {
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
          securityChecks: ['xss'],
        },
        criteria: ['quality'],
      }];
      
      const action = actions.setTemplates(templates);
      expect(action).toEqual({
        type: 'SET_TEMPLATES',
        payload: templates,
      });
    });
  });

  describe('Global Actions', () => {
    it('should create resetState action', () => {
      const action = actions.resetState();
      expect(action).toEqual({
        type: 'RESET_STATE',
      });
    });
  });
});