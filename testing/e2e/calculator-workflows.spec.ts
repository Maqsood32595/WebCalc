
import { test, expect } from '@playwright/test';

test.describe('Calculator Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 'test-user', subscriptionStatus: 'free' },
        isAuthenticated: true
      }));
    });
  });

  test('complete age calculator creation workflow', async ({ page }) => {
    await page.goto('/builder');
    
    // Step 1: Set basic information
    await page.fill('[data-testid="input-calculator-name"]', 'E2E Age Calculator');
    await page.fill('[data-testid="textarea-calculator-description"]', 'Calculate your exact age');
    
    // Step 2: Set formula
    await page.fill('[data-testid="textarea-formula"]', 'ageInYears(date(birthDate))');
    
    // Step 3: Save calculator
    await page.click('[data-testid="button-save"]');
    await expect(page.locator('text=Calculator saved')).toBeVisible();
    
    // Step 4: Preview calculator
    await page.click('[data-testid="button-preview"]');
    await expect(page.locator('[data-testid="button-back-to-editor"]')).toBeVisible();
    
    // Step 5: Test calculator functionality
    await page.fill('[data-testid="input-birthDate"]', '01/01/1990');
    await page.click('[data-testid="button-calculate"]');
    
    // Verify result
    await expect(page.locator('[data-testid="text-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-result"]')).toContainText(/\d+/);
  });

  test('premium calculator payment workflow', async ({ page }) => {
    await page.goto('/builder');
    
    // Create premium calculator
    await page.fill('[data-testid="input-calculator-name"]', 'Premium Calculator');
    await page.click('[data-testid="switch-requires-payment"]');
    await page.fill('[data-testid="input-price"]', '5.00');
    
    // Save and preview
    await page.click('[data-testid="button-save"]');
    await page.click('[data-testid="button-preview"]');
    
    // Try to calculate - should show payment dialog
    await page.fill('[data-testid="input-birthDate"]', '01/01/1990');
    await page.click('[data-testid="button-calculate"]');
    
    // Verify payment dialog
    await expect(page.locator('text=Premium Calculator')).toBeVisible();
    await expect(page.locator('text=$5.00')).toBeVisible();
    
    // Process payment
    await page.click('[data-testid="button-pay-now"]');
    await expect(page.locator('text=Payment processed')).toBeVisible();
  });

  test('calculator publishing workflow', async ({ page }) => {
    await page.goto('/builder');
    
    // Create calculator
    await page.fill('[data-testid="input-calculator-name"]', 'Published Calculator');
    await page.fill('[data-testid="textarea-description"]', 'A published calculator');
    
    // Save first
    await page.click('[data-testid="button-save"]');
    await expect(page.locator('text=Calculator saved')).toBeVisible();
    
    // Publish
    await page.click('[data-testid="button-publish"]');
    await expect(page.locator('text=Published')).toBeVisible();
    
    // Verify calculator appears in dashboard
    await page.goto('/dashboard');
    await expect(page.locator('text=Published Calculator')).toBeVisible();
    await expect(page.locator('text=Published')).toBeVisible();
  });
});
