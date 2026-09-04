import { test, expect } from '@playwright/test';

test.describe('Kyreqo E2E Test Suite', () => {
  test('should render the main dashboard interface', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Kyreqo/i);
    await expect(page.locator('button', { hasText: /Send/i })).toBeVisible();
  });

  test('should allow changing HTTP request method', async ({ page }) => {
    await page.goto('/');
    const methodSelect = page.locator('select').first();
    await expect(methodSelect).toBeVisible();
    await methodSelect.selectOption('POST');
    await expect(methodSelect).toHaveValue('POST');
  });

  test('should allow entering API endpoint URL', async ({ page }) => {
    await page.goto('/');
    const urlInput = page.locator('input[type="text"]').first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1');
    await expect(urlInput).toHaveValue('https://jsonplaceholder.typicode.com/posts/1');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1', { hasText: /Welcome to Kyreqo/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should navigate to privacy policy page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toContainText(/Privacy Policy/i);
  });
});
