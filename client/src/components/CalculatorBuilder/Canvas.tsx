
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, field: CalculatorField) => {
    e.preventDefault();
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();
    
    if (!canvasRect) return;
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newCanvasRect = document.getElementById('canvas')?.getBoundingClientRect();
      if (!newCanvasRect) return;

      const newX = Math.max(0, Math.min(400, moveEvent.clientX - newCanvasRect.left - dragOffset.x));
      const newY = Math.max(0, Math.min(500, moveEvent.clientY - newCanvasRect.top - dragOffset.y));

      onFieldUpdate(field.id, {
        position: { x: newX, y: newY }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleFieldClick = (e: React.MouseEvent, field: CalculatorField) => {
    e.stopPropagation();
    onFieldSelect(field);
  };

  const handleCanvasClick = () => {
    onFieldSelect(null);
  };

  const renderField = (field: CalculatorField) => {
    const baseProps = {
      className: "w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent",
      placeholder: field.placeholder,
      'data-testid': `input-${field.id}`
    };

    switch (field.type) {
      case 'text':
        return <input type="text" {...baseProps} />;
      case 'number':
        return <input type="number" {...baseProps} min={field.validation?.min} max={field.validation?.max} />;
      case 'date':
        return <input type="date" {...baseProps} />;
      case 'select':
        return (
          <select {...baseProps} data-testid={`select-${field.id}`}>
            <option value="">Select an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded border-border focus:ring-2 focus:ring-primary" 
              data-testid={`checkbox-${field.id}`}
            />
            <span className="text-sm">{field.label}</span>
          </label>
        );
      case 'result':
        return (
          <div 
            className="bg-green-50 border border-green-200 rounded-md p-3 text-center min-h-12 flex items-center justify-center"
            data-testid={`result-${field.id}`}
          >
            <div>
              <div className="text-sm text-green-600 mb-1">Result</div>
              <div className="text-xl font-bold text-green-800" data-testid={`text-result-${field.id}`}>
                --
              </div>
            </div>
          </div>
        );
      default:
        return <div className="p-2 bg-gray-100 text-gray-500">Unknown field type: {field.type}</div>;
    }
  };

  return (
    <div 
      id="canvas" 
      className="relative h-full p-8 bg-background overflow-auto"
      onClick={handleCanvasClick}
      data-testid="canvas"
    >
      <div className="max-w-md mx-auto bg-card rounded-xl shadow-lg p-6 border border-border min-h-96 relative">
        <h3 className="text-xl font-bold mb-6 text-center text-card-foreground">
          Calculator Preview
        </h3>
        
        <div className="relative min-h-80">
          {fields.map((field) => (
            <div
              key={field.id}
              className={`absolute cursor-pointer transition-all duration-200 ${
                selectedField?.id === field.id 
                  ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' 
                  : 'hover:ring-1 hover:ring-gray-300'
              } ${isDragging ? 'pointer-events-none' : ''}`}
              style={{
                left: field.position.x,
                top: field.position.y,
                width: '240px',
                zIndex: selectedField?.id === field.id ? 10 : 1
              }}
              onMouseDown={(e) => handleMouseDown(e, field)}
              onClick={(e) => handleFieldClick(e, field)}
              data-testid={`field-${field.id}`}
            >
              <div className="p-2 rounded">
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
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 shadow-md z-20"
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
