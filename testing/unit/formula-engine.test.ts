
import { describe, it, expect } from 'vitest';

// Enhanced formula evaluator for robust testing
const evaluateFormula = (formula: string, fieldValues: Record<string, any>) => {
  const dateHelpers = {
    today: () => new Date(),
    now: () => new Date(),
    date: (dateString: string) => {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid date: ${dateString}`);
      }
      return parsed;
    },
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
      const timeDiff = Math.abs(date2.getTime() - date1.getTime());
      return Math.ceil(timeDiff / (1000 * 3600 * 24));
    },
    ageInYears: (birthDate: Date) => {
      return dateHelpers.yearsBetween(birthDate, new Date());
    },
    ageInMonths: (birthDate: Date) => {
      return dateHelpers.monthsBetween(birthDate, new Date());
    },
    ageInDays: (birthDate: Date) => {
      return dateHelpers.daysBetween(birthDate, new Date());
    },
    Math: Math,
  };

  try {
    let processedFormula = formula;
    
    Object.entries(fieldValues).forEach(([fieldId, value]) => {
      let processedValue: string;
      if (typeof value === 'string' && value.trim() !== '') {
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
        processedValue = '0';
      }
      
      processedFormula = processedFormula.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), processedValue);
    });

    const safeContext = {
      ...dateHelpers,
      console: undefined,
      window: undefined,
      document: undefined,
      eval: undefined,
      Function: undefined,
    };

    const contextKeys = Object.keys(safeContext);
    const contextValues = Object.values(safeContext);
    const evalFunction = new Function(...contextKeys, `"use strict"; return (${processedFormula})`);
    const result = evalFunction(...contextValues);
    
    if (typeof result === 'string') return result;
    if (typeof result === 'number') return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    if (result instanceof Date) return result.toLocaleDateString();
    
    return result?.toString() || 0;
  } catch (error) {
    return 'Error: ' + (error as Error).message;
  }
};

describe('Enhanced Formula Engine', () => {
  describe('Basic arithmetic operations', () => {
    it('handles addition correctly', () => {
      expect(evaluateFormula('weight + height', { weight: 70, height: 175 })).toBe(245);
    });

    it('handles multiplication for BMI calculation', () => {
      const bmi = evaluateFormula('weight / ((height / 100) * (height / 100))', { weight: 70, height: 175 });
      expect(bmi).toBeCloseTo(22.86, 2);
    });

    it('handles complex mathematical expressions', () => {
      expect(evaluateFormula('Math.sqrt(field1 * field2)', { field1: 16, field2: 25 })).toBe(20);
    });
  });

  describe('Date calculations', () => {
    it('calculates age in years accurately', () => {
      const result = evaluateFormula('ageInYears(date(birthDate))', { birthDate: '01/01/1990' });
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(30);
    });

    it('calculates age in months', () => {
      const result = evaluateFormula('ageInMonths(date(birthDate))', { birthDate: '01/01/2020' });
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(40);
    });

    it('calculates days between dates', () => {
      const result = evaluateFormula('daysBetween(date("01/01/2020"), date("01/02/2020"))', {});
      expect(result).toBe(1);
    });

    it('handles various date formats', () => {
      expect(evaluateFormula('ageInYears(date(birthDate1))', { birthDate1: '1990-01-01' })).toBeGreaterThan(30);
      expect(evaluateFormula('ageInYears(date(birthDate2))', { birthDate2: '01/01/1990' })).toBeGreaterThan(30);
    });
  });

  describe('Error handling', () => {
    it('handles invalid dates gracefully', () => {
      const result = evaluateFormula('ageInYears(date(invalidDate))', { invalidDate: 'not-a-date' });
      expect(result).toContain('Error:');
    });

    it('handles division by zero', () => {
      const result = evaluateFormula('field1 / field2', { field1: 10, field2: 0 });
      expect(result).toBe(Infinity);
    });

    it('handles missing variables', () => {
      const result = evaluateFormula('missingField + 10', {});
      expect(result).toBe(10);
    });
  });

  describe('Complex calculator scenarios', () => {
    it('BMI calculator with classification', () => {
      const weight = 70;
      const height = 175;
      const bmi = evaluateFormula('weight / ((height / 100) * (height / 100))', { weight, height });
      expect(bmi).toBeCloseTo(22.86, 2);
    });

    it('Loan payment calculator', () => {
      const principal = 100000;
      const rate = 0.05;
      const years = 30;
      const monthlyRate = rate / 12;
      const numPayments = years * 12;
      
      const payment = evaluateFormula(
        'principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)',
        { principal, monthlyRate, numPayments }
      );
      expect(payment).toBeCloseTo(536.82, 2);
    });

    it('Compound interest calculator', () => {
      const principal = 1000;
      const rate = 0.05;
      const time = 10;
      const compound = 12;
      
      const amount = evaluateFormula(
        'principal * Math.pow(1 + (rate / compound), compound * time)',
        { principal, rate, time, compound }
      );
      expect(amount).toBeCloseTo(1643.62, 2);
    });
  });
});
