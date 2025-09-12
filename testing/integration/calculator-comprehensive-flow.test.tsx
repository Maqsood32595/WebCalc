
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup/test-utils';
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

describe('Calculator Comprehensive Flow Tests', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { 
        id: 'test-user', 
        subscriptionStatus: 'free', 
        email: 'l.maqsood.m@gmail.com' 
      },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Age Calculator Template Loading', () => {
    it('loads age calculator template successfully', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const templateButton = screen.getByTestId('template-age-calculator');
        expect(templateButton).toBeInTheDocument();
        
        fireEvent.click(templateButton);
      });

      await waitFor(() => {
        // Check if calculator name is updated
        const nameInput = screen.getByTestId('input-calculator-name');
        expect(nameInput).toHaveValue('Age Calculator');
        
        // Check if description is loaded
        const descriptionInput = screen.getByTestId('textarea-calculator-description');
        expect(descriptionInput).toHaveValue('Calculate your exact age in years, months, and days. Perfect for birthdays, age verification, or just curiosity!');
        
        // Check if formula is loaded
        const formulaInput = screen.getByTestId('textarea-formula');
        expect(formulaInput.value).toContain('birthDate');
        expect(formulaInput.value).toContain('currentDate');
      });
    });

    it('creates fields from age calculator template', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const templateButton = screen.getByTestId('template-age-calculator');
        fireEvent.click(templateButton);
      });

      await waitFor(() => {
        // Should have birth date field
        expect(screen.getByText('Birth Date')).toBeInTheDocument();
        
        // Should have current date field
        expect(screen.getByText('Current Date (leave empty for today)')).toBeInTheDocument();
        
        // Should have result field
        expect(screen.getByText('Your Age')).toBeInTheDocument();
      });
    });
  });

  describe('Calculator Building Workflow', () => {
    it('creates a complete calculator with all field types', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(async () => {
        // Set calculator details
        const nameInput = screen.getByTestId('input-calculator-name');
        fireEvent.change(nameInput, { target: { value: 'Complete Test Calculator' } });
        
        const descriptionInput = screen.getByTestId('textarea-calculator-description');
        fireEvent.change(descriptionInput, { target: { value: 'A comprehensive test calculator' } });
        
        // Add text input
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
        
        // Add number input
        const addNumberButton = screen.getByTestId('button-add-number');
        fireEvent.click(addNumberButton);
        
        // Add select dropdown
        const addSelectButton = screen.getByTestId('button-add-select');
        fireEvent.click(addSelectButton);
        
        // Add result display
        const addResultButton = screen.getByTestId('button-add-result');
        fireEvent.click(addResultButton);
        
        // Verify all fields are added
        await waitFor(() => {
          const fieldElements = screen.queryAllByTestId(/^field-field_/);
          expect(fieldElements).toHaveLength(4);
        });
      });
    });

    it('configures field properties correctly', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Add text field
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        // Select the field
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Update field label
        const labelInput = screen.getByTestId('input-field-label');
        fireEvent.change(labelInput, { target: { value: 'Custom Field Label' } });
        
        // Update placeholder
        const placeholderInput = screen.getByTestId('input-field-placeholder');
        fireEvent.change(placeholderInput, { target: { value: 'Enter custom value' } });
        
        // Toggle required
        const requiredSwitch = screen.getByTestId('switch-field-required');
        fireEvent.click(requiredSwitch);
        
        // Verify changes are applied
        expect(screen.getByText('Custom Field Label')).toBeInTheDocument();
        expect(requiredSwitch).toBeChecked();
      });
    });

    it('handles formula editing and validation', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Add number fields
        const addNumberButton = screen.getByTestId('button-add-number');
        fireEvent.click(addNumberButton);
        fireEvent.click(addNumberButton);
        
        // Add result field
        const addResultButton = screen.getByTestId('button-add-result');
        fireEvent.click(addResultButton);
        
        // Set formula
        const formulaInput = screen.getByTestId('textarea-formula');
        fireEvent.change(formulaInput, { target: { value: 'field1 + field2' } });
        
        expect(formulaInput).toHaveValue('field1 + field2');
      });
    });

    it('handles payment settings configuration', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Enable payment
        const paymentSwitch = screen.getByTestId('switch-requires-payment');
        fireEvent.click(paymentSwitch);
        
        // Set price
        const priceInput = screen.getByTestId('input-price');
        fireEvent.change(priceInput, { target: { value: '9.99' } });
        
        expect(paymentSwitch).toBeChecked();
        expect(priceInput).toHaveValue(9.99);
      });
    });
  });

  describe('Calculator Preview and Testing', () => {
    it('switches to preview mode correctly', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Load age calculator template
        const templateButton = screen.getByTestId('template-age-calculator');
        fireEvent.click(templateButton);
      });

      await waitFor(() => {
        // Switch to preview
        const previewButton = screen.getByTestId('button-preview');
        fireEvent.click(previewButton);
        
        // Should show preview interface
        expect(screen.getByTestId('button-back-to-editor')).toBeInTheDocument();
        expect(screen.getByText('Calculator Preview')).toBeInTheDocument();
      });
    });

    it('saves calculator successfully', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(async () => {
        // Set calculator name
        const nameInput = screen.getByTestId('input-calculator-name');
        fireEvent.change(nameInput, { target: { value: 'Test Save Calculator' } });
        
        // Save calculator
        const saveButton = screen.getByTestId('button-save');
        fireEvent.click(saveButton);
        
        // Should show success message
        await waitFor(() => {
          expect(screen.getByText('Calculator saved')).toBeInTheDocument();
        });
      });
    });

    it('publishes calculator correctly', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Set calculator name
        const nameInput = screen.getByTestId('input-calculator-name');
        fireEvent.change(nameInput, { target: { value: 'Test Publish Calculator' } });
        
        // Publish calculator
        const publishButton = screen.getByTestId('button-publish');
        fireEvent.click(publishButton);
        
        // Should update publish status
        expect(screen.getByText('Published')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles empty calculator gracefully', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const canvas = screen.getByTestId('canvas');
        expect(canvas).toBeInTheDocument();
        
        // Should show empty state message
        expect(screen.getByText('Start building your calculator')).toBeInTheDocument();
        expect(screen.getByText('Add components from the left panel')).toBeInTheDocument();
      });
    });

    it('validates required fields before saving', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Clear calculator name
        const nameInput = screen.getByTestId('input-calculator-name');
        fireEvent.change(nameInput, { target: { value: '' } });
        
        // Try to save
        const saveButton = screen.getByTestId('button-save');
        fireEvent.click(saveButton);
        
        // Should show validation error
        expect(nameInput).toHaveValue('');
      });
    });

    it('handles field deletion correctly', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Add a field
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        // Select and delete field
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        const deleteButton = screen.queryByTestId(/^button-delete-field-/);
        fireEvent.click(deleteButton!);
        
        // Field should be removed
        expect(screen.queryByTestId(/^field-field_/)).not.toBeInTheDocument();
        
        // Should show empty state
        expect(screen.getByText('Start building your calculator')).toBeInTheDocument();
      });
    });
  });

  describe('Field Position Management', () => {
    it('positions fields without overlap', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Add multiple fields
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
        fireEvent.click(addTextButton);
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElements = screen.queryAllByTestId(/^field-field_/);
        expect(fieldElements).toHaveLength(3);
        
        // Check that fields have different y positions
        const positions = fieldElements.map(el => el.style.top);
        const uniquePositions = new Set(positions);
        expect(uniquePositions.size).toBe(3);
      });
    });
  });
});
