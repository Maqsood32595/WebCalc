
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '../../client/src/pages/Builder';
import CalculatorRenderer from '../../client/src/components/CalculatorRenderer';
import { useAuth } from '../../client/src/hooks/useAuth';
import type { Calculator } from '@shared/schema';

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

describe('Comprehensive Calculator Testing Suite', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { 
        id: 'test-user-maqsood', 
        subscriptionStatus: 'pro', 
        email: 'l.maqsood.m@gmail.com' 
      },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Age Calculator - Complete Testing', () => {
    it('creates and tests age calculator with various date formats', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Load age calculator template
        const templateButton = screen.getByTestId('template-age-calculator');
        fireEvent.click(templateButton);
      });

      // Test with different date formats
      const testCases = [
        { input: '01/01/1990', expectedAge: new Date().getFullYear() - 1990 },
        { input: '12/31/1985', expectedAge: new Date().getFullYear() - 1985 },
        { input: '06/15/2000', expectedAge: new Date().getFullYear() - 2000 }
      ];

      await waitFor(() => {
        const previewButton = screen.getByTestId('button-preview');
        fireEvent.click(previewButton);
      });

      for (const testCase of testCases) {
        const birthDateInput = screen.getByTestId('input-birthDate');
        fireEvent.change(birthDateInput, { target: { value: testCase.input } });
        
        const calculateButton = screen.getByTestId('button-calculate');
        fireEvent.click(calculateButton);
        
        await waitFor(() => {
          const result = screen.getByTestId('text-result');
          expect(result).toContainText(testCase.expectedAge.toString());
        });
      }
    });

    it('validates invalid date inputs', async () => {
      const calculator: Calculator = {
        id: 'age-calc',
        userId: 'test-user-maqsood',
        name: 'Age Calculator',
        description: 'Calculate age',
        template: null,
        formula: 'ageInYears(date(birthDate))',
        fields: [
          { id: 'birthDate', type: 'text', label: 'Birth Date', required: true, position: { x: 0, y: 0 } },
          { id: 'result', type: 'result', label: 'Your Age', position: { x: 0, y: 50 } }
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

      render(<CalculatorRenderer calculator={calculator} />);
      
      const invalidDates = ['invalid-date', '32/13/2023', 'not-a-date', ''];
      
      for (const invalidDate of invalidDates) {
        fireEvent.change(screen.getByTestId('input-birthDate'), { target: { value: invalidDate } });
        fireEvent.click(screen.getByTestId('button-calculate'));
        
        await waitFor(() => {
          expect(screen.getByText(/invalid|error|required/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Mathematical Calculators - Comprehensive Testing', () => {
    const testCalculators = [
      {
        name: 'BMI Calculator',
        formula: 'weight / ((height / 100) * (height / 100))',
        fields: [
          { id: 'weight', type: 'number', label: 'Weight (kg)', required: true },
          { id: 'height', type: 'number', label: 'Height (cm)', required: true }
        ],
        testCases: [
          { weight: '70', height: '175', expected: '22.86' },
          { weight: '80', height: '180', expected: '24.69' },
          { weight: '60', height: '160', expected: '23.44' }
        ]
      },
      {
        name: 'Compound Interest Calculator',
        formula: 'principal * Math.pow((1 + rate / 100), years)',
        fields: [
          { id: 'principal', type: 'number', label: 'Principal Amount', required: true },
          { id: 'rate', type: 'number', label: 'Annual Rate (%)', required: true },
          { id: 'years', type: 'number', label: 'Years', required: true }
        ],
        testCases: [
          { principal: '1000', rate: '5', years: '10', expected: '1628.89' },
          { principal: '5000', rate: '7', years: '5', expected: '7012.76' },
          { principal: '2000', rate: '3', years: '15', expected: '3115.85' }
        ]
      },
      {
        name: 'Loan Payment Calculator',
        formula: '(principal * (rate / 1200)) / (1 - Math.pow(1 + (rate / 1200), -months))',
        fields: [
          { id: 'principal', type: 'number', label: 'Loan Amount', required: true },
          { id: 'rate', type: 'number', label: 'Annual Rate (%)', required: true },
          { id: 'months', type: 'number', label: 'Loan Term (months)', required: true }
        ],
        testCases: [
          { principal: '200000', rate: '4.5', months: '360', expected: '1013.37' },
          { principal: '50000', rate: '6', months: '60', expected: '966.64' }
        ]
      }
    ];

    testCalculators.forEach((calcConfig) => {
      it(`tests ${calcConfig.name} with multiple scenarios`, async () => {
        const calculator: Calculator = {
          id: `calc-${calcConfig.name.toLowerCase().replace(/ /g, '-')}`,
          userId: 'test-user-maqsood',
          name: calcConfig.name,
          description: `Test ${calcConfig.name}`,
          template: null,
          formula: calcConfig.formula,
          fields: [
            ...calcConfig.fields.map((field, index) => ({
              ...field,
              position: { x: 0, y: index * 60 }
            })),
            { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: calcConfig.fields.length * 60 } }
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

        render(<CalculatorRenderer calculator={calculator} />);

        for (const testCase of calcConfig.testCases) {
          // Fill in test values
          for (const [fieldId, value] of Object.entries(testCase)) {
            if (fieldId !== 'expected') {
              const input = screen.getByTestId(`input-${fieldId}`);
              fireEvent.change(input, { target: { value } });
            }
          }

          // Calculate
          fireEvent.click(screen.getByTestId('button-calculate'));

          // Verify result
          await waitFor(() => {
            const result = screen.getByTestId('text-result');
            const resultText = result.textContent || '';
            const resultNumber = parseFloat(resultText);
            const expectedNumber = parseFloat(testCase.expected);
            
            // Allow for small rounding differences
            expect(Math.abs(resultNumber - expectedNumber)).toBeLessThan(1);
          });
        }
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles division by zero gracefully', async () => {
      const calculator: Calculator = {
        id: 'division-test',
        userId: 'test-user-maqsood',
        name: 'Division Test',
        description: 'Test division by zero',
        template: null,
        formula: 'numerator / denominator',
        fields: [
          { id: 'numerator', type: 'number', label: 'Numerator', required: true, position: { x: 0, y: 0 } },
          { id: 'denominator', type: 'number', label: 'Denominator', required: true, position: { x: 0, y: 60 } },
          { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 120 } }
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

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-numerator'), { target: { value: '10' } });
      fireEvent.change(screen.getByTestId('input-denominator'), { target: { value: '0' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByText(/cannot divide by zero|infinity|error/i)).toBeInTheDocument();
      });
    });

    it('validates required fields', async () => {
      const calculator: Calculator = {
        id: 'required-test',
        userId: 'test-user-maqsood',
        name: 'Required Field Test',
        description: 'Test required fields',
        template: null,
        formula: 'field1 + field2',
        fields: [
          { id: 'field1', type: 'number', label: 'Field 1', required: true, position: { x: 0, y: 0 } },
          { id: 'field2', type: 'number', label: 'Field 2', required: true, position: { x: 0, y: 60 } },
          { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 120 } }
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

      render(<CalculatorRenderer calculator={calculator} />);
      
      // Try to calculate without filling required fields
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
      });
    });
  });

  describe('Premium Calculator Testing', () => {
    it('tests payment flow for premium calculators', async () => {
      const calculator: Calculator = {
        id: 'premium-calc',
        userId: 'test-user-maqsood',
        name: 'Premium Calculator',
        description: 'Premium calculation',
        template: null,
        formula: 'field1 * 2',
        fields: [
          { id: 'field1', type: 'number', label: 'Input', required: true, position: { x: 0, y: 0 } },
          { id: 'result', type: 'result', label: 'Result', position: { x: 0, y: 60 } }
        ],
        styling: null,
        isPublished: true,
        requiresPayment: true,
        price: 9.99,
        views: 0,
        conversions: 0,
        revenue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(<CalculatorRenderer calculator={calculator} />);
      
      fireEvent.change(screen.getByTestId('input-field1'), { target: { value: '5' } });
      fireEvent.click(screen.getByTestId('button-calculate'));
      
      // Should show payment dialog
      await waitFor(() => {
        expect(screen.getByText(/payment required|pay \$9\.99/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complex Formula Testing', () => {
    const complexFormulas = [
      {
        name: 'Quadratic Formula',
        formula: '(-b + Math.sqrt(b*b - 4*a*c)) / (2*a)',
        fields: ['a', 'b', 'c'],
        testCase: { a: '1', b: '-5', c: '6', expected: '3' }
      },
      {
        name: 'Circle Area and Circumference',
        formula: 'Math.PI * radius * radius',
        fields: ['radius'],
        testCase: { radius: '5', expected: '78.54' }
      },
      {
        name: 'Pythagorean Theorem',
        formula: 'Math.sqrt(a*a + b*b)',
        fields: ['a', 'b'],
        testCase: { a: '3', b: '4', expected: '5' }
      }
    ];

    complexFormulas.forEach((formulaTest) => {
      it(`tests ${formulaTest.name}`, async () => {
        const calculator: Calculator = {
          id: `formula-${formulaTest.name.toLowerCase().replace(/ /g, '-')}`,
          userId: 'test-user-maqsood',
          name: formulaTest.name,
          description: `Test ${formulaTest.name}`,
          template: null,
          formula: formulaTest.formula,
          fields: [
            ...formulaTest.fields.map((fieldId, index) => ({
              id: fieldId,
              type: 'number' as const,
              label: fieldId.toUpperCase(),
              required: true,
              position: { x: 0, y: index * 60 }
            })),
            { id: 'result', type: 'result' as const, label: 'Result', position: { x: 0, y: formulaTest.fields.length * 60 } }
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

        render(<CalculatorRenderer calculator={calculator} />);

        // Fill in test values
        for (const [fieldId, value] of Object.entries(formulaTest.testCase)) {
          if (fieldId !== 'expected') {
            const input = screen.getByTestId(`input-${fieldId}`);
            fireEvent.change(input, { target: { value } });
          }
        }

        // Calculate
        fireEvent.click(screen.getByTestId('button-calculate'));

        // Verify result
        await waitFor(() => {
          const result = screen.getByTestId('text-result');
          const resultText = result.textContent || '';
          const resultNumber = parseFloat(resultText);
          const expectedNumber = parseFloat(formulaTest.testCase.expected);
          
          expect(Math.abs(resultNumber - expectedNumber)).toBeLessThan(0.1);
        });
      });
    });
  });
});
