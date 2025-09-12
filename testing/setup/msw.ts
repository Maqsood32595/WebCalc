
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { Calculator, User } from '../../shared/schema';

const mockUser: User = {
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profileImageUrl: null,
  subscriptionStatus: 'free',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCalculators: Calculator[] = [
  {
    id: 'calc-1',
    userId: 'test-user-1',
    name: 'Age Calculator',
    description: 'Calculate your exact age',
    template: null,
    formula: 'ageInYears(date(field1))',
    fields: [
      {
        id: 'field1',
        type: 'text',
        label: 'Birth Date',
        placeholder: 'MM/DD/YYYY',
        required: true,
        position: { x: 50, y: 50 },
      },
      {
        id: 'result',
        type: 'result',
        label: 'Your Age in Years',
        position: { x: 50, y: 150 },
      },
    ],
    styling: null,
    isPublished: true,
    requiresPayment: false,
    price: null,
    views: 0,
    conversions: 0,
    revenue: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const handlers = [
  http.get('/api/auth/user', () => {
    return HttpResponse.json(mockUser);
  }),

  http.get('/api/calculators', () => {
    return HttpResponse.json(mockCalculators);
  }),

  http.get('/api/calculators/:id', ({ params }) => {
    const calculator = mockCalculators.find(calc => calc.id === params.id);
    if (!calculator) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(calculator);
  }),

  http.post('/api/calculators', async ({ request }) => {
    const data = await request.json() as Partial<Calculator>;
    const newCalculator: Calculator = {
      ...data,
      id: `calc-${Date.now()}`,
      userId: mockUser.id,
      views: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Calculator;
    
    mockCalculators.push(newCalculator);
    return HttpResponse.json(newCalculator);
  }),

  http.put('/api/calculators/:id', async ({ params, request }) => {
    const data = await request.json() as Partial<Calculator>;
    const index = mockCalculators.findIndex(calc => calc.id === params.id);
    
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    
    mockCalculators[index] = { ...mockCalculators[index], ...data };
    return HttpResponse.json(mockCalculators[index]);
  }),

  http.post('/api/calculators/:id/calculate', async ({ request }) => {
    const data = await request.json() as Record<string, any>;
    
    // Mock calculation logic
    if (data.field1) {
      const birthDate = new Date(data.field1);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return HttpResponse.json({ result: age });
    }
    
    return HttpResponse.json({ result: 'Invalid input' });
  }),

  http.post('/api/payments/process', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      success: true,
      transactionId: `txn_${Date.now()}`,
      message: 'Payment processed successfully'
    });
  }),
];

export const server = setupServer(...handlers);
