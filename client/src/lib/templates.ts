
import type { Calculator } from '../../../shared/schema';
import { ageCalculatorTemplate } from '../templates/age-calculator-template';

export interface CalculatorTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Calculator;
}

export const calculatorTemplates: CalculatorTemplate[] = [
  {
    id: 'age-calculator',
    name: 'Age Calculator',
    description: 'Calculate exact age in years, months, and days',
    category: 'Date & Time',
    template: ageCalculatorTemplate
  }
];

export const getTemplateById = (id: string): CalculatorTemplate | undefined => {
  return calculatorTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): CalculatorTemplate[] => {
  return calculatorTemplates.filter(template => template.category === category);
};

export const loadTemplate = (templateId: string, userId: string): Calculator => {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template with id "${templateId}" not found`);
  }

  // Create a new calculator from the template
  return {
    ...template.template,
    id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
