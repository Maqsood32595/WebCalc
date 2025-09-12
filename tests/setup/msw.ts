import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { Calculator, User } from '@shared/schema';

// Mock data
const mockUser: User = {
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profileImageUrl: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
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
    formula: 'Math.floor((new Date() - new Date(field1)) / (365.25 * 24 * 60 * 60 * 1000))',
    fields: [
      {
        id: 'field1',
        type: 'text' as const,
        label: 'Birth Date',
        placeholder: 'MM/DD/YYYY',
        required: true,
        position: { x: 50, y: 50 },
      },
      {
        id: 'field2',
        type: 'result' as const,
        label: 'Your Age in Years',
        position: { x: 50, y: 150 },
      },
    ],
    styling: null,
    isPublished: false,
    requiresPayment: false,
    price: null,
    views: 0,
    conversions: 0,
    revenue: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// API handlers
export const handlers = [
  // Auth endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json(mockUser);
  }),

  http.get('/api/login', () => {
    return new Response(null, { status: 302, headers: { Location: '/dashboard' } });
  }),

  // Calculator endpoints
  http.get('/api/calculators', () => {
    return HttpResponse.json(mockCalculators);
  }),

  http.get('/api/calculators/:id', ({ params }) => {
    const calculator = mockCalculators.find(c => c.id === params.id);
    if (!calculator) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(calculator);
  }),

  http.post('/api/calculators', async ({ request }) => {
    const body = await request.json() as Partial<Calculator>;
    const newCalculator: Calculator = {
      id: `calc-${Date.now()}`,
      userId: 'test-user-1',
      ...body,
      fields: body.fields || [],
      views: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Calculator;
    
    mockCalculators.push(newCalculator);
    return HttpResponse.json(newCalculator, { status: 201 });
  }),

  http.put('/api/calculators/:id', async ({ params, request }) => {
    const body = await request.json() as Partial<Calculator>;
    const index = mockCalculators.findIndex(c => c.id === params.id);
    
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    mockCalculators[index] = { ...mockCalculators[index], ...body };
    return HttpResponse.json(mockCalculators[index]);
  }),

  // Template endpoints
  http.get('/api/templates', () => {
    return HttpResponse.json([]);
  }),

  // PayPal payment endpoints
  http.post('/api/paypal/create-payment', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      paymentId: 'test-payment-id',
      approvalUrl: 'https://paypal.com/test-approval-url',
    });
  }),

  http.post('/api/paypal/webhook', async ({ request }) => {
    // Mock usage tracking
    return HttpResponse.json({ success: true });
  }),

  // Health check
  http.head('/api', () => {
    return new HttpResponse(null, { status: 200 });
  }),
];

export const server = setupServer(...handlers);