import { test, expect } from '@playwright/test';

test.describe('Authentication and Repository Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display GitHub authentication form on initial load', async ({ page }) => {
    await expect(page.getByText('GitHub Authentication')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your GitHub token')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect to GitHub' })).toBeVisible();
  });

  test('should show error for invalid GitHub token', async ({ page }) => {
    await page.getByPlaceholder('Enter your GitHub token').fill('invalid_token');
    await page.getByRole('button', { name: 'Connect to GitHub' }).click();
    
    await expect(page.getByText('Authentication failed')).toBeVisible();
  });

  test('should proceed to repository selection with valid token', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'testuser',
          avatar_url: 'https://github.com/images/error/testuser_happy.gif'
        })
      });
    });

    await page.route('**/user/repos', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'test-repo',
            full_name: 'testuser/test-repo',
            owner: { login: 'testuser', avatar_url: 'https://github.com/images/error/testuser_happy.gif' },
            private: false
          }
        ])
      });
    });

    await page.getByPlaceholder('Enter your GitHub token').fill('valid_token_123');
    await page.getByRole('button', { name: 'Connect to GitHub' }).click();
    
    await expect(page.getByText('Select Repository')).toBeVisible();
    await expect(page.getByText('testuser/test-repo')).toBeVisible();
  });

  test('should navigate to PR list when repository is selected', async ({ page }) => {
    // Mock authentication and repository selection
    await page.route('**/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ login: 'testuser', avatar_url: 'test.jpg' })
      });
    });

    await page.route('**/user/repos', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'test-repo', full_name: 'testuser/test-repo', owner: { login: 'testuser' }, private: false }
        ])
      });
    });

    await page.route('**/repos/testuser/test-repo/pulls', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            number: 1,
            title: 'Test PR',
            user: { login: 'contributor', avatar_url: 'test.jpg' },
            created_at: '2024-01-01T00:00:00Z',
            head: { sha: 'abc123', ref: 'feature' },
            base: { sha: 'def456', ref: 'main' }
          }
        ])
      });
    });

    await page.getByPlaceholder('Enter your GitHub token').fill('valid_token_123');
    await page.getByRole('button', { name: 'Connect to GitHub' }).click();
    
    await page.getByText('testuser/test-repo').click();
    
    await expect(page.getByText('Pull Requests')).toBeVisible();
    await expect(page.getByText('Test PR')).toBeVisible();
  });
});