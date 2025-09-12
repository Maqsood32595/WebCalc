
import { test, expect } from '@tests/setup/playwright-setup';

test.describe('Calculator E2E Tests', () => {
  test('creates and uses age calculator', async ({ authenticatedPage: page }) => {
    // Navigate to builder
    await page.goto('/builder');
    
    // Create a new calculator
    await page.fill('[data-testid="input-calculator-name"]', 'E2E Age Calculator');
    await page.fill('[data-testid="textarea-calculator-description"]', 'Calculate your age');
    await page.fill('[data-testid="textarea-formula"]', 'ageInYears(date(field1))');
    
    // Save the calculator
    await page.click('[data-testid="button-save"]');
    await expect(page.locator('text=Calculator saved')).toBeVisible();
    
    // Preview the calculator
    await page.click('[data-testid="button-preview"]');
    
    // Use the calculator
    await page.fill('[data-testid="input-field1"]', '01/01/1990');
    await page.click('[data-testid="button-calculate"]');
    
    // Verify result is displayed
    await expect(page.locator('[data-testid="text-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-result"]')).toContainText(/\d+/);
  });

  test('handles premium calculator payment flow', async ({ authenticatedPage: page }) => {
    await page.goto('/builder');
    
    // Create premium calculator
    await page.fill('[data-testid="input-calculator-name"]', 'Premium Calculator');
    await page.click('[data-testid="switch-requires-payment"]');
    await page.fill('[data-testid="input-price"]', '5.00');
    
    await page.click('[data-testid="button-save"]');
    await page.click('[data-testid="button-preview"]');
    
    // Try to calculate - should show payment dialog
    await page.fill('[data-testid="input-field1"]', '01/01/1990');
    await page.click('[data-testid="button-calculate"]');
    
    await expect(page.locator('text=Premium Calculator')).toBeVisible();
    await expect(page.locator('text=$5.00')).toBeVisible();
    
    // Process payment
    await page.click('[data-testid="button-pay-now"]');
    await expect(page.locator('text=Payment processed')).toBeVisible();
  });
});
