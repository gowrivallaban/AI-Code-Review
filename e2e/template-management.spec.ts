import { test, expect } from '@playwright/test';

test.describe('Template Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ login: 'testuser', avatar_url: 'test.jpg' })
      });
    });

    await page.goto('/');
    await page.getByPlaceholder('Enter your GitHub token').fill('valid_token_123');
    await page.getByRole('button', { name: 'Connect to GitHub' }).click();
  });

  test('should navigate to template editor', async ({ page }) => {
    await page.getByRole('link', { name: 'Templates' }).click();
    
    await expect(page.getByText('Template Editor')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Template Content' })).toBeVisible();
  });

  test('should load and display default template', async ({ page }) => {
    await page.getByRole('link', { name: 'Templates' }).click();
    
    await expect(page.getByText('Code Quality')).toBeVisible();
    await expect(page.getByText('Security')).toBeVisible();
    await expect(page.getByText('Performance')).toBeVisible();
  });

  test('should save template changes', async ({ page }) => {
    await page.getByRole('link', { name: 'Templates' }).click();
    
    const templateEditor = page.getByRole('textbox', { name: 'Template Content' });
    await templateEditor.clear();
    await templateEditor.fill('# Custom Review Template\n\n## Code Quality\nCheck for clean code practices.');
    
    await page.getByRole('button', { name: 'Save Template' }).click();
    
    await expect(page.getByText('Template saved successfully')).toBeVisible();
  });

  test('should validate template syntax', async ({ page }) => {
    await page.getByRole('link', { name: 'Templates' }).click();
    
    const templateEditor = page.getByRole('textbox', { name: 'Template Content' });
    await templateEditor.clear();
    await templateEditor.fill('Invalid template content without proper structure');
    
    await page.getByRole('button', { name: 'Save Template' }).click();
    
    await expect(page.getByText('Template validation failed')).toBeVisible();
  });

  test('should preview template changes', async ({ page }) => {
    await page.getByRole('link', { name: 'Templates' }).click();
    
    const templateEditor = page.getByRole('textbox', { name: 'Template Content' });
    await templateEditor.fill('# Preview Test\n\n**Bold text** and *italic text*');
    
    await page.getByRole('button', { name: 'Preview' }).click();
    
    await expect(page.getByRole('heading', { name: 'Preview Test' })).toBeVisible();
    await expect(page.locator('strong')).toContainText('Bold text');
    await expect(page.locator('em')).toContainText('italic text');
  });
});