
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '@/pages/Builder';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('wouter', () => ({
  useParams: () => ({}),
  useLocation: () => ['/builder', vi.fn()],
}));

describe('Calculator Workflow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('creates complete age calculator workflow', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(async () => {
      // Step 1: Set calculator name and description
      const nameInput = screen.getByTestId('input-calculator-name');
      const descriptionTextarea = screen.getByTestId('textarea-calculator-description');
      
      fireEvent.change(nameInput, { target: { value: 'Complete Age Calculator' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'Calculate your exact age in years' } });

      // Step 2: Set formula
      const formulaTextarea = screen.getByTestId('textarea-formula');
      fireEvent.change(formulaTextarea, { target: { value: 'ageInYears(date(birthDate))' } });

      // Step 3: Add fields (this would require field management UI)
      // For now, we'll assume fields are managed elsewhere

      // Step 4: Save calculator
      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Calculator saved')).toBeInTheDocument();
      });
    });
  });

  it('creates premium calculator with payment', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(async () => {
      // Basic setup
      const nameInput = screen.getByTestId('input-calculator-name');
      fireEvent.change(nameInput, { target: { value: 'Premium Age Calculator' } });

      // Enable payment
      const paymentSwitch = screen.getByTestId('switch-requires-payment');
      fireEvent.click(paymentSwitch);

      // Set price
      const priceInput = screen.getByTestId('input-price');
      fireEvent.change(priceInput, { target: { value: '5.00' } });

      // Save
      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Calculator saved')).toBeInTheDocument();
      });
    });
  });

  it('publishes calculator workflow', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(async () => {
      // Create calculator
      const nameInput = screen.getByTestId('input-calculator-name');
      fireEvent.change(nameInput, { target: { value: 'Published Calculator' } });

      // Publish
      const publishButton = screen.getByTestId('button-publish');
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument();
      });
    });
  });
});
