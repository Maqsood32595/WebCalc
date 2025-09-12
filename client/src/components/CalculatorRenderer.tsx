import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calculator, CreditCard, Lock } from "lucide-react";
import type { Calculator as CalculatorType, CalculatorField } from "@shared/schema";

interface CalculatorRendererProps {
  calculator: CalculatorType;
}

export default function CalculatorRenderer({ calculator }: CalculatorRendererProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [result, setResult] = useState<string | number>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Initialize default values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    calculator.fields.forEach(field => {
      if (field.type === 'checkbox') {
        initialValues[field.id] = false;
      } else if (field.type === 'number') {
        initialValues[field.id] = 0;
      } else {
        initialValues[field.id] = '';
      }
    });
    setValues(initialValues);
  }, [calculator.fields]);

  const handleInputChange = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const evaluateFormula = (formula: string, fieldValues: Record<string, any>) => {
    try {
      // Replace field IDs with their values in the formula
      let processedFormula = formula;
      
      Object.entries(fieldValues).forEach(([fieldId, value]) => {
        const numValue = parseFloat(value) || 0;
        processedFormula = processedFormula.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), numValue.toString());
      });

      // Basic math operations safety check
      if (!/^[0-9+\-*/.() ]+$/.test(processedFormula)) {
        throw new Error('Invalid formula characters');
      }

      // Evaluate the expression
      // Note: In production, you'd want to use a proper math expression parser for security
      const result = Function(`"use strict"; return (${processedFormula})`)();
      
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return 'Error';
    }
  };

  const handleCalculate = async () => {
    // Validate required fields
    const missingFields = calculator.fields
      .filter(field => field.required && !values[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Check if payment is required
    if (calculator.requiresPayment && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this calculator.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }

    if (calculator.requiresPayment && calculator.price && calculator.price > 0) {
      setShowPayment(true);
      return;
    }

    await performCalculation();
  };

  const performCalculation = async () => {
    setIsCalculating(true);
    
    try {
      // Evaluate the formula
      const calculatedResult = evaluateFormula(calculator.formula || '', values);
      setResult(calculatedResult);

      // Track the calculation if it's a published calculator
      if (calculator.isPublished && calculator.id) {
        try {
          await apiRequest("POST", "/api/stripe/webhook", {
            type: 'calculator_usage',
            data: {
              object: {
                metadata: {
                  calculatorId: calculator.id
                }
              }
            }
          });
        } catch (error) {
          // Don't show error to user for tracking failures
          console.error('Failed to track usage:', error);
        }
      }

      toast({
        title: "Calculation complete",
        description: "Your result has been calculated successfully.",
      });
    } catch (error) {
      toast({
        title: "Calculation error",
        description: "There was an error calculating your result.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePayment = async () => {
    if (!calculator.price) return;

    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: calculator.price,
        calculatorId: calculator.id,
      });
      
      const { clientSecret } = await response.json();
      
      // In a real implementation, you would redirect to a proper Stripe checkout
      // For now, we'll simulate successful payment
      toast({
        title: "Payment processed",
        description: "Payment successful! Calculating your result...",
      });
      
      setShowPayment(false);
      await performCalculation();
      
    } catch (error) {
      if (isUnauthorizedError(error as Error)) {
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
        title: "Payment failed",
        description: "There was an error processing your payment.",
        variant: "destructive",
      });
    }
  };

  const renderField = (field: CalculatorField) => {
    const value = values[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            data-testid={`input-${field.id}`}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value}
            min={field.validation?.min}
            max={field.validation?.max}
            onChange={(e) => handleInputChange(field.id, parseFloat(e.target.value) || 0)}
            data-testid={`input-${field.id}`}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            data-testid={`select-${field.id}`}
          >
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
              checked={value}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="rounded border-border focus:ring-2 focus:ring-primary"
              data-testid={`checkbox-${field.id}`}
            />
            <span>{field.label}</span>
          </label>
        );
      
      case 'result':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-sm text-green-600 font-medium mb-1">{field.label}</div>
            <div className="text-2xl font-bold text-green-800" data-testid="text-result">
              {typeof result === 'number' ? 
                (result % 1 === 0 ? result.toString() : result.toFixed(2)) : 
                result || '—'
              }
            </div>
          </div>
        );
      
      default:
        return <div>Unknown field type: {field.type}</div>;
    }
  };

  if (showPayment) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Premium Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="text-3xl font-bold text-primary">
            ${(calculator.price! / 100).toFixed(2)}
          </div>
          <p className="text-muted-foreground">
            This calculator requires a one-time payment to access the results.
          </p>
          <div className="space-y-2">
            <Button 
              className="w-full gradient-primary text-white"
              onClick={handlePayment}
              data-testid="button-pay-now"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowPayment(false)}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Calculator className="w-6 h-6 text-primary" />
          <CardTitle className="text-2xl font-bold">{calculator.name}</CardTitle>
        </div>
        {calculator.description && (
          <p className="text-muted-foreground">{calculator.description}</p>
        )}
        <div className="flex justify-center space-x-2">
          {calculator.requiresPayment && (
            <Badge variant="secondary" className="text-amber-600">
              <Lock className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
          {calculator.template && (
            <Badge variant="outline">{calculator.template}</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {calculator.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {field.type !== 'checkbox' && field.type !== 'result' && (
                <Label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              )}
              {renderField(field)}
            </div>
          ))}
        </div>

        {calculator.fields.some(f => f.type !== 'result') && (
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full gradient-primary text-white hover:shadow-lg transition-all py-3 text-lg font-semibold"
            data-testid="button-calculate"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </>
            )}
          </Button>
        )}

        {/* Webcalc branding for free tier */}
        {!user || (user as any).subscriptionStatus === 'free' ? (
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Powered by{' '}
              <a 
                href="/" 
                className="text-primary hover:underline font-semibold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Webcalc
              </a>
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
