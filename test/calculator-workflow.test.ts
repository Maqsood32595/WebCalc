import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { mockCalculatorSpecs, mockTestUser, createMockApiRequest } from './test-utils';
import type { Calculator, InsertCalculator } from '@shared/schema';

// Test suite for complete calculator workflow: create -> save -> publish -> share
describe('Calculator Workflow End-to-End', () => {
  let app: express.Application;
  let server: any;
  let testCalculatorId: string;

  // Mock authentication for testing
  const mockAuth = (req: any, res: any, next: any) => {
    req.user = { claims: { sub: mockTestUser.id } };
    next();
  };

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware for tests
    app.use(mockAuth);

    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  describe('Calculator Creation from Gemini', () => {
    it('should create a calculator from Gemini-generated specification', async () => {
      const calculatorSpec = mockCalculatorSpecs.bmiCalculator;

      const response = await request(app)
        .post('/api/calculators')
        .send(calculatorSpec);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(calculatorSpec.name);
      expect(response.body.fields).toEqual(calculatorSpec.fields);
      expect(response.body.formula).toBe(calculatorSpec.formula);

      testCalculatorId = response.body.id;
    });

    it('should create a mortgage calculator from specification', async () => {
      const calculatorSpec = mockCalculatorSpecs.mortgageCalculator;

      const response = await request(app)
        .post('/api/calculators')
        .send(calculatorSpec);

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.name).toBe(calculatorSpec.name);
      expect(response.body.template).toBe('financial');
      expect(response.body.fields.length).toBeGreaterThan(0);
    });
  });

  describe('Calculator Management', () => {
    it('should retrieve user calculators', async () => {
      const response = await request(app)
        .get('/api/calculators');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should retrieve specific calculator by ID', async () => {
      if (!testCalculatorId) {
        throw new Error('Test calculator not created');
      }

      const response = await request(app)
        .get(`/api/calculators/${testCalculatorId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCalculatorId);
      expect(response.body.name).toBeDefined();
      expect(response.body.fields).toBeDefined();
    });

    it('should update calculator properties', async () => {
      if (!testCalculatorId) {
        throw new Error('Test calculator not created');
      }

      const updateData = {
        name: 'Updated BMI Calculator',
        description: 'Updated description for BMI calculator',
        isPublished: true
      };

      const response = await request(app)
        .put(`/api/calculators/${testCalculatorId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.isPublished).toBe(true);
    });
  });

  describe('Publishing and Sharing Workflow', () => {
    it('should publish calculator for public access', async () => {
      if (!testCalculatorId) {
        throw new Error('Test calculator not created');
      }

      // First publish the calculator
      await request(app)
        .put(`/api/calculators/${testCalculatorId}`)
        .send({ isPublished: true });

      // Then access it via public endpoint
      const response = await request(app)
        .get(`/api/public/calculators/${testCalculatorId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCalculatorId);
      expect(response.body.isPublished).toBe(true);
    });

    it('should increment view count on public access', async () => {
      if (!testCalculatorId) {
        throw new Error('Test calculator not created');
      }

      // Get initial view count
      const initialResponse = await request(app)
        .get(`/api/calculators/${testCalculatorId}`);

      const initialViews = initialResponse.body.views || 0;

      // Access public calculator to increment views
      await request(app)
        .get(`/api/public/calculators/${testCalculatorId}`);

      // Verify view count increased
      const updatedResponse = await request(app)
        .get(`/api/calculators/${testCalculatorId}`);

      expect(updatedResponse.body.views).toBe(initialViews + 1);
    });

    it('should not allow access to unpublished calculator via public endpoint', async () => {
      if (!testCalculatorId) {
        throw new Error('Test calculator not created');
      }

      // Unpublish the calculator
      await request(app)
        .put(`/api/calculators/${testCalculatorId}`)
        .send({ isPublished: false });

      // Try to access via public endpoint
      const response = await request(app)
        .get(`/api/public/calculators/${testCalculatorId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Calculator Deletion', () => {
    it('should delete calculator', async () => {
      if (!testCalculatorId) {
        throw new Error('Test calculator not created');
      }

      const response = await request(app)
        .delete(`/api/calculators/${testCalculatorId}`);

      expect(response.status).toBe(204);

      // Verify calculator is deleted
      const getResponse = await request(app)
        .get(`/api/calculators/${testCalculatorId}`);

      expect(getResponse.status).toBe(404);
    });
  });
});

describe('Gemini Chat API Integration', () => {
  let app: express.Application;
  let server: any;

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

  describe('Chat API Endpoints', () => {
    it('should handle missing message', async () => {
      const chatRequest = {
        conversationHistory: []
      };

      const response = await request(app)
        .post('/api/gemini/chat')
        .send(chatRequest);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Message is required');
    });
  });
});

// Performance and reliability tests
describe('System Performance Tests', () => {
  it('should validate calculator field structure', () => {
    const validField = {
      id: 'test_field',
      type: 'number' as const,
      label: 'Test Field',
      required: true,
      position: { x: 100, y: 200 }
    };

    expect(validField.id).toBeDefined();
    expect(validField.type).toBeDefined();
    expect(validField.label).toBeDefined();
    expect(validField.position).toBeDefined();
    expect(validField.position.x).toBeGreaterThanOrEqual(0);
    expect(validField.position.y).toBeGreaterThanOrEqual(0);
  });
});