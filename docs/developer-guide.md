# Developer Guide

## Overview

This guide provides comprehensive information for developers who want to extend, modify, or contribute to the GitHub PR Review UI application. The application is built with React, TypeScript, and follows modern development practices.

## Architecture Overview

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React Context + useReducer for global state
- **HTTP Client**: Fetch API with custom service layer
- **Code Highlighting**: Prism.js for syntax highlighting
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier for code quality

### Project Structure

```
src/
├── components/          # React components
│   ├── __tests__/      # Component tests
│   └── index.ts        # Component exports
├── context/            # React Context and state management
│   ├── __tests__/      # Context tests
│   ├── AppContext.tsx  # Main application context
│   ├── actions.ts      # Action creators
│   └── appReducer.ts   # State reducer
├── hooks/              # Custom React hooks
│   ├── __tests__/      # Hook tests
│   └── useAppState.ts  # State management hooks
├── services/           # Business logic and API services
│   ├── __tests__/      # Service tests
│   ├── github.ts       # GitHub API integration
│   ├── llm.ts          # LLM service integration
│   ├── template.ts     # Template management
│   └── index.ts        # Service exports
├── types/              # TypeScript type definitions
│   └── index.ts        # All type exports
├── utils/              # Utility functions
│   ├── __tests__/      # Utility tests
│   └── index.ts        # Utility exports
└── main.tsx           # Application entry point
```

## Core Concepts

### State Management

The application uses React Context with useReducer for predictable state management:

```typescript
// State structure
interface AppState {
  auth: AuthState;           // Authentication state
  repositories: Repository[]; // Available repositories
  selectedRepository: Repository | null;
  pullRequests: PullRequest[];
  selectedPR: PullRequest | null;
  reviewComments: ReviewComment[];
  templates: ReviewTemplate[];
  ui: UIState;              // UI-specific state
}

// Actions follow Redux-style patterns
type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: Partial<AuthState> }
  | { type: 'SELECT_REPOSITORY'; payload: Repository | null }
  // ... more actions
```

### Service Layer

Services encapsulate business logic and external API interactions:

```typescript
// Service interface pattern
interface GitHubServiceInterface {
  authenticate(token: string): Promise<void>;
  getRepositories(): Promise<Repository[]>;
  getPullRequests(repo: string): Promise<PullRequest[]>;
  // ... more methods
}

// Implementation with error handling
class GitHubService implements GitHubServiceInterface {
  private baseURL = 'https://api.github.com';
  private token: string | null = null;
  
  async authenticate(token: string): Promise<void> {
    // Implementation with proper error handling
  }
}
```

### Component Architecture

Components follow a consistent pattern:

```typescript
// Props interface
interface ComponentProps {
  // Required props
  data: SomeData;
  onAction: (param: string) => void;
  
  // Optional props with defaults
  loading?: boolean;
  className?: string;
}

// Component with proper TypeScript
export function Component({ 
  data, 
  onAction, 
  loading = false, 
  className = '' 
}: ComponentProps) {
  // Hooks at the top
  const [localState, setLocalState] = useState();
  const { globalState } = useAppState();
  
  // Event handlers
  const handleClick = useCallback(() => {
    onAction('value');
  }, [onAction]);
  
  // Render
  return (
    <div className={`base-classes ${className}`}>
      {/* Component content */}
    </div>
  );
}
```

## Adding New Features

### 1. Adding a New Service

Create a new service for external integrations:

```typescript
// src/services/newService.ts
import type { NewServiceInterface, ServiceError } from '../types';

export class NewService implements NewServiceInterface {
  private config: ServiceConfig;
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }
  
  async performAction(params: ActionParams): Promise<ActionResult> {
    try {
      // Implementation
      const result = await this.makeRequest(params);
      return this.processResult(result);
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  private handleError(error: unknown): ServiceError {
    // Standardized error handling
    return {
      type: 'service',
      message: 'Action failed',
      code: 'SERVICE_ERROR',
      timestamp: new Date().toISOString(),
      reason: 'api_failure'
    };
  }
}

// Export singleton instance
export const newService = new NewService(defaultConfig);
```

### 2. Adding a New Component

Follow the established patterns:

