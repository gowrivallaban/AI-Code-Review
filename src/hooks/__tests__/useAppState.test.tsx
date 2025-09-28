import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import {
  useAuth,
  useReviewComments,
  useUI,
} from '../useAppState';
import type { GitHubUser, Repository, PullRequest, ReviewComment } from '../../types';

describe('useAppState Hooks', () => {
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



  const mockComment: ReviewComment = {
    id: 'comment-1',
    file: 'src/test.ts',
    line: 10,
    content: 'This is a test comment',
    severity: 'warning',
    status: 'pending',
    createdAt: '2023-01-01T00:00:00Z',
  };

  describe('useAuth', () => {
    it('should provide auth state and actions', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
            <div data-testid="token">{auth.token || 'null'}</div>
            <div data-testid="user">{auth.user?.login || 'null'}</div>
            <button data-testid="authenticate" onClick={() => auth.authenticate('test-token', mockUser)}>
              Authenticate
            </button>
            <button data-testid="logout" onClick={() => auth.logout()}>
              Logout
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('user')).toHaveTextContent('null');

      // Test authenticate
      fireEvent.click(screen.getByTestId('authenticate'));
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token');
      expect(screen.getByTestId('user')).toHaveTextContent('testuser');

      // Test logout
      fireEvent.click(screen.getByTestId('logout'));
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });

  describe('useReviewComments', () => {
    it('should manage comment states', () => {
      const TestComponent = () => {
        const comments = useReviewComments();
        return (
          <div>
            <div data-testid="comment-count">{comments.comments.length}</div>
            <div data-testid="pending-count">{comments.pendingComments.length}</div>
            <div data-testid="accepted-count">{comments.acceptedComments.length}</div>
            <button 
              data-testid="set-comments" 
              onClick={() => comments.setComments([mockComment])}
            >
              Set Comments
            </button>
            <button 
              data-testid="accept-comment" 
              onClick={() => comments.acceptComment('comment-1')}
            >
              Accept Comment
            </button>
            <button 
              data-testid="delete-comment" 
              onClick={() => comments.deleteComment('comment-1')}
            >
              Delete Comment
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('comment-count')).toHaveTextContent('0');
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
      expect(screen.getByTestId('accepted-count')).toHaveTextContent('0');

      // Set comments
      fireEvent.click(screen.getByTestId('set-comments'));
      expect(screen.getByTestId('comment-count')).toHaveTextContent('1');
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');

      // Accept comment
      fireEvent.click(screen.getByTestId('accept-comment'));
      expect(screen.getByTestId('accepted-count')).toHaveTextContent('1');
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0');

      // Delete comment
      fireEvent.click(screen.getByTestId('delete-comment'));
      expect(screen.getByTestId('comment-count')).toHaveTextContent('0');
    });
  });

  describe('useUI', () => {
    it('should manage UI state', () => {
      const TestComponent = () => {
        const ui = useUI();
        return (
          <div>
            <div data-testid="loading">{ui.loading.toString()}</div>
            <div data-testid="error">{ui.error || 'null'}</div>
            <div data-testid="current-view">{ui.currentView}</div>
            <button data-testid="set-loading" onClick={() => ui.setLoading(true)}>
              Set Loading
            </button>
            <button data-testid="set-error" onClick={() => ui.setError('Test error')}>
              Set Error
            </button>
            <button data-testid="clear-error" onClick={() => ui.clearError()}>
              Clear Error
            </button>
            <button data-testid="set-view" onClick={() => ui.setCurrentView('prs')}>
              Set View
            </button>
          </div>
        );
      };

      render(
        <AppProvider>
          <TestComponent />
        </AppProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
      expect(screen.getByTestId('current-view')).toHaveTextContent('repos');

      // Test loading
      fireEvent.click(screen.getByTestId('set-loading'));
      expect(screen.getByTestId('loading')).toHaveTextContent('true');

      // Test error
      fireEvent.click(screen.getByTestId('set-error'));
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');

      fireEvent.click(screen.getByTestId('clear-error'));
      expect(screen.getByTestId('error')).toHaveTextContent('null');

      // Test view
      fireEvent.click(screen.getByTestId('set-view'));
      expect(screen.getByTestId('current-view')).toHaveTextContent('prs');
    });
  });
});