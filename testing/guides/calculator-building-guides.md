
# Calculator Building Guides

## Age Calculator Guide

### Prerequisites
- Authenticated user account
- Access to the calculator builder

### Step-by-Step Instructions

#### 1. Create New Calculator
1. Navigate to `/builder`
2. Enter calculator name: "Age Calculator"
3. Add description: "Calculate your exact age in years, months, and days"

#### 2. Set Up Fields
1. Add input field:
   - Type: `text`
   - Label: "Birth Date"
   - Placeholder: "MM/DD/YYYY"
   - Required: `true`
   - Field ID: `birthDate`

2. Add result field:
   - Type: `result`
   - Label: "Your Age"
   - Field ID: `result`

#### 3. Configure Formula
```javascript
ageInYears(date(birthDate))
```

#### 4. Test Calculator
1. Click "Preview"
2. Enter test date: "01/01/1990"
3. Click "Calculate"
4. Verify result shows correct age

#### 5. Publish Calculator
1. Return to editor
2. Click "Publish"
3. Verify status changes to "Published"

---

## BMI Calculator Guide

### Step-by-Step Instructions

#### 1. Create New Calculator
1. Navigate to `/builder`
2. Enter calculator name: "BMI Calculator"
3. Add description: "Calculate your Body Mass Index"

#### 2. Set Up Fields
1. Weight field:
   - Type: `number`
   - Label: "Weight (lbs)"
   - Field ID: `weight`
   - Required: `true`

2. Height field:
   - Type: `number`
   - Label: "Height (inches)"
   - Field ID: `height`
   - Required: `true`

3. Result field:
   - Type: `result`
   - Label: "Your BMI"
   - Field ID: `result`

#### 3. Configure Formula
```javascript
(weight * 703) / (height * height)
```

#### 4. Test and Publish
Follow steps 4-5 from Age Calculator guide

---

## Mortgage Calculator Guide

### Step-by-Step Instructions

#### 1. Create New Calculator
1. Navigate to `/builder`
2. Enter calculator name: "Mortgage Calculator"
3. Add description: "Calculate monthly mortgage payments"

#### 2. Set Up Fields
1. Loan Amount:
   - Type: `number`
   - Label: "Loan Amount ($)"
   - Field ID: `loanAmount`

2. Interest Rate:
   - Type: `number`
   - Label: "Interest Rate (%)"
   - Field ID: `interestRate`

3. Loan Term:
   - Type: `number`
   - Label: "Loan Term (years)"
   - Field ID: `loanTerm`

4. Result:
   - Type: `result`
   - Label: "Monthly Payment"
   - Field ID: `result`

#### 3. Configure Formula
```javascript
(loanAmount * (interestRate/100/12) * Math.pow(1 + interestRate/100/12, loanTerm*12)) / (Math.pow(1 + interestRate/100/12, loanTerm*12) - 1)
```

#### 4. Enable Premium Features (Optional)
1. Toggle "Requires Payment"
2. Set price: "$2.99"
3. Save configuration

---

## Premium Calculator Setup

### Making Any Calculator Premium

#### 1. Enable Payment
1. In calculator settings, toggle "Requires Payment"
2. Set price (e.g., "$5.00")
3. Add premium description

#### 2. PayPal Integration
- Payment processing handled automatically
- Users see payment dialog before calculation
- Access granted after successful payment

#### 3. Testing Premium Features
1. Preview calculator
2. Enter test data
3. Click calculate
4. Verify payment dialog appears
5. Test payment flow

---

## Best Practices

### Formula Writing
1. Use clear field IDs
2. Test formulas with various inputs
3. Handle edge cases (division by zero, etc.)
4. Use built-in functions when available

### Field Setup
1. Use descriptive labels
2. Set appropriate field types
3. Mark required fields
4. Add helpful placeholders

### Testing Workflow
1. Always preview before publishing
2. Test with edge cases
3. Verify calculations manually
4. Test payment flow for premium calculators

### Error Handling
1. Validate user inputs
2. Provide clear error messages
3. Handle calculation errors gracefully
4. Test with invalid data