```typescript
// src/components/NewComponent.tsx
import { useState, useCallback } from 'react';
import { useAppState } from '../hooks';
import { HelpIcon } from './Tooltip';
import type { NewComponentProps } from '../types';

export function NewComponent({ 
  data, 
  onAction, 
  className = '' 
}: NewComponentProps) {
  const [loading, setLoading] = useState(false);
  const { state, dispatch } = useAppState();
  
  const handleAction = useCallback(async () => {
    setLoading(true);
    try {
      await onAction(data.id);
      dispatch({ type: 'UPDATE_SUCCESS', payload: data.id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      setLoading(false);
    }
  }, [data.id, onAction, dispatch]);
  
  return (
    <div className={`new-component ${className}`}>
      <div className="flex items-center">
        <h3 className="text-lg font-medium">{data.title}</h3>
        <HelpIcon 
          content="Helpful explanation of this component"
          className="ml-2"
        />
      </div>
      
      <button
        onClick={handleAction}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Processing...' : 'Perform Action'}
      </button>
    </div>
  );
}
```

### 3. Adding New State

Extend the state management system:

```typescript
// src/types/index.ts - Add new state interface
interface NewFeatureState {
  items: NewItem[];
  selectedItem: NewItem | null;
  loading: boolean;
}

// Extend AppState
interface AppState {
  // ... existing state
  newFeature: NewFeatureState;
}

// src/context/actions.ts - Add new actions
export type AppAction = 
  | { type: 'SET_NEW_ITEMS'; payload: NewItem[] }
  | { type: 'SELECT_NEW_ITEM'; payload: NewItem | null }
  // ... existing actions

// src/context/appReducer.ts - Handle new actions
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_NEW_ITEMS':
      return {
        ...state,
        newFeature: {
          ...state.newFeature,
          items: action.payload,
          loading: false
        }
      };
    // ... other cases
  }
}
```

## Testing Guidelines

### Unit Testing Components

```typescript
// src/components/__tests__/NewComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { NewComponent } from '../NewComponent';
import { AppProvider } from '../../context/AppContext';

const mockOnAction = vi.fn();

const renderComponent = (props = {}) => {
  const defaultProps = {
    data: { id: '1', title: 'Test Item' },
    onAction: mockOnAction,
    ...props
  };
  
  return render(
    <AppProvider>
      <NewComponent {...defaultProps} />
    </AppProvider>
  );
};

describe('NewComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders component with data', () => {
    renderComponent();
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });
  
  it('calls onAction when button clicked', async () => {
    renderComponent();
    
    fireEvent.click(screen.getByText('Perform Action'));
    
    await waitFor(() => {
      expect(mockOnAction).toHaveBeenCalledWith('1');
    });
  });
  
  it('shows loading state during action', async () => {
    mockOnAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    renderComponent();
    fireEvent.click(screen.getByText('Perform Action'));
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});
```

### Testing Services

```typescript
// src/services/__tests__/newService.test.ts
import { vi } from 'vitest';
import { NewService } from '../newService';

// Mock external dependencies
vi.mock('../httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('NewService', () => {
  let service: NewService;
  
  beforeEach(() => {
    service = new NewService(testConfig);
    vi.clearAllMocks();
  });
  
  it('performs action successfully', async () => {
    const mockResponse = { data: 'success' };
    vi.mocked(httpClient.post).mockResolvedValue(mockResponse);
    
    const result = await service.performAction({ param: 'value' });
    
    expect(result).toEqual(expectedResult);
    expect(httpClient.post).toHaveBeenCalledWith('/endpoint', { param: 'value' });
  });
  
  it('handles errors properly', async () => {
    vi.mocked(httpClient.post).mockRejectedValue(new Error('Network error'));
    
    await expect(service.performAction({ param: 'value' }))
      .rejects.toThrow('Action failed');
  });
});
```

### Integration Testing

```typescript
// e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.goto('/');
    await page.fill('[data-testid="github-token"]', 'test-token');
    await page.click('[data-testid="connect-button"]');
  });
  
  test('user can use new feature', async ({ page }) => {
    // Navigate to new feature
    await page.click('[data-testid="new-feature-nav"]');
    
    // Interact with feature
    await page.click('[data-testid="new-action-button"]');
    
    // Verify results
    await expect(page.locator('[data-testid="success-message"]'))
      .toBeVisible();
  });
});
```

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization

```typescript
// Memoize expensive computations
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Memoize callbacks
const ParentComponent = () => {
  const handleClick = useCallback((id: string) => {
    // Handle click
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
};
```

### Virtual Scrolling

```typescript
// Use virtual scrolling for large lists
import { VirtualScrollList } from '../components';

function LargeList({ items }: { items: Item[] }) {
  return (
    <VirtualScrollList
      items={items}
      itemHeight={60}
      renderItem={({ item, index }) => (
        <ItemComponent key={item.id} item={item} />
      )}
    />
  );
}
```

## Error Handling

### Service Layer Errors

