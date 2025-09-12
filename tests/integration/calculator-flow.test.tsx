
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@tests/setup/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Builder from '@/pages/Builder';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('wouter', () => ({
  useParams: () => ({}),
  useLocation: () => ['/builder', vi.fn()],
}));

describe('Calculator Creation Flow', () => {
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

  it('creates and saves a new calculator', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Builder />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Fill in calculator details
      const nameInput = screen.getByTestId('input-calculator-name');
      const descriptionTextarea = screen.getByTestId('textarea-calculator-description');
      const formulaTextarea = screen.getByTestId('textarea-formula');

      fireEvent.change(nameInput, { target: { value: 'Test Age Calculator' } });
      fireEvent.change(descriptionTextarea, { target: { value: 'A test calculator' } });
      fireEvent.change(formulaTextarea, { target: { value: 'ageInYears(date(field1))' } });

      // Save the calculator
      const saveButton = screen.getByTestId('button-save');
      fireEvent.click(saveButton);
    });
  });
});
