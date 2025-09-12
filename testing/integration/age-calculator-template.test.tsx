
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '../../client/src/pages/Builder';
import CalculatorRenderer from '../../client/src/components/CalculatorRenderer';
import { useAuth } from '../../client/src/hooks/useAuth';
import { ageCalculatorTemplate } from '../../client/src/templates/age-calculator-template';

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

describe('Age Calculator Template Tests', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Template Loading', () => {
    it('loads age calculator template correctly', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Check if template button exists
        const templateButton = screen.getByTestId('template-age-calculator');
        expect(templateButton).toBeInTheDocument();
        
        // Click to load template
        fireEvent.click(templateButton);
        
        // Verify calculator name is set
        const nameInput = screen.getByTestId('input-calculator-name');
        expect(nameInput).toHaveValue('Age Calculator');
        
        // Verify description is set
        const descriptionTextarea = screen.getByTestId('textarea-calculator-description');
        expect(descriptionTextarea).toHaveValue(expect.stringContaining('Calculate your exact age'));
        
        // Verify formula is loaded
        const formulaTextarea = screen.getByTestId('textarea-formula');
        expect(formulaTextarea).toHaveValue(expect.stringContaining('birthDate'));
      });
    });

    it('creates fields from template', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const templateButton = screen.getByTestId('template-age-calculator');
        fireEvent.click(templateButton);
        
        // Should have birth date field
        expect(screen.getByText('Birth Date')).toBeInTheDocument();
        
        // Should have current date field
        expect(screen.getByText('Current Date (leave empty for today)')).toBeInTheDocument();
        
        // Should have result field
        expect(screen.getByText('Your Age')).toBeInTheDocument();
      });
    });
  });

  describe('Age Calculator Functionality', () => {
    it('calculates age correctly for valid dates', async () => {
      const testCalculator = {
        ...ageCalculatorTemplate,
        id: 'test-age-calc'
      };
      
      renderWithQueryClient(<CalculatorRenderer calculator={testCalculator} />);
      
      await waitFor(() => {
        // Fill in birth date (30 years ago)
        const birthDateInput = screen.getByTestId('input-field1');
        fireEvent.change(birthDateInput, { target: { value: '01/01/1994' } });
        
        // Calculate
        const calculateButton = screen.getByTestId('button-calculate');
        fireEvent.click(calculateButton);
        
        // Should show age result
        const result = screen.getByTestId('text-result');
        expect(result).toBeInTheDocument();
        expect(result.textContent).toMatch(/\d+ years, \d+ months, \d+ days/);
      });
    });

    it('handles invalid birth date', async () => {
      const testCalculator = {
        ...ageCalculatorTemplate,
        id: 'test-age-calc'
      };
      
      renderWithQueryClient(<CalculatorRenderer calculator={testCalculator} />);
      
      await waitFor(() => {
        // Fill in invalid birth date
        const birthDateInput = screen.getByTestId('input-field1');
        fireEvent.change(birthDateInput, { target: { value: 'invalid-date' } });
        
        // Calculate
        const calculateButton = screen.getByTestId('button-calculate');
        fireEvent.click(calculateButton);
        
        // Should show error message
        const result = screen.getByTestId('text-result');
        expect(result.textContent).toContain('Please enter a valid birth date');
      });
    });

    it('handles future birth date', async () => {
      const testCalculator = {
        ...ageCalculatorTemplate,
        id: 'test-age-calc'
      };
      
      renderWithQueryClient(<CalculatorRenderer calculator={testCalculator} />);
      
      await waitFor(() => {
        // Fill in future birth date
        const birthDateInput = screen.getByTestId('input-field1');
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const futureDateString = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getDate().toString().padStart(2, '0')}/${futureDate.getFullYear()}`;
        
        fireEvent.change(birthDateInput, { target: { value: futureDateString } });
        
        // Calculate
        const calculateButton = screen.getByTestId('button-calculate');
        fireEvent.click(calculateButton);
        
        // Should show error message
        const result = screen.getByTestId('text-result');
        expect(result.textContent).toContain('Birth date cannot be in the future');
      });
    });

    it('uses current date when second field is empty', async () => {
      const testCalculator = {
        ...ageCalculatorTemplate,
        id: 'test-age-calc'
      };
      
      renderWithQueryClient(<CalculatorRenderer calculator={testCalculator} />);
      
      await waitFor(() => {
        // Fill in only birth date
        const birthDateInput = screen.getByTestId('input-field1');
        fireEvent.change(birthDateInput, { target: { value: '01/01/1990' } });
        
        // Leave current date empty
        const currentDateInput = screen.getByTestId('input-field2');
        expect(currentDateInput).toHaveValue('');
        
        // Calculate
        const calculateButton = screen.getByTestId('button-calculate');
        fireEvent.click(calculateButton);
        
        // Should calculate age based on today
        const result = screen.getByTestId('text-result');
        expect(result.textContent).toMatch(/\d+ years, \d+ months, \d+ days/);
      });
    });

    it('uses custom current date when provided', async () => {
      const testCalculator = {
        ...ageCalculatorTemplate,
        id: 'test-age-calc'
      };
      
      renderWithQueryClient(<CalculatorRenderer calculator={testCalculator} />);
      
      await waitFor(() => {
        // Fill in birth date
        const birthDateInput = screen.getByTestId('input-field1');
        fireEvent.change(birthDateInput, { target: { value: '01/01/1990' } });
        
        // Fill in custom current date
        const currentDateInput = screen.getByTestId('input-field2');
        fireEvent.change(currentDateInput, { target: { value: '01/01/2020' } });
        
        // Calculate
        const calculateButton = screen.getByTestId('button-calculate');
        fireEvent.click(calculateButton);
        
        // Should show exactly 30 years
        const result = screen.getByTestId('text-result');
        expect(result.textContent).toContain('30 years');
      });
    });
  });

  describe('Complete Age Calculator Workflow', () => {
    it('creates complete age calculator from template', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(async () => {
        // Step 1: Load template
        const templateButton = screen.getByTestId('template-age-calculator');
        fireEvent.click(templateButton);
        
        // Step 2: Verify all fields are created
        expect(screen.getByText('Birth Date')).toBeInTheDocument();
        expect(screen.getByText('Your Age')).toBeInTheDocument();
        
        // Step 3: Customize if needed (optional)
        const descriptionTextarea = screen.getByTestId('textarea-calculator-description');
        fireEvent.change(descriptionTextarea, { target: { value: 'My Custom Age Calculator' } });
        
        // Step 4: Save calculator
        const saveButton = screen.getByTestId('button-save');
        fireEvent.click(saveButton);
        
        // Step 5: Preview functionality
        const previewButton = screen.getByTestId('button-preview');
        fireEvent.click(previewButton);
        
        // Should be in preview mode
        expect(screen.getByTestId('button-back-to-editor')).toBeInTheDocument();
      });
    });
  });
});
