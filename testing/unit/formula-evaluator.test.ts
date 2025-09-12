
import { describe, it, expect } from 'vitest';

// Mock formula evaluator functions
const evaluateFormula = (formula: string, values: Record<string, any>): any => {
  // Date functions
  if (formula.includes('date(')) {
    const fieldMatch = formula.match(/date\((\w+)\)/);
    if (fieldMatch) {
      const fieldValue = values[fieldMatch[1]];
      return new Date(fieldValue);
    }
  }

  // Age calculation
  if (formula.includes('ageInYears(')) {
    const dateMatch = formula.match(/ageInYears\(date\((\w+)\)\)/);
    if (dateMatch) {
      const fieldValue = values[dateMatch[1]];
      const birthDate = new Date(fieldValue);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    }
  }

  // Basic arithmetic
  if (formula.includes('+')) {
    const parts = formula.split('+').map(part => {
      const trimmed = part.trim();
      return values[trimmed] || parseFloat(trimmed) || 0;
    });
    return parts.reduce((sum, val) => sum + val, 0);
  }

  if (formula.includes('*')) {
    const parts = formula.split('*').map(part => {
      const trimmed = part.trim();
      return values[trimmed] || parseFloat(trimmed) || 1;
    });
    return parts.reduce((product, val) => product * val, 1);
  }

  // Simple field reference
  return values[formula] || 0;
};

describe('Formula Evaluator', () => {
  describe('Date Functions', () => {
    it('should parse date correctly', () => {
      const result = evaluateFormula('date(birthDate)', { birthDate: '1990-01-01' });
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(1990);
    });

    it('should calculate age in years', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);
      
      const result = evaluateFormula('ageInYears(date(birthDate))', { 
        birthDate: birthDate.toISOString().split('T')[0] 
      });
      
      expect(result).toBe(30);
    });

    it('should handle age calculation with month consideration', () => {
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - 25, today.getMonth() + 1, today.getDate());
      
      const result = evaluateFormula('ageInYears(date(birthDate))', { 
        birthDate: birthDate.toISOString().split('T')[0] 
      });
      
      expect(result).toBe(24); // Should be 24 since birthday hasn't passed this year
    });
  });

  describe('Mathematical Operations', () => {
    it('should handle addition', () => {
      const result = evaluateFormula('field1 + field2', { field1: 10, field2: 20 });
      expect(result).toBe(30);
    });

    it('should handle multiplication', () => {
      const result = evaluateFormula('field1 * field2', { field1: 5, field2: 4 });
      expect(result).toBe(20);
    });

    it('should handle mixed operations with constants', () => {
      const result = evaluateFormula('field1 * 1.5', { field1: 100 });
      expect(result).toBe(150);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid dates gracefully', () => {
      const result = evaluateFormula('ageInYears(date(invalidDate))', { invalidDate: 'not-a-date' });
      expect(isNaN(result)).toBe(true);
    });

    it('should handle missing fields', () => {
      const result = evaluateFormula('missingField', {});
      expect(result).toBe(0);
    });
  });
});
