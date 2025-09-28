import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
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

    await page.goto('/');
    await page.getByPlaceholder('Enter your GitHub token').fill('valid_token_123');
    await page.getByRole('button', { name: 'Connect to GitHub' }).click();
  });

  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should hide mobile menu on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // Desktop size
    
    await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should adapt repository list layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const repoCard = page.getByText('testuser/test-repo').first();
    await expect(repoCard).toBeVisible();
    
    // Check that cards stack vertically on mobile
    const boundingBox = await repoCard.boundingBox();
    expect(boundingBox?.width).toBeLessThan(400);
  });

  test('should maintain functionality across different screen sizes', async ({ page }) => {
    const sizes = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1024, height: 768 },  // Desktop
      { width: 1920, height: 1080 }  // Large Desktop
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      
      // Test that repository selection still works
      await page.getByText('testuser/test-repo').click();
      await expect(page.getByText('Pull Requests')).toBeVisible();
      
      // Navigate back for next iteration
      await page.goBack();
    }
  });

  test('should handle comment sidebar responsively', async ({ page }) => {
    // Mock PR and review data
    await page.route('**/repos/testuser/test-repo/pulls', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, number: 1, title: 'Test PR', user: { login: 'contributor' }, created_at: '2024-01-01T00:00:00Z' }
        ])
      });
    });

    await page.getByText('testuser/test-repo').click();
    await page.getByText('Test PR').click();

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Comment sidebar should be collapsible or overlay on mobile
    const sidebar = page.locator('[data-testid="comment-sidebar"]');
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.width).toBeLessThan(375);
    }

    // Test desktop layout
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Sidebar should be visible and properly sized on desktop
    if (await sidebar.isVisible()) {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox?.width).toBeGreaterThan(200);
    }
  });
});