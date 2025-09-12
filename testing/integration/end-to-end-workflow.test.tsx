
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '../../client/src/pages/Builder';
import CalculatorRenderer from '../../client/src/components/CalculatorRenderer';
import { useAuth } from '../../client/src/hooks/useAuth';
import type { Calculator } from '../../shared/schema';

vi.mock('../../client/src/hooks/useAuth');
vi.mock('wouter', () => ({
  useParams: () => ({}),
  useLocation: () => ['/builder', vi.fn()],
}));

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Complete Calculator Workflow', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'pro', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('creates and tests age calculator workflow', async () => {
    // Step 1: Create calculator in builder
    renderWithQueryClient(<Builder />);
    
    await waitFor(async () => {
      const nameInput = screen.getByTestId('input-calculator-name');
      const descriptionTextarea = screen.getByTestId('textarea-calculator-description');
      const formulaTextarea = screen.getByTestId('textarea-formula');

      fireEvent.change(nameInput, { target: { value: 'Age Calculator' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'Calculate your exact age' } });
      fireEvent.change(formulaTextarea, { target: { value: 'ageInYears(date(birthDate))' } });

      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);
    });
  });

  it('creates and tests BMI calculator workflow', async () => {
    renderWithQueryClient(<Builder />);
    
    await waitFor(async () => {
      const nameInput = screen.getByTestId('input-calculator-name');
      const formulaTextarea = screen.getByTestId('textarea-formula');

      fireEvent.change(nameInput, { target: { value: 'BMI Calculator' } });
      fireEvent.change(formulaTextarea, { 
        target: { value: 'weight / ((height / 100) * (height / 100))' } 
      });

      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);
    });
  });

  it('creates premium calculator with payment flow', async () => {
    renderWithQueryClient(<Builder />);
    
    await waitFor(async () => {
      const nameInput = screen.getByTestId('input-calculator-name');
      fireEvent.change(nameInput, { target: { value: 'Premium Loan Calculator' } });

      const requiresPaymentSwitch = screen.getByTestId('switch-requires-payment');
      fireEvent.click(requiresPaymentSwitch);

      const priceInput = screen.getByTestId('input-price');
      fireEvent.change(priceInput, { target: { value: '15.99' } });

      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);
    });
  });

  it('tests calculator rendering and calculation', async () => {
    const testCalculator: Calculator = {
      id: 'test-calc-bmi',
      userId: 'test-user',
      name: 'BMI Calculator',
      description: 'Calculate your Body Mass Index',
      template: null,
      formula: 'weight / ((height / 100) * (height / 100))',
      fields: [
        {
          id: 'weight',
          type: 'number',
          label: 'Weight (kg)',
          required: true,
          position: { x: 50, y: 50 },
        },
        {
          id: 'height',
          type: 'number',
          label: 'Height (cm)',
          required: true,
          position: { x: 50, y: 100 },
        },
        {
          id: 'result',
          type: 'result',
          label: 'Your BMI',
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
    };

    render(<CalculatorRenderer calculator={testCalculator} />);
    
    const weightInput = screen.getByTestId('input-weight');
    const heightInput = screen.getByTestId('input-height');
    const calculateButton = screen.getByTestId('button-calculate');

    fireEvent.change(weightInput, { target: { value: '70' } });
    fireEvent.change(heightInput, { target: { value: '175' } });
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const result = screen.getByTestId('text-result');
      expect(result).toHaveTextContent(/22\.86/);
    });
  });
});
