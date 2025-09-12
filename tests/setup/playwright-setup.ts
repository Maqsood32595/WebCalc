import { test as base, expect } from '@playwright/test';

// Extend basic test by providing authentication context
export const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ page }, use) => {
    // Mock authentication by setting localStorage or cookies
    await page.goto('/');
    
    // Set authenticated user data in localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({
        id: 'test-user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        subscriptionStatus: 'free',
      }));
    });

    await use(page);
  },
});

export { expect };