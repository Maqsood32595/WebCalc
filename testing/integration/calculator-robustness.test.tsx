
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import CalculatorRenderer from '@/components/CalculatorRenderer';
import { useAuth } from '@/hooks/useAuth';
import type { Calculator } from '@shared/schema';

vi.mock('@/hooks/useAuth');

describe('Calculator Robustness Tests', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  const createTestCalculator = (formula: string, fields: any[]): Calculator => ({
    id: 'robust-calc',
    userId: 'test-user',
    name: 'Robust Calculator',
    description: 'Testing robustness',
    template: null,
    formula,
    fields,
    styling: null,
    isPublished: true,
    requiresPayment: false,
    price: null,
    views: 0,
    conversions: 0,
    revenue: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('Input Validation', () => {
    it('handles empty required fields', () => {
      const calculator = createTestCalculator('field1 + field2', [
        { id: 'field1', type: 'number', label: 'Field 1', required: true, position: { x: 0, y: 0 } },
        { id: 'field2', type: 'number', label: 'Field 2', required: true, position: { x: 0, y: 50 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 100 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      const calculateButton = screen.getByTestId('button-calculate');
      fireEvent.click(calculateButton);
      
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });

    it('handles invalid number inputs', async () => {
      const calculator = createTestCalculator('field1 * field2', [
        { id: 'field1', type: 'number', label: 'Field 1', required: true, position: { x: 0, y: 0 } },
        { id: 'field2', type: 'number', label: 'Field 2', required: true, position: { x: 0, y: 50 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 100 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-field1'), { target: { value: 'not-a-number' } });
      fireEvent.change(screen.getByTestId('input-field2'), { target: { value: '5' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid number input')).toBeInTheDocument();
      });
    });

    it('handles division by zero', async () => {
      const calculator = createTestCalculator('field1 / field2', [
        { id: 'field1', type: 'number', label: 'Numerator', required: true, position: { x: 0, y: 0 } },
        { id: 'field2', type: 'number', label: 'Denominator', required: true, position: { x: 0, y: 50 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 100 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-field1'), { target: { value: '10' } });
      fireEvent.change(screen.getByTestId('input-field2'), { target: { value: '0' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByText('Cannot divide by zero')).toBeInTheDocument();
      });
    });
  });

  describe('Formula Edge Cases', () => {
    it('handles complex formulas with parentheses', async () => {
      const calculator = createTestCalculator('(field1 + field2) * field3', [
        { id: 'field1', type: 'number', label: 'Field 1', required: true, position: { x: 0, y: 0 } },
        { id: 'field2', type: 'number', label: 'Field 2', required: true, position: { x: 0, y: 50 } },
        { id: 'field3', type: 'number', label: 'Field 3', required: true, position: { x: 0, y: 100 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 150 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-field1'), { target: { value: '5' } });
      fireEvent.change(screen.getByTestId('input-field2'), { target: { value: '3' } });
      fireEvent.change(screen.getByTestId('input-field3'), { target: { value: '2' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('text-result')).toHaveTextContent('16');
      });
    });

    it('handles date calculations with invalid dates', async () => {
      const calculator = createTestCalculator('ageInYears(date(birthDate))', [
        { id: 'birthDate', type: 'text', label: 'Birth Date', required: true, position: { x: 0, y: 0 } },
        { id: 'result', type: 'result', label: 'Age', position: { x: 0, y: 50 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-birthDate'), { target: { value: 'invalid-date' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid date format')).toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const calculator = createTestCalculator('field1 + field2', [
        { id: 'field1', type: 'number', label: 'Field 1', required: true, position: { x: 0, y: 0 } },
        { id: 'field2', type: 'number', label: 'Field 2', required: true, position: { x: 0, y: 50 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 100 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-field1'), { target: { value: '5' } });
      fireEvent.change(screen.getByTestId('input-field2'), { target: { value: '3' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('handles large numbers efficiently', async () => {
      const calculator = createTestCalculator('field1 * field2', [
        { id: 'field1', type: 'number', label: 'Field 1', required: true, position: { x: 0, y: 0 } },
        { id: 'field2', type: 'number', label: 'Field 2', required: true, position: { x: 0, y: 50 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 100 } }
      ]);

      render(<CalculatorRenderer calculator={calculator} />);
      
      const startTime = Date.now();
      
      fireEvent.change(screen.getByTestId('input-field1'), { target: { value: '999999999' } });
      fireEvent.change(screen.getByTestId('input-field2'), { target: { value: '888888888' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByTestId('text-result')).toBeInTheDocument();
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
