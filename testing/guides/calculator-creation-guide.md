
# Step-by-Step Calculator Creation Guide

This guide walks you through creating different types of calculators using the Webcalc platform, based on successful test workflows.

## Getting Started

1. **Sign In**: Navigate to the platform and sign in with your account
2. **Access Builder**: Click "Builder" in the navigation menu
3. **Start Creating**: Begin with a blank calculator template

## Basic Calculator Types

### 1. Age Calculator

**Use Case**: Calculate someone's exact age from their birth date.

**Step-by-Step Process**:
1. **Set Basic Info**:
   - Name: "Age Calculator"
   - Description: "Calculate your exact age in years"

2. **Define Formula**:
   ```javascript
   ageInYears(date(birthDate))
   ```

3. **Add Fields**:
   - Input Field: `birthDate` (type: text, label: "Birth Date", placeholder: "MM/DD/YYYY")
   - Result Field: `result` (type: result, label: "Your Age in Years")

4. **Test the Calculator**:
   - Preview mode: Enter "01/01/1990"
   - Expected result: Current age (e.g., 34 years)

**Advanced Age Calculations**:
```javascript
// Age in months
ageInMonths(date(birthDate))

// Age in days
ageInDays(date(birthDate))

// Years between two dates
yearsBetween(date(startDate), date(endDate))
```

### 2. BMI Calculator

**Use Case**: Calculate Body Mass Index from weight and height.

**Step-by-Step Process**:
1. **Set Basic Info**:
   - Name: "BMI Calculator"
   - Description: "Calculate your Body Mass Index"

2. **Define Formula**:
   ```javascript
   weight / ((height / 100) * (height / 100))
   ```

3. **Add Fields**:
   - Input Field: `weight` (type: number, label: "Weight (kg)")
   - Input Field: `height` (type: number, label: "Height (cm)")
   - Result Field: `result` (type: result, label: "Your BMI")

4. **Test the Calculator**:
   - Weight: 70 kg
   - Height: 175 cm
   - Expected result: 22.86

### 3. Investment Calculator

**Use Case**: Calculate compound interest returns.

**Step-by-Step Process**:
1. **Set Basic Info**:
   - Name: "Investment Calculator"
   - Description: "Calculate compound interest returns"

2. **Define Formula**:
   ```javascript
   principal * Math.pow(1 + (rate / 100), years)
   ```

3. **Add Fields**:
   - Input Field: `principal` (type: number, label: "Initial Investment ($)")
   - Input Field: `rate` (type: number, label: "Annual Interest Rate (%)")
   - Input Field: `years` (type: number, label: "Investment Period (years)")
   - Result Field: `result` (type: result, label: "Final Amount ($)")

4. **Test the Calculator**:
   - Principal: $10,000
   - Rate: 5%
   - Years: 10
   - Expected result: $16,288.95

## Advanced Calculator Features

### Premium Calculators

**Setting Up Payment**:
1. Toggle "Requires Payment" switch
2. Set price (in dollars, e.g., "9.99")
3. Users will see payment dialog before calculation

**Payment Flow**:
1. User enters calculator data
2. Clicks "Calculate"
3. Payment dialog appears
4. After successful payment, calculation proceeds

### Formula Engine Capabilities

**Mathematical Functions**:
```javascript
Math.sqrt(number)          // Square root
Math.pow(base, exponent)   // Power
Math.PI                    // Pi constant
Math.abs(number)           // Absolute value
Math.round(number)         // Round to nearest integer
```

**Date Functions**:
```javascript
today()                    // Current date
date("MM/DD/YYYY")        // Parse date string
ageInYears(date)          // Age in years
ageInMonths(date)         // Age in months
ageInDays(date)           // Age in days
yearsBetween(date1, date2) // Years between dates
```

**Field References**:
- Use field IDs directly in formulas
- Example: `field1 + field2 * 0.1`

## Testing Your Calculators

### Manual Testing Process

1. **Preview Mode**: Click "Preview" button
2. **Enter Test Data**: Fill in sample values
3. **Calculate**: Click "Calculate" button
4. **Verify Results**: Check if output matches expected values

### Common Test Cases

**Age Calculator Tests**:
- Birth date: "01/01/1990" → Should show current age
- Birth date: "12/31/2000" → Should show correct age
- Invalid date: "invalid" → Should show error

**BMI Calculator Tests**:
- Weight: 70kg, Height: 175cm → BMI: 22.86
- Weight: 80kg, Height: 180cm → BMI: 24.69
- Edge cases: Very low/high values

**Investment Calculator Tests**:
- $1000, 5%, 1 year → $1050
- $10000, 7%, 10 years → $19,671.51

## Troubleshooting Common Issues

### Formula Errors
```javascript
// ❌ Wrong: Using undefined variables
unknownField + 10

// ✅ Correct: Using defined field IDs
weight + 10
```

### Date Parsing Issues
```javascript
// ❌ Wrong: Direct date usage
new Date(birthDate)

// ✅ Correct: Using date helper
date(birthDate)
```

### Missing Field Validation
- Always validate required fields
- Provide clear error messages
- Use appropriate input types (number, text, etc.)

## Best Practices

### User Experience
1. **Clear Labels**: Use descriptive field labels
2. **Helpful Placeholders**: Show expected format
3. **Validation**: Mark required fields
4. **Error Handling**: Show meaningful error messages

### Formula Design
1. **Keep It Simple**: Start with basic formulas
2. **Test Thoroughly**: Verify with multiple inputs
3. **Handle Edge Cases**: Division by zero, negative numbers
4. **Use Comments**: Document complex formulas

### Performance
1. **Optimize Complex Calculations**: Break down into steps
2. **Validate Inputs**: Check for valid ranges
3. **Provide Feedback**: Show loading states for complex calculations

## Example Calculator Templates

### Loan Payment Calculator
```javascript
// Monthly payment formula
principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)

// Where:
// principal = loan amount
// monthlyRate = annual rate / 12
// numPayments = years * 12
```

### Tip Calculator
```javascript
// Total with tip
billAmount * (1 + tipPercent / 100)

// Tip amount only
billAmount * (tipPercent / 100)
```

### Unit Conversion Calculator
```javascript
// Celsius to Fahrenheit
celsius * 9/5 + 32

// Kilometers to Miles
kilometers * 0.621371
```

This guide provides a comprehensive foundation for creating robust, tested calculators on the Webcalc platform. Each calculator type has been validated through automated tests to ensure reliability and user experience.
