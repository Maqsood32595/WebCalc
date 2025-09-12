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
      <div className="p-6">
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

  const handleAddOption = () => {
    const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
    handleUpdate({ options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = selectedField.options?.filter((_, i) => i !== index) || [];
    handleUpdate({ options: newOptions });
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...(selectedField.options || [])];
    newOptions[index] = value;
    handleUpdate({ options: newOptions });
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Field Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={selectedField.label}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              data-testid="input-field-label"
            />
          </div>

          {(selectedField.type === 'text' || selectedField.type === 'number') && (
            <div>
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={selectedField.placeholder || ''}
                onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                data-testid="input-field-placeholder"
              />
            </div>
          )}

          {selectedField.type !== 'result' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="field-required">Required</Label>
              <Switch
                id="field-required"
                checked={selectedField.required || false}
                onCheckedChange={(checked) => handleUpdate({ required: checked })}
                data-testid="switch-field-required"
              />
            </div>
          )}

          {selectedField.type === 'select' && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {selectedField.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => handleUpdateOption(index, e.target.value)}
                      data-testid={`input-option-${index}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      data-testid={`button-remove-option-${index}`}
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

          {selectedField.type === 'number' && (
            <>
              <div>
                <Label htmlFor="field-min">Min Value</Label>
                <Input
                  id="field-min"
                  type="number"
                  value={selectedField.validation?.min || ''}
                  onChange={(e) => handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  data-testid="input-field-min"
                />
              </div>
              <div>
                <Label htmlFor="field-max">Max Value</Label>
                <Input
                  id="field-max"
                  type="number"
                  value={selectedField.validation?.max || ''}
                  onChange={(e) => handleUpdate({
                    validation: {
                      ...selectedField.validation,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  data-testid="input-field-max"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
