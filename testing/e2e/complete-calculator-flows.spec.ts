
import { test, expect } from '@playwright/test';

test.describe('Complete Calculator Creation and Usage Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('/api/auth/user', async route => {
      await route.fulfill({
        json: {
          id: 'test-user-e2e',
          email: 'e2e@test.com',
          firstName: 'E2E',
          lastName: 'Test',
          subscriptionStatus: 'pro'
        }
      });
    });

    await page.route('/api/calculators', async route => {
      await route.fulfill({ json: [] });
    });
  });

  test('Age Calculator - Complete Flow', async ({ page }) => {
    await page.goto('/builder');
    
    // Step 1: Create Age Calculator
    await page.fill('[data-testid="input-calculator-name"]', 'Age Calculator');
    await page.fill('[data-testid="textarea-calculator-description"]', 'Calculate your exact age in years, months, and days');
    await page.fill('[data-testid="textarea-formula"]', 'ageInYears(date(birthDate))');
    
    // Save the calculator
    await page.click('[data-testid="button-save"]');
    await expect(page.locator('text=Calculator saved')).toBeVisible();
    
    // Step 2: Preview and test the calculator
    await page.click('[data-testid="button-preview"]');
    await expect(page.locator('text=Age Calculator')).toBeVisible();
    
    // Step 3: Test calculation
    await page.fill('[data-testid="input-birthDate"]', '01/01/1990');
    await page.click('[data-testid="button-calculate"]');
    
    // Verify result shows an age
    await expect(page.locator('[data-testid="text-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-result"]')).toContainText(/\d+/);
  });

  test('BMI Calculator - Complete Flow', async ({ page }) => {
    await page.goto('/builder');
    
    // Create BMI Calculator
    await page.fill('[data-testid="input-calculator-name"]', 'BMI Calculator');
    await page.fill('[data-testid="textarea-calculator-description"]', 'Calculate your Body Mass Index');
    await page.fill('[data-testid="textarea-formula"]', 'weight / ((height / 100) * (height / 100))');
    
    await page.click('[data-testid="button-save"]');
    await page.click('[data-testid="button-preview"]');
    
    // Test BMI calculation
    await page.fill('[data-testid="input-weight"]', '70');
    await page.fill('[data-testid="input-height"]', '175');
    await page.click('[data-testid="button-calculate"]');
    
    // Should show BMI around 22.86
    await expect(page.locator('[data-testid="text-result"]')).toContainText(/22\.\d+/);
  });

  test('Premium Calculator - Payment Flow', async ({ page }) => {
    // Mock payment endpoints
    await page.route('/api/paypal/**', async route => {
      await route.fulfill({ json: { success: true, orderId: 'mock-order-id' } });
    });

    await page.goto('/builder');
    
    // Create Premium Calculator
    await page.fill('[data-testid="input-calculator-name"]', 'Premium Investment Calculator');
    await page.fill('[data-testid="textarea-formula"]', 'principal * Math.pow(1 + rate, years)');
    
    // Enable payment
    await page.click('[data-testid="switch-requires-payment"]');
    await page.fill('[data-testid="input-price"]', '9.99');
    
    await page.click('[data-testid="button-save"]');
    await page.click('[data-testid="button-preview"]');
    
    // Try to calculate - should show payment dialog
    await page.fill('[data-testid="input-principal"]', '10000');
    await page.fill('[data-testid="input-rate"]', '0.05');
    await page.fill('[data-testid="input-years"]', '10');
    await page.click('[data-testid="button-calculate"]');
    
    // Should show payment dialog
    await expect(page.locator('text=Premium Investment Calculator')).toBeVisible();
    await expect(page.locator('text=$9.99')).toBeVisible();
    
    // Process payment
    await page.click('[data-testid="button-pay-now"]');
    await expect(page.locator('text=Payment processed')).toBeVisible();
  });

  test('Calculator Validation and Error Handling', async ({ page }) => {
    await page.goto('/builder');
    
    // Try to save without required fields
    await page.click('[data-testid="button-save"]');
    await expect(page.locator('text=Name is required')).toBeVisible();
    
    // Fill in name and try invalid formula
    await page.fill('[data-testid="input-calculator-name"]', 'Test Calculator');
    await page.fill('[data-testid="textarea-formula"]', 'invalid formula syntax');
    
    await page.click('[data-testid="button-preview"]');
    
    // Should handle formula error gracefully
    await page.fill('[data-testid="input-field1"]', '100');
    await page.click('[data-testid="button-calculate"]');
    
    await expect(page.locator('[data-testid="text-result"]')).toContainText(/Error:/);
  });

  test('Multiple Calculator Types Flow', async ({ page }) => {
    const calculatorTypes = [
      {
        name: 'Simple Addition',
        formula: 'field1 + field2',
        inputs: { field1: '10', field2: '20' },
        expectedResult: '30'
      },
      {
        name: 'Percentage Calculator',
        formula: '(field1 / field2) * 100',
        inputs: { field1: '25', field2: '100' },
        expectedResult: '25'
      },
      {
        name: 'Circle Area',
        formula: 'Math.PI * radius * radius',
        inputs: { radius: '5' },
        expectedResult: /78\.\d+/
      }
    ];

    for (const calc of calculatorTypes) {
      await page.goto('/builder');
      
      await page.fill('[data-testid="input-calculator-name"]', calc.name);
      await page.fill('[data-testid="textarea-formula"]', calc.formula);
      
      await page.click('[data-testid="button-save"]');
      await page.click('[data-testid="button-preview"]');
      
      // Fill in test inputs
      for (const [field, value] of Object.entries(calc.inputs)) {
        await page.fill(`[data-testid="input-${field}"]`, value);
      }
      
      await page.click('[data-testid="button-calculate"]');
      
      if (typeof calc.expectedResult === 'string') {
        await expect(page.locator('[data-testid="text-result"]')).toContainText(calc.expectedResult);
      } else {
        await expect(page.locator('[data-testid="text-result"]')).toContainText(calc.expectedResult);
      }
    }
  });
});
