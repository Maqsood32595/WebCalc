
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

describe('Calculator Builder Comprehensive Tests', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'test-user', subscriptionStatus: 'free', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  describe('Component Addition and Canvas Interaction', () => {
    it('adds text input component to canvas and displays it', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        expect(screen.getByTestId('canvas')).toBeInTheDocument();
      });

      // Add text input component
      const addTextButton = screen.getByTestId('button-add-text');
      fireEvent.click(addTextButton);

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        expect(fieldElement).toBeInTheDocument();
      });
    });

    it('selects field when clicked and highlights it', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        expect(fieldElement).toBeInTheDocument();
        
        // Click on the field to select it
        fireEvent.click(fieldElement!);
        
        // Check if field is highlighted (has ring-2 ring-primary class)
        expect(fieldElement).toHaveClass('ring-2', 'ring-primary');
      });
    });

    it('deselects field when clicking on canvas', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        expect(fieldElement).toHaveClass('ring-2', 'ring-primary');
        
        // Click on canvas to deselect
        const canvas = screen.getByTestId('canvas');
        fireEvent.click(canvas);
        
        // Field should no longer be highlighted
        expect(fieldElement).not.toHaveClass('ring-2', 'ring-primary');
      });
    });
  });

  describe('Properties Panel Functionality', () => {
    it('updates field label through properties panel', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Should show properties panel
        expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
        
        // Update label
        const labelInput = screen.getByTestId('input-field-label');
        expect(labelInput).toBeInTheDocument();
        
        fireEvent.change(labelInput, { target: { value: 'Birth Date' } });
        expect(labelInput).toHaveValue('Birth Date');
        
        // Check if label updated in the field
        expect(screen.getByText('Birth Date')).toBeInTheDocument();
      });
    });

    it('updates field placeholder through properties panel', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Update placeholder
        const placeholderInput = screen.getByTestId('input-field-placeholder');
        fireEvent.change(placeholderInput, { target: { value: 'MM/DD/YYYY' } });
        expect(placeholderInput).toHaveValue('MM/DD/YYYY');
      });
    });

    it('toggles required field setting', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Toggle required switch
        const requiredSwitch = screen.getByTestId('switch-field-required');
        expect(requiredSwitch).toBeInTheDocument();
        
        // Initially should be unchecked
        expect(requiredSwitch).not.toBeChecked();
        
        // Click to toggle
        fireEvent.click(requiredSwitch);
        
        // Should now be checked
        expect(requiredSwitch).toBeChecked();
        
        // Should show required asterisk in field
        expect(screen.getByText('*')).toBeInTheDocument();
      });
    });
  });

  describe('Field Types and Options', () => {
    it('creates select field with options management', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addSelectButton = screen.getByTestId('button-add-select');
        fireEvent.click(addSelectButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Should show options management
        const addOptionButton = screen.getByTestId('button-add-option');
        expect(addOptionButton).toBeInTheDocument();
        
        // Add a new option
        fireEvent.click(addOptionButton);
        
        // Should have 3 options now (2 default + 1 new)
        expect(screen.getByTestId('input-option-2')).toBeInTheDocument();
        
        // Update an option
        const option0Input = screen.getByTestId('input-option-0');
        fireEvent.change(option0Input, { target: { value: 'Custom Option 1' } });
        expect(option0Input).toHaveValue('Custom Option 1');
      });
    });

    it('creates number field with validation settings', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addNumberButton = screen.getByTestId('button-add-number');
        fireEvent.click(addNumberButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Should show validation inputs
        const minInput = screen.getByTestId('input-field-min');
        const maxInput = screen.getByTestId('input-field-max');
        
        expect(minInput).toBeInTheDocument();
        expect(maxInput).toBeInTheDocument();
        
        // Set validation values
        fireEvent.change(minInput, { target: { value: '0' } });
        fireEvent.change(maxInput, { target: { value: '100' } });
        
        expect(minInput).toHaveValue('0');
        expect(maxInput).toHaveValue('100');
      });
    });
  });

  describe('Field Management', () => {
    it('deletes field when delete button is clicked', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElement = screen.queryByTestId(/^field-field_/);
        fireEvent.click(fieldElement!);
        
        // Find and click delete button
        const deleteButton = screen.queryByTestId(/^button-delete-field-/);
        expect(deleteButton).toBeInTheDocument();
        
        fireEvent.click(deleteButton!);
        
        // Field should be removed
        expect(screen.queryByTestId(/^field-field_/)).not.toBeInTheDocument();
        
        // Properties panel should show empty state
        expect(screen.getByTestId('properties-panel-empty')).toBeInTheDocument();
      });
    });

    it('positions new fields correctly to avoid overlap', async () => {
      renderWithQueryClient(<Builder />);
      
      await waitFor(() => {
        // Add first field
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
        
        // Add second field
        fireEvent.click(addTextButton);
      });

      await waitFor(() => {
        const fieldElements = screen.queryAllByTestId(/^field-field_/);
        expect(fieldElements).toHaveLength(2);
        
        // Fields should have different y positions
        const field1Style = fieldElements[0].style;
        const field2Style = fieldElements[1].style;
        
        expect(field1Style.top).not.toBe(field2Style.top);
      });
    });
  });

  describe('Complete Age Calculator Workflow', () => {
    it('creates complete age calculator step by step', async () => {
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

        // Step 3: Add birth date field
        const addTextButton = screen.getByTestId('button-add-text');
        fireEvent.click(addTextButton);
        
        // Configure birth date field
        await waitFor(() => {
          const fieldElement = screen.queryByTestId(/^field-field_/);
          fireEvent.click(fieldElement!);
          
          const labelInput = screen.getByTestId('input-field-label');
          fireEvent.change(labelInput, { target: { value: 'Birth Date' } });
          
          const placeholderInput = screen.getByTestId('input-field-placeholder');
          fireEvent.change(placeholderInput, { target: { value: 'MM/DD/YYYY' } });
          
          const requiredSwitch = screen.getByTestId('switch-field-required');
          fireEvent.click(requiredSwitch);
        });

        // Step 4: Add result field
        const addResultButton = screen.getByTestId('button-add-result');
        fireEvent.click(addResultButton);

        // Step 5: Set formula
        const formulaTextarea = screen.getByTestId('textarea-formula');
        fireEvent.change(formulaTextarea, { target: { value: 'Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))' } });

        // Verify all components are present
        expect(screen.getByText('Birth Date')).toBeInTheDocument();
        expect(screen.queryAllByTestId(/^field-field_/)).toHaveLength(2);
        expect(formulaTextarea).toHaveValue(expect.stringContaining('birthDate'));
      });
    });
  });
});
