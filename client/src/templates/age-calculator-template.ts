
import type { Calculator } from '../../../shared/schema';

export const ageCalculatorTemplate: Calculator = {
  id: 'age-calculator-template',
  name: 'Age Calculator',
  description: 'Calculate your exact age in years, months, and days. Perfect for birthdays, age verification, or just curiosity!',
  formula: `
// Convert date strings to Date objects
const birthDate = new Date(field1);
const currentDate = field2 ? new Date(field2) : new Date();

// Validate dates
if (isNaN(birthDate.getTime())) {
  return 'Please enter a valid birth date';
}
if (isNaN(currentDate.getTime())) {
  return 'Please enter a valid current date';
}

// Calculate the difference in milliseconds
const diffInMs = currentDate - birthDate;

if (diffInMs < 0) {
  return 'Birth date cannot be in the future';
}

// Convert to different units
const ageInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
const ageInYears = Math.floor(ageInDays / 365.25); // Account for leap years
const ageInMonths = Math.floor((ageInDays % 365.25) / 30.44); // Average days per month
const remainingDays = ageInDays % Math.floor(30.44);

return \`\${ageInYears} years, \${ageInMonths} months, \${remainingDays} days\`;
  `,
  fields: [
    {
      id: 'field1',
      type: 'text',
      label: 'Birth Date',
      placeholder: 'MM/DD/YYYY',
      required: true,
      position: { x: 50, y: 50 }
    },
    {
      id: 'field2',
      type: 'text',
      label: 'Current Date (leave empty for today)',
      placeholder: 'MM/DD/YYYY',
      required: false,
      position: { x: 50, y: 150 }
    },
    {
      id: 'result1',
      type: 'result',
      label: 'Your Age',
      position: { x: 50, y: 250 }
    }
  ],
  userId: '',
  requiresPayment: false,
  price: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
