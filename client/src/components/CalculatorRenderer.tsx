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
  const [error, setError] = useState<string | null>(null); // State for displaying errors
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
    setError(null); // Clear error when input changes
  };

  const evaluateFormula = (formula: string, fieldValues: Record<string, any>) => {
    try {
      // Enhanced date helper functions for age calculations
      const dateHelpers = {
        // Current date functions
        today: () => new Date(),
        now: () => new Date(),

        // Date parsing functions
        date: (dateString: string) => {
          const parsed = new Date(dateString);
          if (isNaN(parsed.getTime())) {
            throw new Error(`Invalid date: ${dateString}`);
          }
          return parsed;
        },

        // Age calculation functions
        yearsBetween: (date1: Date, date2: Date) => {
          const older = date1 < date2 ? date1 : date2;
          const newer = date1 < date2 ? date2 : date1;

          let years = newer.getFullYear() - older.getFullYear();
          const monthDiff = newer.getMonth() - older.getMonth();

          if (monthDiff < 0 || (monthDiff === 0 && newer.getDate() < older.getDate())) {
            years--;
          }

          return years;
        },

        monthsBetween: (date1: Date, date2: Date) => {
          const older = date1 < date2 ? date1 : date2;
          const newer = date1 < date2 ? date2 : date1;

          let months = (newer.getFullYear() - older.getFullYear()) * 12;
          months += newer.getMonth() - older.getMonth();

          if (newer.getDate() < older.getDate()) {
            months--;
          }

          return months;
        },

        daysBetween: (date1: Date, date2: Date) => {
          const diffTime = Math.abs(date2.getTime() - date1.getTime());
          return Math.floor(diffTime / (24 * 60 * 60 * 1000));
        },

        // Age in specific units from birth date to today
        ageInYears: (birthDate: Date) => {
          return dateHelpers.yearsBetween(birthDate, new Date());
        },

        ageInMonths: (birthDate: Date) => {
          return dateHelpers.monthsBetween(birthDate, new Date());
        },

        ageInDays: (birthDate: Date) => {
          return dateHelpers.daysBetween(birthDate, new Date());
        },

        // Date component extraction
        getYear: (date: Date) => date.getFullYear(),
        getMonth: (date: Date) => date.getMonth() + 1, // 1-based month
        getDay: (date: Date) => date.getDate(),

        // Date formatting
        formatDate: (date: Date, format = 'MM/DD/YYYY') => {
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();

          return format
            .replace('MM', month)
            .replace('DD', day)
            .replace('YYYY', year.toString())
            .replace('YY', year.toString().slice(-2));
        },

        // Math functions for calculations
        Math: Math,
      };

      // Replace field IDs with their values in the formula
      let processedFormula = formula;

      Object.entries(fieldValues).forEach(([fieldId, value]) => {
        // Handle different value types properly
        let processedValue: string;
        if (typeof value === 'string' && value.trim() !== '') {
          // For date strings, wrap in quotes
          if (value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            processedValue = `"${value}"`;
          } else {
            const numValue = parseFloat(value);
            processedValue = isNaN(numValue) ? `"${value}"` : numValue.toString();
          }
        } else if (typeof value === 'number') {
          processedValue = value.toString();
        } else if (typeof value === 'boolean') {
          processedValue = value.toString();
        } else {
          processedValue = '""'; // Empty string for empty values
        }

        processedFormula = processedFormula.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), processedValue);
      });

      // Enhanced safety check - allow letters for function names and basic operators
      if (!/^[a-zA-Z0-9+\-*/.(),"' ]+$/.test(processedFormula)) {
        throw new Error('Invalid formula characters');
      }

      // Evaluate with safe context including date helpers
      const safeContext = {
        ...dateHelpers,
        console: undefined,
        window: undefined,
        document: undefined,
        eval: undefined,
        Function: undefined,
      };

      // Create function with safe context
      const contextKeys = Object.keys(safeContext);
      const contextValues = Object.values(safeContext);
      const evalFunction = new Function(...contextKeys, `"use strict"; return (${processedFormula})`);
      const result = evalFunction(...contextValues);

      // Handle different result types
      if (typeof result === 'string') return result;
      if (typeof result === 'number') return isNaN(result) ? 0 : result;
      if (result instanceof Date) return result.toLocaleDateString();

      return result?.toString() || 0;
    } catch (error) {
      console.error('Formula evaluation error:', error);
      setError('Error: ' + (error as Error).message); // Set error state
      return 'Error: ' + (error as Error).message;
    }
  };

  const handleCalculate = async () => {
    // Validate required fields
    const missingFields = calculator.fields
      .filter(field => field.required && !values[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(', ')}`); // Set error state
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
    setError(null); // Clear previous errors

    try {
      // Evaluate the formula
      const calculatedResult = evaluateFormula(calculator.formula || '', values);
      setResult(calculatedResult);

      // Track the calculation if it's a published calculator
      if (calculator.isPublished && calculator.id) {
        try {
          await apiRequest("POST", "/api/paypal/webhook", {
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
      const response = await apiRequest("POST", "/api/paypal/create-payment", {
        amount: calculator.price,
        calculatorId: calculator.id,
      });

      const { paymentId, approvalUrl } = await response.json();

      // Simulate successful payment for demo
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
            required={field.required} // Ensure required attribute is set
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
            required={field.required} // Ensure required attribute is set
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
          {calculator.fields?.map((field) => {
            if (field.type === 'result') return null;

            return (
              <div key={field.id} className="space-y-2">
                <Label 
                  htmlFor={field.id} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            );
          })}

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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {calculator.fields?.filter(f => f.type === 'result').map((field) => (
            <div 
              key={field.id}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <h3 className="font-semibold text-green-800 mb-2">{field.label}</h3>
              <div 
                className="text-2xl font-bold text-green-700"
                data-testid={`text-result`}
              >
                {result || '--'}
              </div>
            </div>
          ))}
        </div>

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