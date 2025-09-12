
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { CalculatorField } from '@shared/schema';

interface PropertiesPanelProps {
  selectedField: CalculatorField | null;
  onFieldUpdate: (fieldId: string, updates: Partial<CalculatorField>) => void;
}

export default function PropertiesPanel({ selectedField, onFieldUpdate }: PropertiesPanelProps) {
  if (!selectedField) {
    return (
      <div className="p-6" data-testid="properties-panel-empty">
        <div className="text-center text-muted-foreground">
          <div className="text-lg mb-2">No field selected</div>
          <div className="text-sm">Click on a field to edit its properties</div>
        </div>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<CalculatorField>) => {
    onFieldUpdate(selectedField.id, updates);
  };

  const handleLabelChange = (value: string) => {
    handleUpdate({ label: value });
  };

  const handlePlaceholderChange = (value: string) => {
    handleUpdate({ placeholder: value });
  };

  const handleRequiredToggle = (checked: boolean) => {
    handleUpdate({ required: checked });
  };

  const handleAddOption = () => {
    const currentOptions = selectedField.options || [];
    const newOptions = [...currentOptions, `Option ${currentOptions.length + 1}`];
    handleUpdate({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = selectedField.options || [];
    const newOptions = currentOptions.filter((_, i) => i !== index);
    handleUpdate({ options: newOptions });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const currentOptions = selectedField.options || [];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    handleUpdate({ options: newOptions });
  };

  const handleValidationChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    const currentValidation = selectedField.validation || {};
    
    handleUpdate({
      validation: {
        ...currentValidation,
        [type]: numValue
      }
    });
  };

  return (
    <div className="p-6" data-testid="properties-panel">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Field Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Label */}
          <div>
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={selectedField.label || ''}
              onChange={(e) => handleLabelChange(e.target.value)}
              data-testid="input-field-label"
              placeholder="Enter field label"
            />
          </div>

          {/* Placeholder for input fields */}
          {(selectedField.type === 'text' || selectedField.type === 'number' || selectedField.type === 'date') && (
            <div>
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={selectedField.placeholder || ''}
                onChange={(e) => handlePlaceholderChange(e.target.value)}
                data-testid="input-field-placeholder"
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          {/* Required toggle for non-result fields */}
          {selectedField.type !== 'result' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="field-required" className="text-sm font-medium">
                Required Field
              </Label>
              <Switch
                id="field-required"
                checked={selectedField.required || false}
                onCheckedChange={handleRequiredToggle}
                data-testid="switch-field-required"
              />
            </div>
          )}

          {/* Options for select fields */}
          {selectedField.type === 'select' && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Options</Label>
              <div className="space-y-2">
                {(selectedField.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      data-testid={`input-option-${index}`}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      data-testid={`button-remove-option-${index}`}
                      disabled={(selectedField.options || []).length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full"
                  data-testid="button-add-option"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Validation for number fields */}
          {selectedField.type === 'number' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="field-min">Minimum Value</Label>
                <Input
                  id="field-min"
                  type="number"
                  value={selectedField.validation?.min || ''}
                  onChange={(e) => handleValidationChange('min', e.target.value)}
                  data-testid="input-field-min"
                  placeholder="No minimum"
                />
              </div>
              <div>
                <Label htmlFor="field-max">Maximum Value</Label>
                <Input
                  id="field-max"
                  type="number"
                  value={selectedField.validation?.max || ''}
                  onChange={(e) => handleValidationChange('max', e.target.value)}
                  data-testid="input-field-max"
                  placeholder="No maximum"
                />
              </div>
            </div>
          )}

          {/* Field ID for reference */}
          <div className="pt-4 border-t">
            <Label className="text-xs text-muted-foreground">Field ID</Label>
            <div className="text-xs font-mono text-muted-foreground mt-1 p-2 bg-muted rounded">
              {selectedField.id}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
