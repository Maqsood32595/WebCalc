
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import CalculatorRenderer from '../../client/src/components/CalculatorRenderer';
import { useAuth } from '../../client/src/hooks/useAuth';
import type { Calculator } from '@shared/schema';

vi.mock('../../client/src/hooks/useAuth');

describe('Three Main Calculators Validation', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Addition Calculator', () => {
    const additionCalculator: Calculator = {
      id: 'addition-calc',
      userId: 'test-user',
      name: 'Addition Calculator',
      description: 'A simple calculator to add two numbers.',
      template: 'math',
      formula: 'number1 + number2',
      fields: [
        { id: 'number1', type: 'number', label: 'First Number', required: true, placeholder: 'Enter first number', position: { x: 0, y: 0 } },
        { id: 'number2', type: 'number', label: 'Second Number', required: true, placeholder: 'Enter second number', position: { x: 0, y: 80 } },
        { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 160 } }
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

    it('calculates addition correctly', async () => {
      render(<CalculatorRenderer calculator={additionCalculator} />);
      
      const firstInput = screen.getByTestId('input-number1');
      const secondInput = screen.getByTestId('input-number2');
      const calculateButton = screen.getByTestId('button-calculate');
      
      fireEvent.change(firstInput, { target: { value: '10' } });
      fireEvent.change(secondInput, { target: { value: '20' } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        const result = screen.getByTestId('text-result');
        expect(result).toHaveTextContent('30');
      });
    });

    it('validates required fields', async () => {
      render(<CalculatorRenderer calculator={additionCalculator} />);
      
      const calculateButton = screen.getByTestId('button-calculate');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });

    it('handles decimal numbers', async () => {
      render(<CalculatorRenderer calculator={additionCalculator} />);
      
      const firstInput = screen.getByTestId('input-number1');
      const secondInput = screen.getByTestId('input-number2');
      const calculateButton = screen.getByTestId('button-calculate');
      
      fireEvent.change(firstInput, { target: { value: '10.5' } });
      fireEvent.change(secondInput, { target: { value: '20.3' } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        const result = screen.getByTestId('text-result');
        expect(result).toHaveTextContent('30.80');
      });
    });
  });

  describe('BMI Calculator', () => {
    const bmiCalculator: Calculator = {
      id: 'bmi-calc',
      userId: 'test-user',
      name: 'BMI Calculator',
      description: 'Calculate your Body Mass Index',
      template: 'health',
      formula: 'weight / ((height / 100) * (height / 100))',
      fields: [
        { id: 'weight', type: 'number', label: 'Weight (kg)', required: true, placeholder: 'Enter weight', position: { x: 0, y: 0 }, validation: { min: 10, max: 250 } },
        { id: 'height', type: 'number', label: 'Height (cm)', required: true, placeholder: 'Enter height', position: { x: 0, y: 80 }, validation: { min: 50, max: 250 } },
        { id: 'result', type: 'result', label: 'Your BMI', position: { x: 0, y: 160 } }
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

    it('calculates BMI correctly', async () => {
      render(<CalculatorRenderer calculator={bmiCalculator} />);
      
      const weightInput = screen.getByTestId('input-weight');
      const heightInput = screen.getByTestId('input-height');
      const calculateButton = screen.getByTestId('button-calculate');
      
      fireEvent.change(weightInput, { target: { value: '70' } });
      fireEvent.change(heightInput, { target: { value: '175' } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        const result = screen.getByTestId('text-result');
        expect(result).toHaveTextContent('22.86');
      });
    });

    it('validates weight and height ranges', async () => {
      render(<CalculatorRenderer calculator={bmiCalculator} />);
      
      const weightInput = screen.getByTestId('input-weight');
      const heightInput = screen.getByTestId('input-height');
      const calculateButton = screen.getByTestId('button-calculate');
      
      // Test weight too low
      fireEvent.change(weightInput, { target: { value: '5' } });
      fireEvent.change(heightInput, { target: { value: '175' } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Weight.*must be at least 10/)).toBeInTheDocument();
      });
    });
  });

  describe('Age Calculator', () => {
    const ageCalculator: Calculator = {
      id: 'age-calc',
      userId: 'test-user',
      name: 'Age Calculator',
      description: 'Calculate your exact age',
      template: 'general',
      formula: 'ageInYears(date(birthDate))',
      fields: [
        { id: 'birthDate', type: 'text', label: 'Birth Date', required: true, placeholder: 'MM/DD/YYYY', position: { x: 0, y: 0 } },
        { id: 'result', type: 'result', label: 'Your Age', position: { x: 0, y: 80 } }
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

    it('calculates age correctly', async () => {
      render(<CalculatorRenderer calculator={ageCalculator} />);
      
      const birthDateInput = screen.getByTestId('input-birthDate');
      const calculateButton = screen.getByTestId('button-calculate');
      
      // Use a birth date that should result in age 30
      const thirtyYearsAgo = new Date();
      thirtyYearsAgo.setFullYear(thirtyYearsAgo.getFullYear() - 30);
      const birthDateString = `${(thirtyYearsAgo.getMonth() + 1).toString().padStart(2, '0')}/${thirtyYearsAgo.getDate().toString().padStart(2, '0')}/${thirtyYearsAgo.getFullYear()}`;
      
      fireEvent.change(birthDateInput, { target: { value: birthDateString } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        const result = screen.getByTestId('text-result');
        expect(result).toHaveTextContent(/29|30/); // Allow for slight variation
      });
    });

    it('handles invalid date format', async () => {
      render(<CalculatorRenderer calculator={ageCalculator} />);
      
      const birthDateInput = screen.getByTestId('input-birthDate');
      const calculateButton = screen.getByTestId('button-calculate');
      
      fireEvent.change(birthDateInput, { target: { value: 'invalid-date' } });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Invalid date format')).toBeInTheDocument();
      });
    });

    it('validates required birth date field', async () => {
      render(<CalculatorRenderer calculator={ageCalculator} />);
      
      const calculateButton = screen.getByTestId('button-calculate');
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
      });
    });
  });
});
