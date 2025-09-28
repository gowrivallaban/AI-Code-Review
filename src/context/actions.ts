import type { AppAction, AuthState, Repository, PullRequest, ReviewComment, ReviewTemplate, UIState } from '../types';

// UI Actions
export const setLoading = (loading: boolean): AppAction => ({
  type: 'SET_LOADING',
  payload: loading,
});

export const setError = (error: string | null): AppAction => ({
  type: 'SET_ERROR',
  payload: error,
});

export const setCurrentView = (view: UIState['currentView']): AppAction => ({
  type: 'SET_CURRENT_VIEW',
  payload: view,
});

export const setReviewRunning = (isRunning: boolean): AppAction => ({
  type: 'SET_REVIEW_RUNNING',
  payload: isRunning,
});

// Auth Actions
export const setAuth = (authData: Partial<AuthState>): AppAction => ({
  type: 'SET_AUTH',
  payload: authData,
});

export const authenticate = (token: string, user: AuthState['user']): AppAction => ({
  type: 'SET_AUTH',
  payload: {
    isAuthenticated: true,
    token,
    user,
  },
});

export const logout = (): AppAction => ({
  type: 'SET_AUTH',
  payload: {
    isAuthenticated: false,
    token: null,
    user: null,
  },
});

// Repository Actions
export const setRepositories = (repositories: Repository[]): AppAction => ({
  type: 'SET_REPOSITORIES',
  payload: repositories,
});

export const selectRepository = (repository: Repository | null): AppAction => ({
  type: 'SELECT_REPOSITORY',
  payload: repository,
});

// Pull Request Actions
export const setPullRequests = (pullRequests: PullRequest[]): AppAction => ({
  type: 'SET_PULL_REQUESTS',
  payload: pullRequests,
});

export const selectPullRequest = (pullRequest: PullRequest | null): AppAction => ({
  type: 'SELECT_PULL_REQUEST',
  payload: pullRequest,
});

// Review Comment Actions
export const setReviewComments = (comments: ReviewComment[]): AppAction => ({
  type: 'SET_REVIEW_COMMENTS',
  payload: comments,
});

export const updateComment = (id: string, updates: Partial<ReviewComment>): AppAction => ({
  type: 'UPDATE_COMMENT',
  payload: { id, updates },
});

export const acceptComment = (id: string): AppAction => ({
  type: 'UPDATE_COMMENT',
  payload: { id, updates: { status: 'accepted' } },
});

export const rejectComment = (id: string): AppAction => ({
  type: 'UPDATE_COMMENT',
  payload: { id, updates: { status: 'rejected' } },
});

export const editComment = (id: string, content: string): AppAction => ({
  type: 'UPDATE_COMMENT',
  payload: { id, updates: { content, isEditing: false } },
});

export const startEditingComment = (id: string): AppAction => ({
  type: 'UPDATE_COMMENT',
  payload: { id, updates: { isEditing: true } },
});

export const cancelEditingComment = (id: string, originalContent: string): AppAction => ({
  type: 'UPDATE_COMMENT',
  payload: { 
    id, 
    updates: { 
      isEditing: false, 
      content: originalContent 
    } 
  },
});

export const deleteComment = (id: string): AppAction => ({
  type: 'DELETE_COMMENT',
  payload: id,
});

// Template Actions
export const setTemplates = (templates: ReviewTemplate[]): AppAction => ({
  type: 'SET_TEMPLATES',
  payload: templates,
});

// Global Actions
export const resetState = (): AppAction => ({
  type: 'RESET_STATE',
});