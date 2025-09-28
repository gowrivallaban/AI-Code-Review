
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PRList } from '../PRList';
import { AppProvider } from '../../context';
import type { Repository } from '../../types';

// Mock the GitHub service
vi.mock('../../services', () => ({
  githubService: {
    getPullRequests: vi.fn().mockResolvedValue([]),
  },
}));

const mockRepository: Repository = {
  id: 1,
  name: 'test-repo',
  full_name: 'testuser/test-repo',
  owner: {
    id: 1,
    login: 'testuser',
    avatar_url: 'https://github.com/testuser.png',
  },
  private: false,
  description: 'Test repository',
  html_url: 'https://github.com/testuser/test-repo',
  clone_url: 'https://github.com/testuser/test-repo.git',
  default_branch: 'main',
};

describe('PRList', () => {
  it('should render the component', () => {
    render(
      <AppProvider>
        <PRList repository={mockRepository} onPRSelect={vi.fn()} />
      </AppProvider>
    );

    expect(screen.getByText('Pull Requests')).toBeInTheDocument();
  });
});