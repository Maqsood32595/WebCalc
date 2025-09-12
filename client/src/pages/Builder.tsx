import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { DragDropProvider } from "@/components/CalculatorBuilder/DragDropContext";
import ComponentPalette from "@/components/CalculatorBuilder/ComponentPalette";
import Canvas from "@/components/CalculatorBuilder/Canvas";
import PropertiesPanel from "@/components/CalculatorBuilder/PropertiesPanel";
import CalculatorRenderer from "@/components/CalculatorRenderer";
import { ArrowLeft, Eye, Save, Share2 } from "lucide-react";
import type { Calculator, CalculatorField as Field } from "@shared/schema";
import { calculatorTemplates, loadTemplate } from '../lib/templates';

export default function Builder() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const calculatorId = params.id;

  const [calculator, setCalculator] = useState<Partial<Calculator>>({
    name: 'Untitled Calculator',
    description: '',
    fields: [],
    formula: '',
    isPublished: false,
    requiresPayment: false,
    price: 0,
  });

  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  // Load existing calculator if editing
  const { data: existingCalculator, isLoading } = useQuery({
    queryKey: ['/api/calculators', calculatorId],
    enabled: !!calculatorId && !!user,
    retry: false,
  });

  useEffect(() => {
    if (existingCalculator) {
      setCalculator(existingCalculator);
    }
  }, [existingCalculator]);

  const saveCalculatorMutation = useMutation({
    mutationFn: async (data: Partial<Calculator>) => {
      if (calculatorId) {
        const response = await apiRequest("PUT", `/api/calculators/${calculatorId}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/calculators", data);
        return response.json();
      }
    },
    onSuccess: (savedCalculator) => {
      queryClient.invalidateQueries({ queryKey: ['/api/calculators'] });
      toast({
        title: "Calculator saved",
        description: "Your calculator has been saved successfully.",
      });
      if (!calculatorId) {
        setLocation(`/builder/${savedCalculator.id}`);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save calculator.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveCalculatorMutation.mutate(calculator);
  };

  const handlePublish = () => {
    const updatedCalculator = { ...calculator, isPublished: !calculator.isPublished };
    setCalculator(updatedCalculator);
    saveCalculatorMutation.mutate(updatedCalculator);
  };

  const handleFieldAdd = (field: Field) => {
    // Find a good position for the new field
    const existingFields = calculator.fields || [];
    let yPosition = 20;

    if (existingFields.length > 0) {
      const maxY = Math.max(...existingFields.map(f => f.position.y));
      yPosition = maxY + 80; // Add some spacing
    }

    const newField: Field = {
      ...field,
      position: { x: 20, y: yPosition }
    };

    setCalculator(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));

    // Auto-select the new field
    setSelectedField(newField);
  };

  const handleFieldUpdate = (fieldId: string, updates: Partial<Field>) => {
    setCalculator(prev => ({
      ...prev,
      fields: (prev.fields || []).map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));

    // Update selected field if it's the one being updated
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleFieldDelete = (fieldId: string) => {
    setCalculator(prev => ({
      ...prev,
      fields: (prev.fields || []).filter(field => field.id !== fieldId)
    }));

    // Clear selection if deleted field was selected
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  const handleShare = () => {
    if (calculator.isPublished && calculatorId) {
      const url = `${window.location.origin}/public/${calculatorId}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Calculator URL copied to clipboard.",
      });
    } else {
      toast({
        title: "Publish first",
        description: "You need to publish the calculator before sharing.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || !user || (calculatorId && isLoading)) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(false)}
                data-testid="button-back-to-editor"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Editor
              </Button>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Calculator Preview</h1>
                <p className="text-muted-foreground">This is how your calculator will appear to users</p>
              </div>
              <div className="w-24"></div>
            </div>
            <div className="max-w-2xl mx-auto">
              <CalculatorRenderer calculator={calculator as Calculator} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <DragDropProvider>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          {/* Builder Header */}
          <div className="bg-muted px-6 py-4 border-b border-border">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="font-semibold text-card-foreground">{calculator.name}</h1>
                  <Badge variant={calculator.isPublished ? "default" : "secondary"}>
                    {calculator.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  data-testid="button-preview"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={saveCalculatorMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveCalculatorMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  className="gradient-secondary text-white hover:shadow-lg transition-all"
                  onClick={handlePublish}
                  disabled={saveCalculatorMutation.isPending}
                  data-testid="button-publish"
                >
                  {calculator.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Builder Content */}
          <div className="flex h-[calc(100vh-8rem)]">
            {/* Left Sidebar - Components & Settings */}
            <div className="w-80 bg-muted/50 border-r border-border overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Calculator Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Calculator Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="calc-name">Name</Label>
                      <Input
                        id="calc-name"
                        value={calculator.name}
                        onChange={(e) => setCalculator({...calculator, name: e.target.value})}
                        data-testid="input-calculator-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calc-description">Description</Label>
                      <Textarea
                        id="calc-description"
                        value={calculator.description || ''}
                        onChange={(e) => setCalculator({...calculator, description: e.target.value})}
                        data-testid="textarea-calculator-description"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requires-payment">Requires Payment</Label>
                      <Switch
                        id="requires-payment"
                        checked={calculator.requiresPayment || false}
                        onCheckedChange={(checked) => setCalculator({...calculator, requiresPayment: checked})}
                        data-testid="switch-requires-payment"
                      />
                    </div>
                    {calculator.requiresPayment && (
                      <div>
                        <Label htmlFor="price">Price (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={calculator.price ? calculator.price / 100 : 0}
                          onChange={(e) => setCalculator({...calculator, price: Math.round(parseFloat(e.target.value) * 100)})}
                          data-testid="input-price"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Template Section */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Templates</h3>
                  <div className="space-y-2">
                    {calculatorTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (user) {
                            const loadedTemplate = loadTemplate(template.id, user.id);
                            setCalculator(loadedTemplate);
                          }
                        }}
                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        data-testid={`template-${template.id}`}
                      >
                        <div className="font-medium text-sm text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                        <div className="text-xs text-blue-600 mt-1">{template.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Component Palette */}
                <ComponentPalette onFieldAdd={handleFieldAdd} />

                {/* Formula Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Formula Editor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Enter calculation formula..."
                      value={calculator.formula || ''}
                      onChange={(e) => setCalculator({...calculator, formula: e.target.value})}
                      className="font-mono text-sm"
                      rows={4}
                      data-testid="textarea-formula"
                    />
                    <div className="text-xs text-muted-foreground mt-2">
                      Use field IDs in your formula, e.g., field1 * field2 / 100
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 overflow-hidden">
              <Canvas
                fields={calculator.fields || []}
                selectedField={selectedField}
                onFieldSelect={setSelectedField}
                onFieldUpdate={handleFieldUpdate}
                onFieldDelete={handleFieldDelete}
              />
            </div>

            {/* Right Sidebar - Properties */}
            <div className="w-80 bg-muted/50 border-l border-border overflow-y-auto">
              <PropertiesPanel
                selectedField={selectedField}
                onFieldUpdate={handleFieldUpdate}
              />
            </div>
          </div>
        </main>
      </div>
    </DragDropProvider>
  );
}