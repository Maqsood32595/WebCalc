
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
import Builder from '@/pages/Builder';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
vi.mock('wouter', () => ({
  useParams: () => ({ id: 'test-calc-1' }),
  useLocation: () => ['/builder/test-calc-1', vi.fn()],
}));

describe('Builder', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders builder interface', async () => {
    render(<Builder />);
    
    await waitFor(() => {
      expect(screen.getByTestId('input-calculator-name')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-calculator-description')).toBeInTheDocument();
      expect(screen.getByTestId('textarea-formula')).toBeInTheDocument();
    });
  });

  it('allows editing calculator settings', async () => {
    render(<Builder />);
    
    await waitFor(() => {
      const nameInput = screen.getByTestId('input-calculator-name');
      fireEvent.change(nameInput, { target: { value: 'My Custom Calculator' } });
      expect(nameInput).toHaveValue('My Custom Calculator');
    });
  });

  it('shows preview mode', async () => {
    render(<Builder />);
    
    await waitFor(() => {
      const previewButton = screen.getByTestId('button-preview');
      fireEvent.click(previewButton);
      expect(screen.getByTestId('button-back-to-editor')).toBeInTheDocument();
    });
  });

  it('saves calculator successfully', async () => {
    render(<Builder />);
    
    await waitFor(async () => {
      const nameInput = screen.getByTestId('input-calculator-name');
      const saveButton = screen.getByTestId('button-save');
      
      fireEvent.change(nameInput, { target: { value: 'Test Calculator' } });
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Calculator saved')).toBeInTheDocument();
      });
    });
  });

  it('handles payment settings', async () => {
    render(<Builder />);
    
    await waitFor(() => {
      const paymentSwitch = screen.getByTestId('switch-requires-payment');
      fireEvent.click(paymentSwitch);
      
      expect(screen.getByTestId('input-price')).toBeInTheDocument();
    });
  });
});
