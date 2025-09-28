import { useAppContext } from '../context/AppContext';
import type { 
  Repository, 
  PullRequest, 
  ReviewComment, 
  ReviewTemplate, 
  AuthState, 
  UIState,
  GitHubUser 
} from '../types';
import * as actions from '../context/actions';

// Main hook for accessing context
export const useAppState = () => {
  const { state, dispatch } = useAppContext();
  return { state, dispatch };
};

// Auth-related hooks
export const useAuth = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    ...state.auth,
    authenticate: (token: string, user: GitHubUser) => 
      dispatch(actions.authenticate(token, user)),
    logout: () => dispatch(actions.logout()),
    setAuth: (authData: Partial<AuthState>) => 
      dispatch(actions.setAuth(authData)),
  };
};

// Repository-related hooks
export const useRepositories = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    repositories: state.repositories,
    selectedRepository: state.selectedRepository,
    setRepositories: (repos: Repository[]) => 
      dispatch(actions.setRepositories(repos)),
    selectRepository: (repo: Repository | null) => 
      dispatch(actions.selectRepository(repo)),
  };
};

// Pull Request-related hooks
export const usePullRequests = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    pullRequests: state.pullRequests,
    selectedPR: state.selectedPR,
    setPullRequests: (prs: PullRequest[]) => 
      dispatch(actions.setPullRequests(prs)),
    selectPullRequest: (pr: PullRequest | null) => 
      dispatch(actions.selectPullRequest(pr)),
  };
};

// Review Comment-related hooks
export const useReviewComments = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    comments: state.reviewComments,
    setComments: (comments: ReviewComment[]) => 
      dispatch(actions.setReviewComments(comments)),
    updateComment: (id: string, updates: Partial<ReviewComment>) => 
      dispatch(actions.updateComment(id, updates)),
    acceptComment: (id: string) => 
      dispatch(actions.acceptComment(id)),
    rejectComment: (id: string) => 
      dispatch(actions.rejectComment(id)),
    editComment: (id: string, content: string) => 
      dispatch(actions.editComment(id, content)),
    startEditing: (id: string) => 
      dispatch(actions.startEditingComment(id)),
    cancelEditing: (id: string, originalContent: string) => 
      dispatch(actions.cancelEditingComment(id, originalContent)),
    deleteComment: (id: string) => 
      dispatch(actions.deleteComment(id)),
    // Computed values
    pendingComments: state.reviewComments.filter(c => c.status === 'pending'),
    acceptedComments: state.reviewComments.filter(c => c.status === 'accepted'),
    rejectedComments: state.reviewComments.filter(c => c.status === 'rejected'),
  };
};

// Template-related hooks
export const useTemplates = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    templates: state.templates,
    setTemplates: (templates: ReviewTemplate[]) => 
      dispatch(actions.setTemplates(templates)),
  };
};

// UI-related hooks
export const useUI = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    ...state.ui,
    setLoading: (loading: boolean) => 
      dispatch(actions.setLoading(loading)),
    setError: (error: string | null) => 
      dispatch(actions.setError(error)),
    setCurrentView: (view: UIState['currentView']) => 
      dispatch(actions.setCurrentView(view)),
    setReviewRunning: (isRunning: boolean) => 
      dispatch(actions.setReviewRunning(isRunning)),
    clearError: () => dispatch(actions.setError(null)),
  };
};

// Combined hooks for common use cases
export const useCurrentSelection = () => {
  const { state } = useAppContext();
  
  return {
    repository: state.selectedRepository,
    pullRequest: state.selectedPR,
    hasSelection: !!(state.selectedRepository && state.selectedPR),
  };
};

export const useReviewState = () => {
  const { state } = useAppContext();
  
  return {
    isReviewRunning: state.ui.isReviewRunning,
    hasComments: state.reviewComments.length > 0,
    commentCount: state.reviewComments.length,
    pendingCount: state.reviewComments.filter(c => c.status === 'pending').length,
    acceptedCount: state.reviewComments.filter(c => c.status === 'accepted').length,
  };
};

// Global state management hooks
export const useGlobalActions = () => {
  const { dispatch } = useAppContext();
  
  return {
    resetState: () => dispatch(actions.resetState()),
    setLoading: (loading: boolean) => dispatch(actions.setLoading(loading)),
    setError: (error: string | null) => dispatch(actions.setError(error)),
  };
};