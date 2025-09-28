// GitHub API Types
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  email?: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  description?: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  head: {
    sha: string;
    ref: string;
    repo: Repository;
  };
  base: {
    sha: string;
    ref: string;
    repo: Repository;
  };
  state: 'open' | 'closed' | 'merged';
  html_url: string;
  diff_url: string;
}

// Review System Types
export interface ReviewComment {
  id: string;
  file: string;
  line: number;
  content: string;
  severity: 'info' | 'warning' | 'error';
  status: 'pending' | 'accepted' | 'rejected';
  isEditing?: boolean;
  originalContent?: string;
  createdAt: string;
  category?: string;
}

export interface ReviewTemplate {
  name: string;
  description: string;
  content: string;
  prompts: {
    codeQuality: string;
    security: string;
    performance: string;
    maintainability: string;
    testing: string;
  };
  rules: {
    maxComplexity: number;
    requireTests: boolean;
    securityChecks: string[];
  };
  criteria: string[];
}

// Application State Types
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: GitHubUser | null;
}

export interface UIState {
  loading: boolean;
  error: string | null;
  currentView: 'repos' | 'prs' | 'review' | 'templates';
  isReviewRunning: boolean;
}

export interface AppState {
  auth: AuthState;
  repositories: Repository[];
  selectedRepository: Repository | null;
  pullRequests: PullRequest[];
  selectedPR: PullRequest | null;
  reviewComments: ReviewComment[];
  templates: ReviewTemplate[];
  ui: UIState;
}

// Error Types
export interface BaseError {
  message: string;
  code: string;
  timestamp: string;
}

export interface AuthError extends BaseError {
  type: 'auth';
  reason: 'invalid_token' | 'expired_token' | 'insufficient_permissions' | 'network_error';
}

export interface APIError extends BaseError {
  type: 'api';
  status?: number;
  reason: 'rate_limit' | 'not_found' | 'forbidden' | 'network_error' | 'server_error';
  retryAfter?: number;
}

export interface LLMError extends BaseError {
  type: 'llm';
  reason: 'api_failure' | 'quota_exceeded' | 'invalid_response' | 'timeout' | 'configuration_error';
}

export interface TemplateError extends BaseError {
  type: 'template';
  reason: 'invalid_markdown' | 'missing_file' | 'parsing_error' | 'validation_error';
  details?: string;
}

export type AppError = AuthError | APIError | LLMError | TemplateError;

// Service Interface Types
export interface GitHubServiceInterface {
  authenticate(token: string): Promise<void>;
  getRepositories(): Promise<Repository[]>;
  getPullRequests(repo: string): Promise<PullRequest[]>;
  getPullRequestDiff(repo: string, prNumber: number): Promise<string>;
  postReviewComments(repo: string, prNumber: number, comments: ReviewComment[]): Promise<void>;
}

export interface LLMServiceInterface {
  analyzeCode(diff: string, template: ReviewTemplate): Promise<ReviewComment[]>;
  configure(apiKey: string, model: string): void;
}

export interface TemplateServiceInterface {
  loadTemplate(name: string): Promise<ReviewTemplate>;
  saveTemplate(template: ReviewTemplate): Promise<void>;
  listTemplates(): Promise<string[]>;
  getDefaultTemplate(): ReviewTemplate;
}

// Action Types for State Management
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_VIEW'; payload: UIState['currentView'] }
  | { type: 'SET_REVIEW_RUNNING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: Partial<AuthState> }
  | { type: 'SET_REPOSITORIES'; payload: Repository[] }
  | { type: 'SELECT_REPOSITORY'; payload: Repository | null }
  | { type: 'SET_PULL_REQUESTS'; payload: PullRequest[] }
  | { type: 'SELECT_PULL_REQUEST'; payload: PullRequest | null }
  | { type: 'SET_REVIEW_COMMENTS'; payload: ReviewComment[] }
  | { type: 'UPDATE_COMMENT'; payload: { id: string; updates: Partial<ReviewComment> } }
  | { type: 'DELETE_COMMENT'; payload: string }
  | { type: 'SET_TEMPLATES'; payload: ReviewTemplate[] }
  | { type: 'RESET_STATE' };

// Component Props Types
export interface RepoSelectorProps {
  onRepoSelect: (repo: Repository) => void;
  loading: boolean;
}

export interface PRListProps {
  repository: Repository;
  onPRSelect: (pr: PullRequest) => void;
}

export interface CodeReviewInterfaceProps {
  pullRequest: PullRequest;
  repository: Repository;
}

export interface CommentSidebarProps {
  comments: ReviewComment[];
  onCommentAccept: (commentId: string) => void;
  onCommentEdit: (commentId: string, newContent: string) => void;
  onCommentDelete: (commentId: string) => void;
  onCommentClick: (commentId: string) => void;
}

export interface TemplateEditorProps {
  template: ReviewTemplate;
  onSave: (template: ReviewTemplate) => void;
  onCancel: () => void;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Configuration Types
export interface AppConfig {
  github: {
    apiUrl: string;
    scopes: string[];
  };
  llm: {
    provider: 'openai' | 'anthropic' | 'custom';
    model: string;
    maxTokens: number;
    temperature: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    pageSize: number;
  };
}
