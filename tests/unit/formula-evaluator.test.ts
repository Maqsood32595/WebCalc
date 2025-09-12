
import { describe, it, expect } from 'vitest';

// Extract the evaluateFormula function for testing
const evaluateFormula = (formula: string, fieldValues: Record<string, any>) => {
  // Date helper functions for age calculations
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
    ageInYears: (birthDate: Date) => {
      return dateHelpers.yearsBetween(birthDate, new Date());
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
        processedValue = '""';
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
    if (typeof result === 'number') return isNaN(result) ? 0 : result;
    if (result instanceof Date) return result.toLocaleDateString();
    
    return result?.toString() || 0;
  } catch (error) {
    return 'Error: ' + (error as Error).message;
  }
};

describe('Formula Evaluator', () => {
  it('calculates basic math operations', () => {
    expect(evaluateFormula('field1 + field2', { field1: 10, field2: 5 })).toBe(15);
    expect(evaluateFormula('field1 * field2', { field1: 10, field2: 5 })).toBe(50);
    expect(evaluateFormula('field1 / field2', { field1: 10, field2: 2 })).toBe(5);
  });

  it('calculates age in years', () => {
    const result = evaluateFormula('ageInYears(date(field1))', { field1: '01/01/1990' });
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(30);
  });

  it('calculates years between dates', () => {
    const result = evaluateFormula('yearsBetween(date("01/01/1990"), date("01/01/2000"))', {});
    expect(result).toBe(10);
  });

  it('handles invalid dates gracefully', () => {
    const result = evaluateFormula('ageInYears(date(field1))', { field1: 'invalid-date' });
    expect(result).toContain('Error:');
  });

  it('handles missing fields', () => {
    const result = evaluateFormula('field1 + field2', { field1: 10 });
    expect(result).toBe(10); // field2 defaults to empty string, which becomes 0
  });
});