```typescript
// Standardized error handling
class ServiceBase {
  protected handleError(error: unknown, context: string): ServiceError {
    if (error instanceof Response) {
      return this.handleHttpError(error, context);
    }
    
    if (error instanceof Error) {
      return this.handleGenericError(error, context);
    }
    
    return {
      type: 'service',
      message: `Unknown error in ${context}`,
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      reason: 'unknown'
    };
  }
  
  private handleHttpError(response: Response, context: string): ServiceError {
    const statusCode = response.status;
    
    switch (statusCode) {
      case 401:
        return {
          type: 'auth',
          message: 'Authentication failed',
          code: 'AUTH_FAILED',
          timestamp: new Date().toISOString(),
          reason: 'invalid_token'
        };
      case 403:
        return {
          type: 'auth',
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString(),
          reason: 'insufficient_permissions'
        };
      case 429:
        return {
          type: 'api',
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT',
          timestamp: new Date().toISOString(),
          reason: 'rate_limit',
          retryAfter: this.getRetryAfter(response)
        };
      default:
        return {
          type: 'api',
          message: `HTTP ${statusCode} error in ${context}`,
          code: 'HTTP_ERROR',
          timestamp: new Date().toISOString(),
          reason: 'server_error',
          status: statusCode
        };
    }
  }
}
```

### Component Error Boundaries

```typescript
// Error boundary for component trees
class FeatureErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Feature error:', error, errorInfo);
    // Report to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Styling Guidelines

### Tailwind CSS Patterns

```typescript
// Consistent component styling
const buttonStyles = {
  base: 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
};

// Responsive design patterns
const containerStyles = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
const gridStyles = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
```

### Custom CSS Classes

```css
/* src/components/Component.css */
.component-specific-styles {
  /* Use CSS modules or styled-components for component-specific styles */
  @apply bg-white rounded-lg shadow-md p-6;
}

/* Responsive utilities */
@media (max-width: 768px) {
  .mobile-hidden {
    display: none;
  }
}
```

## API Integration

### Adding New API Endpoints

```typescript
// src/services/api/endpoints.ts
export const API_ENDPOINTS = {
  github: {
    user: '/user',
    repos: '/user/repos',
    pulls: (repo: string) => `/repos/${repo}/pulls`,
    diff: (repo: string, number: number) => `/repos/${repo}/pulls/${number}.diff`
  },
  llm: {
    analyze: '/analyze',
    models: '/models'
  }
} as const;

// Type-safe endpoint usage
type GitHubEndpoint = keyof typeof API_ENDPOINTS.github;
```

### Request/Response Handling

```typescript
// src/services/httpClient.ts
class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(baseURL: string, defaultHeaders = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
  }
  
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...options.headers
      }
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new HttpError(response);
    }
    
    return response.json();
  }
  
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }
  
  post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers
    });
  }
}
```

## Deployment

### Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'react-markdown']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

### Environment Configuration

```typescript
// src/config/environment.ts
interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  GITHUB_API_URL: string;
  LLM_API_URL: string;
  APP_VERSION: string;
}

export const env: Environment = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  GITHUB_API_URL: import.meta.env.VITE_GITHUB_API_URL || 'https://api.github.com',
  LLM_API_URL: import.meta.env.VITE_LLM_API_URL || 'http://localhost:8000',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0'
};
```

## Contributing Guidelines

### Code Style

1. **Use TypeScript** for all new code
2. **Follow ESLint rules** - run `npm run lint` before committing
3. **Use Prettier** for consistent formatting
4. **Write meaningful commit messages** following conventional commits
5. **Add tests** for new features and bug fixes

### Pull Request Process

1. **Create feature branch** from `main`
2. **Implement changes** with tests
3. **Update documentation** if needed
4. **Run full test suite** - `npm run test`
5. **Create pull request** with clear description
6. **Address review feedback** promptly

### Code Review Checklist

- [ ] Code follows TypeScript best practices
- [ ] Components are properly typed
- [ ] Error handling is implemented
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] Performance impact is considered
- [ ] Accessibility guidelines are followed
- [ ] Security implications are reviewed

## Troubleshooting

### Common Development Issues

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run type-check
```

#### Build Issues
```bash
# Clear build cache
rm -rf dist node_modules/.vite
npm install
npm run build
```

#### Test Failures
```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- NewComponent.test.tsx
```

### Debugging Tips

1. **Use React DevTools** for component debugging
2. **Enable source maps** in development
3. **Use browser debugger** with breakpoints
4. **Check network tab** for API issues
5. **Monitor console** for errors and warnings

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

### Tools
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)
- [VS Code Extensions](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

### Community
- [React Community](https://reactjs.org/community/support.html)
- [TypeScript Community](https://www.typescriptlang.org/community/)
- [GitHub Discussions](https://github.com/discussions)

This guide should help you get started with extending the application. For specific questions or issues, please refer to the existing codebase patterns and don't hesitate to ask for help!