import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock the Gemini module FIRST to prevent live API calls
vi.mock('../server/gemini', () => ({
  generateCalculatorFromPrompt: vi.fn().mockImplementation(async (message: string) => {
    const { mockGeminiResponses } = await import('./test-utils');
    if (message.toLowerCase().includes('bmi')) {
      return mockGeminiResponses.bmiCalculatorResponse;
    }
    if (message.toLowerCase().includes('mortgage')) {
      return mockGeminiResponses.mortgageCalculatorResponse;
    }
    return mockGeminiResponses.conversationalOnlyResponse;
  })
}));

import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { generateCalculatorFromPrompt } from '../server/gemini';
import { mockGeminiResponses, mockTestUser } from './test-utils';
import type { InsertCalculator } from '@shared/schema';

// Test suite for Gemini AI integration and calculator workflow
describe('Gemini Calculator Integration', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('Gemini API Mocked Tests', () => {
    it('should generate response for BMI calculator request', async () => {
      const response = await generateCalculatorFromPrompt(
        'I need a BMI calculator',
        []
      );

      expect(response.response).toBeDefined();
      expect(response.response).toContain('BMI');
      expect(typeof response.response).toBe('string');
      expect(response.calculatorData).toBeDefined();
    });

    it('should generate structured calculator data for mortgage calculator', async () => {
      const response = await generateCalculatorFromPrompt(
        'Create a mortgage calculator with principal, interest rate, and loan term',
        []
      );

      expect(response.response).toBeDefined();
      expect(response.calculatorData).toBeDefined();
      
      if (response.calculatorData) {
        expect(response.calculatorData.name).toContain('Mortgage');
        expect(response.calculatorData.fields).toBeDefined();
        expect(Array.isArray(response.calculatorData.fields)).toBe(true);
        expect(response.calculatorData.formula).toBeDefined();
      }
    });

    it('should handle conversational responses without calculator data', async () => {
      const response = await generateCalculatorFromPrompt(
        'Hello, how are you?',
        []
      );

      expect(response.response).toBeDefined();
      expect(typeof response.response).toBe('string');
      expect(response.calculatorData).toBeUndefined();
    });
  });

  describe('Calculator Field Generation', () => {
    it('should generate appropriate field structures', () => {
      const bmiCalc = mockGeminiResponses.bmiCalculatorResponse.calculatorData!;
      const mortgageCalc = mockGeminiResponses.mortgageCalculatorResponse.calculatorData!;

      // BMI Calculator should have weight and height fields
      const bmiFieldIds = bmiCalc.fields.map(f => f.id);
      expect(bmiFieldIds).toContain('weight');
      expect(bmiFieldIds).toContain('height');
      expect(bmiFieldIds).toContain('result');

      // Mortgage Calculator should have principal, rate, term fields
      const mortgageFieldIds = mortgageCalc.fields.map(f => f.id);
      expect(mortgageFieldIds).toContain('principal');
      expect(mortgageFieldIds).toContain('rate');
      expect(mortgageFieldIds).toContain('term');
      expect(mortgageFieldIds).toContain('result');
    });
  });
});

describe('Calculator Workflow Integration', () => {
  describe('Calculator Creation Flow', () => {
    it('should validate calculator data structure', () => {
      const sampleCalculatorData: Partial<InsertCalculator> = {
        name: 'Test BMI Calculator',
        description: 'Calculate Body Mass Index',
        template: 'health',
        fields: [
          {
            id: 'weight',
            type: 'number',
            label: 'Weight (kg)',
            required: true,
            position: { x: 0, y: 0 }
          },
          {
            id: 'height',
            type: 'number', 
            label: 'Height (cm)',
            required: true,
            position: { x: 0, y: 80 }
          },
          {
            id: 'result',
            type: 'result',
            label: 'BMI Result',
            required: false,
            position: { x: 0, y: 160 }
          }
        ],
        formula: 'weight / ((height / 100) * (height / 100))'
      };

      expect(sampleCalculatorData.name).toBeDefined();
      expect(sampleCalculatorData.fields).toBeDefined();
      expect(sampleCalculatorData.fields!.length).toBeGreaterThan(0);
      expect(sampleCalculatorData.formula).toBeDefined();
    });

    it('should have required field types', () => {
      const validFieldTypes = ['text', 'number', 'select', 'checkbox', 'result'];
      const testField = {
        id: 'test_field',
        type: 'number' as const,
        label: 'Test Field',
        required: true,
        position: { x: 0, y: 0 }
      };

      expect(validFieldTypes).toContain(testField.type);
    });
  });

  describe('Formula Validation', () => {
    it('should validate simple mathematical formulas', () => {
      const formulas = [
        'field1 + field2',
        'field1 * field2 / 100', 
        '(field1 + field2) * 0.5',
        'Math.sqrt(field1 * field2)',
        'field1 / (field2 * field2)'
      ];

      formulas.forEach(formula => {
        expect(typeof formula).toBe('string');
        expect(formula.length).toBeGreaterThan(0);
        // Basic validation - should contain field references
        expect(formula).toMatch(/field\d+/);
      });
    });
  });

  describe('HTTP Route Integration Tests', () => {
    let app: express.Application;
    let server: any;

    // Mock authentication for testing
    const mockAuth = (req: any, res: any, next: any) => {
      req.user = { claims: { sub: mockTestUser.id } };
      next();
    };

    beforeAll(async () => {
      app = express();
      app.use(express.json());
      app.use(mockAuth);
      server = await registerRoutes(app);
    });

    afterAll(() => {
      if (server) {
        server.close();
      }
    });

    it('should handle BMI calculator request via /api/gemini/chat endpoint', async () => {
      const chatRequest = {
        message: 'I need a BMI calculator',
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/gemini/chat')
        .send(chatRequest);

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.calculatorData).toBeDefined();
      expect(response.body.calculatorData.name).toContain('BMI');
    });

    it('should handle mortgage calculator request via /api/gemini/chat endpoint', async () => {
      const chatRequest = {
        message: 'Create a mortgage calculator',
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/gemini/chat')
        .send(chatRequest);

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.calculatorData).toBeDefined();
      expect(response.body.calculatorData.name).toContain('Mortgage');
    });

    it('should handle conversational requests without calculator data', async () => {
      const chatRequest = {
        message: 'Hello, how are you?',
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/gemini/chat')
        .send(chatRequest);

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.calculatorData).toBeUndefined();
    });

    it('should require message in request body', async () => {
      const chatRequest = {
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/gemini/chat')
        .send(chatRequest);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Message is required');
    });

    it('should return proper conversational response text', async () => {
      const chatRequest = {
        message: 'Hello, how are you?',
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/gemini/chat')
        .send(chatRequest);

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response).toContain("I'm here to help");
      expect(response.body.calculatorData).toBeUndefined();
    });
  });
});

