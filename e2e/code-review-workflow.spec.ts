import { test, expect } from '@playwright/test';

test.describe('Code Review Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication and navigation to review interface
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

    await page.goto('/');
    await page.getByPlaceholder('Enter your GitHub token').fill('valid_token_123');
    await page.getByRole('button', { name: 'Connect to GitHub' }).click();
    await page.getByText('testuser/test-repo').click();
  });

  test('should display run code review button for selected PR', async ({ page }) => {
    await page.getByText('Test PR').click();
    
    await expect(page.getByRole('button', { name: 'Run Code Review' })).toBeVisible();
    await expect(page.getByText('Code Review Interface')).toBeVisible();
  });

  test('should execute code review and display comments', async ({ page }) => {
    // Mock PR diff API
    await page.route('**/repos/testuser/test-repo/pulls/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.github.v3.diff',
        body: `diff --git a/src/example.js b/src/example.js
index 1234567..abcdefg 100644
--- a/src/example.js
+++ b/src/example.js
@@ -1,3 +1,5 @@
 function example() {
+  // TODO: Add error handling
   console.log('Hello World');
 }`
      });
    });

    // Mock LLM API response
    await page.route('**/chat/completions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  file: 'src/example.js',
                  line: 2,
                  content: 'Consider adding proper error handling instead of a TODO comment.',
                  severity: 'warning'
                }
              ])
            }
          }]
        })
      });
    });

    await page.getByText('Test PR').click();
    await page.getByRole('button', { name: 'Run Code Review' }).click();
    
    // Wait for review to complete
    await expect(page.getByText('Review completed')).toBeVisible();
    await expect(page.getByText('Consider adding proper error handling')).toBeVisible();
  });

  test('should allow comment editing and curation', async ({ page }) => {
    // Setup review with comments
    await page.route('**/repos/testuser/test-repo/pulls/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.github.v3.diff',
        body: 'diff --git a/src/example.js b/src/example.js\n+console.log("test");'
      });
    });

    await page.route('**/chat/completions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  file: 'src/example.js',
                  line: 1,
                  content: 'Consider using a proper logging library.',
                  severity: 'info'
                }
              ])
            }
          }]
        })
      });
    });

    await page.getByText('Test PR').click();
    await page.getByRole('button', { name: 'Run Code Review' }).click();
    
    // Wait for comments to appear
    await expect(page.getByText('Consider using a proper logging library')).toBeVisible();
    
    // Test comment actions
    await expect(page.getByRole('button', { name: 'Accept' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    
    // Test edit functionality
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('textbox')).toBeVisible();
    
    await page.getByRole('textbox').fill('Updated comment: Use a logging library like winston.');
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Updated comment: Use a logging library like winston.')).toBeVisible();
  });

  test('should export review comments', async ({ page }) => {
    // Setup review with accepted comments
    await page.route('**/repos/testuser/test-repo/pulls/1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.github.v3.diff',
        body: 'diff --git a/src/example.js b/src/example.js\n+console.log("test");'
      });
    });

    await page.route('**/chat/completions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify([
                {
                  file: 'src/example.js',
                  line: 1,
                  content: 'Consider using a proper logging library.',
                  severity: 'info'
                }
              ])
            }
          }]
        })
      });
    });

    await page.getByText('Test PR').click();
    await page.getByRole('button', { name: 'Run Code Review' }).click();
    
    // Accept comment
    await page.getByRole('button', { name: 'Accept' }).click();
    
    // Test export functionality
    await expect(page.getByRole('button', { name: 'Export Review' })).toBeVisible();
    
    // Mock download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Review' }).click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('review');
  });
});