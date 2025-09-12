
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  Hash, 
  List, 
  CheckSquare, 
  Calculator,
  Calendar,
  DollarSign
} from "lucide-react";
import type { CalculatorField } from '@shared/schema';

interface ComponentPaletteProps {
  onFieldAdd: (field: CalculatorField) => void;
}

const fieldTypes = [
  {
    type: 'text' as const,
    label: 'Text Input',
    icon: Type,
    description: 'Single line text input'
  },
  {
    type: 'number' as const,
    label: 'Number Input',
    icon: Hash,
    description: 'Numeric input field'
  },
  {
    type: 'select' as const,
    label: 'Dropdown',
    icon: List,
    description: 'Dropdown selection'
  },
  {
    type: 'checkbox' as const,
    label: 'Checkbox',
    icon: CheckSquare,
    description: 'Boolean checkbox'
  },
  {
    type: 'date' as const,
    label: 'Date Input',
    icon: Calendar,
    description: 'Date picker field'
  },
  {
    type: 'result' as const,
    label: 'Result Display',
    icon: Calculator,
    description: 'Display calculation result'
  }
];

export default function ComponentPalette({ onFieldAdd }: ComponentPaletteProps) {
  const createField = (type: CalculatorField['type']) => {
    const baseField: Partial<CalculatorField> = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: getDefaultLabel(type),
      required: false,
      position: { x: 20, y: 20 }
    };

    // Add type-specific properties
    const field: CalculatorField = {
      ...baseField,
      ...(type === 'select' ? { options: ['Option 1', 'Option 2'] } : {}),
      ...(type === 'text' || type === 'number' || type === 'date' ? { placeholder: getDefaultPlaceholder(type) } : {}),
      ...(type === 'number' ? { validation: { min: undefined, max: undefined } } : {})
    } as CalculatorField;

    onFieldAdd(field);
  };

  const getDefaultLabel = (type: string): string => {
    switch (type) {
      case 'text': return 'Text Field';
      case 'number': return 'Number Field';
      case 'select': return 'Dropdown Field';
      case 'checkbox': return 'Checkbox Field';
      case 'date': return 'Date Field';
      case 'result': return 'Result';
      default: return 'Field';
    }
  };

  const getDefaultPlaceholder = (type: string): string => {
    switch (type) {
      case 'text': return 'Enter text...';
      case 'number': return 'Enter number...';
      case 'date': return 'MM/DD/YYYY';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Components</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fieldTypes.map((fieldType) => {
            const Icon = fieldType.icon;
            return (
              <Button
                key={fieldType.type}
                variant="outline"
                className="w-full justify-start h-auto p-3"
                onClick={() => createField(fieldType.type)}
                data-testid={`button-add-${fieldType.type}`}
              >
                <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">{fieldType.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {fieldType.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
