import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { CalculatorField } from '@shared/schema';

interface CanvasProps {
  fields: CalculatorField[];
  selectedField: CalculatorField | null;
  onFieldSelect: (field: CalculatorField | null) => void;
  onFieldUpdate: (fieldId: string, updates: Partial<CalculatorField>) => void;
  onFieldDelete: (fieldId: string) => void;
}

export default function Canvas({ 
  fields, 
  selectedField, 
  onFieldSelect, 
  onFieldUpdate, 
  onFieldDelete 
}: CanvasProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, field: CalculatorField) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();
      if (!canvasRect) return;

      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top - dragOffset.y;

      onFieldUpdate(field.id, {
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderField = (field: CalculatorField) => {
    const baseProps = {
      className: "w-full px-3 py-2 border border-border rounded-md bg-background",
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'text':
        return <input type="text" {...baseProps} />;
      case 'number':
        return <input type="number" {...baseProps} />;
      case 'select':
        return (
          <select {...baseProps}>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded border-border" />
            <span>{field.label}</span>
          </label>
        );
      case 'result':
        return (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-center">
            <div className="text-sm text-green-600">Result</div>
            <div className="text-xl font-bold text-green-800">$0.00</div>
          </div>
        );
      default:
        return <div>Unknown field type</div>;
    }
  };

  return (
    <div id="canvas" className="relative h-full p-8 bg-background overflow-auto">
      <div className="max-w-md mx-auto bg-card rounded-xl shadow-lg p-6 border border-border min-h-96">
        <h3 className="text-xl font-bold mb-6 text-center text-card-foreground">
          Calculator Preview
        </h3>
        
        <div className="relative">
          {fields.map((field) => (
            <div
              key={field.id}
              className={`absolute cursor-move transition-all ${
                selectedField?.id === field.id ? 'ring-2 ring-primary' : ''
              }`}
              style={{
                left: field.position.x,
                top: field.position.y,
                width: '240px',
              }}
              onMouseDown={(e) => handleMouseDown(e, field)}
              onClick={() => onFieldSelect(field)}
              data-testid={`field-${field.id}`}
            >
              <div className="mb-4">
                {field.type !== 'checkbox' && field.type !== 'result' && (
                  <label className="block text-sm font-medium mb-2 text-card-foreground">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                {renderField(field)}
                
                {selectedField?.id === field.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFieldDelete(field.id);
                    }}
                    data-testid={`button-delete-field-${field.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {fields.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-lg mb-2">Start building your calculator</div>
              <div className="text-sm">Add components from the left panel</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
