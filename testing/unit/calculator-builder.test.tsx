
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '../../client/src/pages/Builder';
import { useAuth } from '../../client/src/hooks/useAuth';

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

describe('Calculator Builder Workflow', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders builder interface with all required elements', async () => {
    renderWithQueryClient(<Builder />);
    
    await waitFor(() => {
      expect(screen.getByTestId('input-calculator-name')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-calculator-description')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-formula')).toBeInTheDocument();
      expect(screen.getByTestId('button-save')).toBeInTheDocument();
      expect(screen.getByTestId('button-preview')).toBeInTheDocument();
    });
  });

  it('creates age calculator step by step', async () => {
    renderWithQueryClient(<Builder />);
    
    await waitFor(async () => {
      // Step 1: Set calculator name
      const nameInput = screen.getByTestId('input-calculator-name');
      fireEvent.change(nameInput, { target: { value: 'Age Calculator' } });
      expect(nameInput).toHaveValue('Age Calculator');

      // Step 2: Set description
      const descriptionTextarea = screen.getByTestId('textarea-calculator-description');
      fireEvent.change(descriptionTextarea, { target: { value: 'Calculate your exact age in years' } });
      expect(descriptionTextarea).toHaveValue('Calculate your exact age in years');

      // Step 3: Set formula
      const formulaTextarea = screen.getByTestId('textarea-formula');
      fireEvent.change(formulaTextarea, { target: { value: 'ageInYears(date(birthDate))' } });
      expect(formulaTextarea).toHaveValue('ageInYears(date(birthDate))');

      // Step 4: Save calculator
      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);
    });
  });

  it('handles premium calculator setup', async () => {
    renderWithQueryClient(<Builder />);
    
    await waitFor(async () => {
      const nameInput = screen.getByTestId('input-calculator-name');
      fireEvent.change(nameInput, { target: { value: 'Premium BMI Calculator' } });

      const requiresPaymentSwitch = screen.getByTestId('switch-requires-payment');
      fireEvent.click(requiresPaymentSwitch);

      const priceInput = screen.getByTestId('input-price');
      fireEvent.change(priceInput, { target: { value: '9.99' } });

      expect(priceInput).toHaveValue('9.99');
    });
  });

  it('validates form inputs correctly', async () => {
    renderWithQueryClient(<Builder />);
    
    await waitFor(async () => {
      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);

      // Should show validation errors for empty required fields
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });
  });
});
