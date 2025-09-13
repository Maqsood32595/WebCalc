import { vi } from 'vitest';
import type { InsertCalculator, CalculatorField } from '@shared/schema';

// Mock Gemini API responses for testing
export const mockGeminiResponses = {
  bmiCalculatorResponse: {
    response: `Great! A BMI (Body Mass Index) calculator is a useful health tool. I'll help you create one that calculates BMI using weight and height inputs.

BMI is calculated using the formula: BMI = weight (kg) / (height (m))²

I've prepared a BMI calculator specification for you with the necessary input fields and formula.`,
    calculatorData: {
      name: "BMI Calculator",
      description: "Calculate your Body Mass Index to assess if you're in a healthy weight range",
      template: "health",
      fields: [
        {
          id: "weight",
          type: "number" as const,
          label: "Weight (kg)",
          required: true,
          placeholder: "Enter your weight in kilograms",
          position: { x: 0, y: 0 }
        },
        {
          id: "height", 
          type: "number" as const,
          label: "Height (cm)",
          required: true,
          placeholder: "Enter your height in centimeters",
          position: { x: 0, y: 80 }
        },
        {
          id: "result",
          type: "result" as const,
          label: "BMI Result",
          required: false,
          position: { x: 0, y: 160 }
        }
      ],
      formula: "weight / ((height / 100) * (height / 100))"
    }
  },

  mortgageCalculatorResponse: {
    response: `Perfect! I'll create a mortgage calculator that helps users determine their monthly mortgage payments based on loan amount, interest rate, and loan term.

This calculator will use the standard mortgage payment formula to provide accurate monthly payment calculations.`,
    calculatorData: {
      name: "Mortgage Payment Calculator", 
      description: "Calculate monthly mortgage payments based on loan details",
      template: "financial",
      fields: [
        {
          id: "principal",
          type: "number" as const,
          label: "Loan Amount ($)",
          required: true,
          placeholder: "Enter the loan amount",
          position: { x: 0, y: 0 }
        },
        {
          id: "rate",
          type: "number" as const,
          label: "Annual Interest Rate (%)",
          required: true,
          placeholder: "Enter annual interest rate",
          position: { x: 0, y: 80 }
        },
        {
          id: "term",
          type: "number" as const,
          label: "Loan Term (years)",
          required: true,
          placeholder: "Enter loan term in years",
          position: { x: 0, y: 160 }
        },
        {
          id: "result",
          type: "result" as const,
          label: "Monthly Payment ($)",
          required: false,
          position: { x: 0, y: 240 }
        }
      ],
      formula: "(principal * (rate/100/12) * Math.pow(1 + rate/100/12, term*12)) / (Math.pow(1 + rate/100/12, term*12) - 1)"
    }
  },

  conversationalOnlyResponse: {
    response: `I'd be happy to help you create a calculator! What specific type of calculator are you looking for? 

Some popular options include:
- Financial calculators (mortgage, loan, investment)
- Health calculators (BMI, calorie, fitness)
- Math calculators (percentage, area, volume)  
- Conversion calculators (units, currency, measurements)

Let me know what you need and I'll create a custom calculator for you!`,
    calculatorData: undefined
  }
};

// Mock user data for testing
export const mockTestUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profileImageUrl: null,
  subscriptionStatus: 'free',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Validation helpers
export function validateCalculatorData(data: Partial<InsertCalculator>): boolean {
  if (!data.name || typeof data.name !== 'string') return false;
  if (!data.fields || !Array.isArray(data.fields)) return false;
  if (data.fields.length === 0) return false;
  
  // Validate each field
  for (const field of data.fields) {
    if (!field.id || typeof field.id !== 'string') return false;
    if (!field.type || !['text', 'number', 'select', 'checkbox', 'result'].includes(field.type)) return false;
    if (!field.label || typeof field.label !== 'string') return false;
    if (!field.position || typeof field.position.x !== 'number' || typeof field.position.y !== 'number') return false;
  }

  return true;
}

// Mock API request helper
export function createMockApiRequest() {
  return vi.fn().mockImplementation((method: string, url: string, data?: any) => {
    if (method === 'POST' && url === '/api/calculators') {
      return Promise.resolve({
        id: 'mock-calc-' + Date.now(),
        ...data,
        userId: mockTestUser.id,
        isPublished: false,
        views: 0,
        conversions: 0,
        revenue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (method === 'GET' && url === '/api/calculators') {
      return Promise.resolve([]);
    }

    if (method === 'POST' && url === '/api/gemini/chat') {
      if (data.message?.toLowerCase().includes('bmi')) {
        return Promise.resolve(mockGeminiResponses.bmiCalculatorResponse);
      }
      if (data.message?.toLowerCase().includes('mortgage')) {
        return Promise.resolve(mockGeminiResponses.mortgageCalculatorResponse);
      }
      return Promise.resolve(mockGeminiResponses.conversationalOnlyResponse);
    }

    return Promise.resolve({});
  });
}

// Test data generators
export function generateTestCalculatorField(overrides: Partial<CalculatorField> = {}): CalculatorField {
  return {
    id: `field_${Date.now()}`,
    type: 'number',
    label: 'Test Field',
    required: true,
    placeholder: 'Enter a value',
    position: { x: 0, y: 0 },
    ...overrides
  };
}

export function generateTestCalculator(overrides: Partial<InsertCalculator> = {}): InsertCalculator {
  return {
    name: 'Test Calculator',
    description: 'A test calculator for validation',
    template: 'custom',
    fields: [
      generateTestCalculatorField({ id: 'input1', label: 'Input 1' }),
      generateTestCalculatorField({ id: 'input2', label: 'Input 2', position: { x: 0, y: 80 } }),
      generateTestCalculatorField({ id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 160 } })
    ],
    formula: 'input1 + input2',
    isPublished: false,
    requiresPayment: false,
    ...overrides
  };
}

// Performance testing helpers
export async function measureApiResponseTime(apiCall: () => Promise<any>): Promise<{ result: any; duration: number }> {
  const start = Date.now();
  const result = await apiCall();
  const duration = Date.now() - start;
  return { result, duration };
}

// Error simulation helpers
export const errorScenarios = {
  networkError: () => Promise.reject(new Error('Network request failed')),
  timeoutError: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 100)),
  authError: () => Promise.reject({ status: 401, message: 'Unauthorized' }),
  validationError: () => Promise.reject({ status: 400, message: 'Invalid data', errors: [] })
};

// Calculator specifications for testing (to fix circular imports)
export const mockCalculatorSpecs = {
  bmiCalculator: mockGeminiResponses.bmiCalculatorResponse.calculatorData!,
  mortgageCalculator: mockGeminiResponses.mortgageCalculatorResponse.calculatorData!
};

// Environment helpers
export function setupTestEnvironment() {
  // Mock environment variables for testing
  process.env.GEMINI_API_KEY = 'test-api-key';
  process.env.DATABASE_URL = 'test-database-url';
  process.env.NODE_ENV = 'test';
}

export function cleanupTestEnvironment() {
  // Clean up any test data or mocks
  vi.clearAllMocks();
  vi.resetAllMocks();
}