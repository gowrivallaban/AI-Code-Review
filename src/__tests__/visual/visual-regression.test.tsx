import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { GitHubAuth } from '../../components/GitHubAuth';
import { RepositorySelector } from '../../components/RepositorySelector';
import { PRList } from '../../components/PRList';
import { CommentSidebar } from '../../components/CommentSidebar';
import { TemplateEditor } from '../../components/TemplateEditor';

// Mock data for consistent visual tests
const mockRepositories = [
  {
    id: 1,
    name: 'test-repo-1',
    full_name: 'testuser/test-repo-1',
    owner: { login: 'testuser', avatar_url: 'https://github.com/images/error/testuser_happy.gif' },
    private: false
  },
  {
    id: 2,
    name: 'private-repo',
    full_name: 'testuser/private-repo',
    owner: { login: 'testuser', avatar_url: 'https://github.com/images/error/testuser_happy.gif' },
    private: true
  }
];

const mockPullRequests = [
  {
    id: 1,
    number: 1,
    title: 'Add new feature for user authentication',
    user: { login: 'contributor1', avatar_url: 'https://github.com/images/error/contributor1_happy.gif' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    head: { sha: 'abc123', ref: 'feature/auth' },
    base: { sha: 'def456', ref: 'main' }
  },
  {
    id: 2,
    number: 2,
    title: 'Fix critical security vulnerability in login system',
    user: { login: 'contributor2', avatar_url: 'https://github.com/images/error/contributor2_happy.gif' },
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T12:00:00Z',
    head: { sha: 'ghi789', ref: 'hotfix/security' },
    base: { sha: 'def456', ref: 'main' }
  }
];

const mockComments = [
  {
    id: '1',
    file: 'src/auth/login.js',
    line: 15,
    content: 'Consider using bcrypt for password hashing instead of plain text storage. This is a critical security vulnerability.',
    severity: 'error' as const,
    status: 'pending' as const
  },
  {
    id: '2',
    file: 'src/utils/validation.js',
    line: 8,
    content: 'The email validation regex could be improved to handle edge cases better.',
    severity: 'warning' as const,
    status: 'accepted' as const
  },
  {
    id: '3',
    file: 'src/components/LoginForm.jsx',
    line: 42,
    content: 'Consider adding loading state to improve user experience during authentication.',
    severity: 'info' as const,
    status: 'pending' as const
  }
];

describe('Visual Regression Tests', () => {
  // Mock window.matchMedia for responsive tests
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Authentication Components', () => {
    it('should render GitHub authentication form consistently', () => {
      const { container } = render(
        <AppProvider>
          <GitHubAuth />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('github-auth-form');
    });

    it('should render authentication form with error state', () => {
      const { container } = render(
        <AppProvider>
          <GitHubAuth />
        </AppProvider>
      );

      // Simulate error state by triggering invalid token
      const tokenInput = container.querySelector('input[type="password"]');
      if (tokenInput) {
        tokenInput.setAttribute('aria-invalid', 'true');
      }

      expect(container.firstChild).toMatchSnapshot('github-auth-form-error');
    });
  });

  describe('Repository Selection', () => {
    it('should render repository list consistently', () => {
      const { container } = render(
        <AppProvider>
          <RepositorySelector 
            repositories={mockRepositories}
            onRepoSelect={vi.fn()}
            loading={false}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('repository-selector');
    });

    it('should render repository list loading state', () => {
      const { container } = render(
        <AppProvider>
          <RepositorySelector 
            repositories={[]}
            onRepoSelect={vi.fn()}
            loading={true}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('repository-selector-loading');
    });

    it('should render empty repository state', () => {
      const { container } = render(
        <AppProvider>
          <RepositorySelector 
            repositories={[]}
            onRepoSelect={vi.fn()}
            loading={false}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('repository-selector-empty');
    });
  });

  describe('Pull Request List', () => {
    it('should render PR list consistently', () => {
      const { container } = render(
        <AppProvider>
          <PRList 
            pullRequests={mockPullRequests}
            onPRSelect={vi.fn()}
            loading={false}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('pr-list');
    });

    it('should render PR list loading state', () => {
      const { container } = render(
        <AppProvider>
          <PRList 
            pullRequests={[]}
            onPRSelect={vi.fn()}
            loading={true}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('pr-list-loading');
    });

    it('should render empty PR list', () => {
      const { container } = render(
        <AppProvider>
          <PRList 
            pullRequests={[]}
            onPRSelect={vi.fn()}
            loading={false}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('pr-list-empty');
    });
  });

  describe('Comment Sidebar', () => {
    it('should render comment sidebar with multiple comment types', () => {
      const { container } = render(
        <AppProvider>
          <CommentSidebar 
            comments={mockComments}
            onCommentAccept={vi.fn()}
            onCommentEdit={vi.fn()}
            onCommentDelete={vi.fn()}
            onCommentClick={vi.fn()}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('comment-sidebar');
    });

    it('should render comment sidebar with editing state', () => {
      const editingComments = mockComments.map((comment, index) => ({
        ...comment,
        isEditing: index === 0
      }));

      const { container } = render(
        <AppProvider>
          <CommentSidebar 
            comments={editingComments}
            onCommentAccept={vi.fn()}
            onCommentEdit={vi.fn()}
            onCommentDelete={vi.fn()}
            onCommentClick={vi.fn()}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('comment-sidebar-editing');
    });

    it('should render empty comment sidebar', () => {
      const { container } = render(
        <AppProvider>
          <CommentSidebar 
            comments={[]}
            onCommentAccept={vi.fn()}
            onCommentEdit={vi.fn()}
            onCommentDelete={vi.fn()}
            onCommentClick={vi.fn()}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('comment-sidebar-empty');
    });
  });

  describe('Template Editor', () => {
    it('should render template editor consistently', () => {
      const { container } = render(
        <AppProvider>
          <TemplateEditor />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('template-editor');
    });
  });

  describe('Responsive Layouts', () => {
    it('should render mobile layout correctly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(
        <AppProvider>
          <RepositorySelector 
            repositories={mockRepositories}
            onRepoSelect={vi.fn()}
            loading={false}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('repository-selector-mobile');
    });

    it('should render tablet layout correctly', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 1024px') && !query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(
        <AppProvider>
          <CommentSidebar 
            comments={mockComments}
            onCommentAccept={vi.fn()}
            onCommentEdit={vi.fn()}
            onCommentDelete={vi.fn()}
            onCommentClick={vi.fn()}
          />
        </AppProvider>
      );

      expect(container.firstChild).toMatchSnapshot('comment-sidebar-tablet');
    });
  });

  describe('Dark Mode Support', () => {
    it('should render components in dark mode', () => {
      // Mock dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-color-scheme: dark'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(
        <div className="dark">
          <AppProvider>
            <GitHubAuth />
          </AppProvider>
        </div>
      );

      expect(container.firstChild).toMatchSnapshot('github-auth-dark-mode');
    });
  });
});