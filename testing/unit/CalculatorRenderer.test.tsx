
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import CalculatorRenderer from '@/components/CalculatorRenderer';
import { useAuth } from '@/hooks/useAuth';
import type { Calculator } from '@shared/schema';

vi.mock('@/hooks/useAuth');

const mockCalculator: Calculator = {
  id: 'test-calc-1',
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
};

describe('CalculatorRenderer', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders calculator with fields', () => {
    render(<CalculatorRenderer calculator={mockCalculator} />);
    
    expect(screen.getByText('Age Calculator')).toBeInTheDocument();
    expect(screen.getByText('Calculate your exact age')).toBeInTheDocument();
    expect(screen.getByLabelText('Birth Date *')).toBeInTheDocument();
    expect(screen.getByTestId('button-calculate')).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<CalculatorRenderer calculator={mockCalculator} />);
    
    const input = screen.getByTestId('input-field1');
    fireEvent.change(input, { target: { value: '01/01/1990' } });
    
    expect(input).toHaveValue('01/01/1990');
  });

  it('calculates age correctly', async () => {
    render(<CalculatorRenderer calculator={mockCalculator} />);
    
    const birthDateInput = screen.getByTestId('input-field1');
    const calculateButton = screen.getByTestId('button-calculate');
    
    fireEvent.change(birthDateInput, { target: { value: '01/01/1990' } });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      const result = screen.getByTestId('text-result');
      expect(result).toHaveTextContent(/\d+/);
    });
  });

  it('shows payment dialog for premium calculators', () => {
    const premiumCalculator = {
      ...mockCalculator,
      requiresPayment: true,
      price: 500, // $5.00
    };
    
    render(<CalculatorRenderer calculator={premiumCalculator} />);
    
    const birthDateInput = screen.getByTestId('input-field1');
    const calculateButton = screen.getByTestId('button-calculate');
    
    fireEvent.change(birthDateInput, { target: { value: '01/01/1990' } });
    fireEvent.click(calculateButton);
    
    expect(screen.getByText('Premium Calculator')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('validates required fields', () => {
    render(<CalculatorRenderer calculator={mockCalculator} />);
    
    const calculateButton = screen.getByTestId('button-calculate');
    fireEvent.click(calculateButton);
    
    expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
  });

  it('handles calculation errors gracefully', async () => {
    render(<CalculatorRenderer calculator={mockCalculator} />);
    
    const birthDateInput = screen.getByTestId('input-field1');
    const calculateButton = screen.getByTestId('button-calculate');
    
    fireEvent.change(birthDateInput, { target: { value: 'invalid-date' } });
    fireEvent.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error calculating result')).toBeInTheDocument();
    });
  });
});
