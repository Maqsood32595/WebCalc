import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Type, Hash, List, CheckSquare, Calculator } from "lucide-react";
import type { CalculatorField } from '@shared/schema';

interface ComponentPaletteProps {
  onFieldAdd: (field: CalculatorField) => void;
}

const componentTypes = [
  {
    type: 'text' as const,
    label: 'Text Input',
    icon: Type,
    defaultProps: {
      label: 'Text Field',
      placeholder: 'Enter text...',
      required: false,
    }
  },
  {
    type: 'number' as const,
    label: 'Number Input',
    icon: Hash,
    defaultProps: {
      label: 'Number Field',
      placeholder: 'Enter number...',
      required: false,
    }
  },
  {
    type: 'select' as const,
    label: 'Select Dropdown',
    icon: List,
    defaultProps: {
      label: 'Select Field',
      required: false,
      options: ['Option 1', 'Option 2', 'Option 3'],
    }
  },
  {
    type: 'checkbox' as const,
    label: 'Checkbox',
    icon: CheckSquare,
    defaultProps: {
      label: 'Checkbox Field',
      required: false,
    }
  },
  {
    type: 'result' as const,
    label: 'Result Display',
    icon: Calculator,
    defaultProps: {
      label: 'Result',
    }
  },
];

export default function ComponentPalette({ onFieldAdd }: ComponentPaletteProps) {
  const handleComponentClick = (component: typeof componentTypes[0]) => {
    const newField: CalculatorField = {
      id: Date.now().toString(),
      type: component.type,
      ...component.defaultProps,
      position: { x: 0, y: 0 },
    };
    onFieldAdd(newField);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Components</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {componentTypes.map((component) => {
          const IconComponent = component.icon;
          return (
            <div
              key={component.type}
              className="drag-item bg-card p-3 rounded-lg border border-border cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleComponentClick(component)}
              data-testid={`component-${component.type}`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{component.label}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
