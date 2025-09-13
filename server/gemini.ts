import { GoogleGenerativeAI } from "@google/generative-ai";
import { insertCalculatorSchema } from "@shared/schema";
import type { InsertCalculator, CalculatorField } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Using Gemini integration blueprint for calculator creation assistance
// Note that the newest Gemini model series is "gemini-2.0-flash-exp" 

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GeminiChatResponse {
  response: string;
  calculatorData?: Partial<InsertCalculator>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  calculatorData?: Partial<InsertCalculator>;
}

export async function generateCalculatorFromPrompt(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<ChatResponse> {
  try {
    // Create a comprehensive prompt for calculator generation
    const systemPrompt = `You are an AI assistant specialized in helping users create calculators. Your job is to understand what type of calculator the user wants and provide:

1. A helpful conversational response
2. If the user is requesting a specific calculator, also provide structured calculator data

When providing calculator data, you should include:
- name: A clear, descriptive name for the calculator
- description: A brief description of what it calculates
- fields: An array of input fields with proper types and configurations
- formula: A JavaScript expression that calculates the result
- template: A category identifier (e.g., 'financial', 'health', 'math', 'conversion')

Field types available: 'text', 'number', 'select', 'checkbox', 'result'
Each field should have:
- id: unique identifier
- type: field type
- label: display label
- required: boolean (optional)
- placeholder: hint text (optional)
- options: array of strings for select fields (optional)
- position: {x: number, y: number} for layout (optional, default to incremental positions)

For formulas, use field IDs as variables. Example: "fieldId1 * fieldId2 / 100"

Common calculator types and their patterns:
- BMI Calculator: weight, height inputs → weight / (height^2)
- Mortgage Calculator: principal, rate, term → monthly payment formula
- Age Calculator: birthdate → age calculation
- Tax Calculator: income, rate → tax amount
- Unit Converters: input value, conversion factor
- ROI Calculator: initial investment, final value, time → ROI percentage

Respond conversationally first, then if appropriate, provide calculator specifications.`;

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-5) // Keep last 5 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}

Conversation history:
${conversationContext}

Current user message: ${userMessage}

Please respond conversationally and if the user is asking for a calculator to be created, also provide the calculator specification in a structured way.`;

    let responseText = "I'm sorry, I couldn't process that request.";

    try {
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const response = await model.generateContent(fullPrompt);

      responseText = response.response.text() || "I'm sorry, I couldn't process that request.";
    } catch (error) {
      console.error("Error generating conversational response:", error);
    }

    // Try to extract calculator data if the response seems to include specifications
    let calculatorData: Partial<InsertCalculator> | undefined;

    // Use a second call to generate structured calculator data if it seems like the user wants a calculator
    if (isCalculatorRequest(userMessage)) {
      console.log("Attempting to generate structured calculator data for:", userMessage);

      // First, try the structured approach with retry logic
      let structuredAttempts = 0;
      const maxStructuredAttempts = 2;

      while (structuredAttempts < maxStructuredAttempts && !calculatorData) {
        try {
          const structuredPrompt = `Based on this user request: "${userMessage}"

Create a calculator specification in JSON format with this exact structure:
{
  "name": "Calculator Name",
  "description": "Brief description",
  "template": "category",
  "fields": [
    {
      "id": "uniqueId1",
      "type": "number",
      "label": "Input Label",
      "required": true,
      "placeholder": "Enter value",
      "position": {"x": 0, "y": 0}
    }
  ],
  "formula": "mathematical expression using field IDs"
}

Make sure all field IDs are used in the formula. Use realistic field names and calculations.
If the user is asking for a mortgage calculator, use the following formula structure as a reference, ensuring the correct JavaScript syntax:
monthly_payment = principal * (rate_per_month) / (1 - (1 + rate_per_month) ^ -(term_in_months))
Ensure the formula uses the correct JavaScript syntax for exponentiation (Math.pow).`;

          const model = ai.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
              responseMimeType: "application/json"
            }
          });
          const structuredResponse = await model.generateContent(structuredPrompt);

          console.log("Structured response received, text available:", !!structuredResponse.text);

          const responseText = structuredResponse.response.text();
          if (responseText) {
            console.log("Raw JSON response from Gemini:", responseText);

            // Robust JSON extraction - find first complete JSON block
            const trimmedText = responseText.trim();
            let parsedData: any = null;

            // Try to extract JSON from response
            const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedData = JSON.parse(jsonMatch[0]);
              } catch (parseError) {
                console.log("Failed to parse extracted JSON:", parseError);
                // Try parsing the entire response
                parsedData = JSON.parse(trimmedText);
              }
            } else {
              parsedData = JSON.parse(trimmedText);
            }

            // Validate and format the calculator data
            if (parsedData.name && parsedData.fields && Array.isArray(parsedData.fields)) {
              const formattedFields = parsedData.fields.map((field: any, index: number) => ({
                id: field.id || `field_${index}`,
                type: field.type || "text",
                label: field.label || `Field ${index + 1}`,
                required: field.required !== false,
                placeholder: field.placeholder,
                options: field.options,
                position: field.position || { x: index * 200, y: index * 80 }
              }));

              const candidateData = {
                name: parsedData.name,
                description: parsedData.description || "",
                template: parsedData.template || "custom",
                fields: formattedFields,
                formula: parsedData.formula || "",
              };

              // Add a result field if not present
              const hasResultField = candidateData.fields.some((field: any) => field.type === 'result');
              if (!hasResultField) {
                candidateData.fields.push({
                  id: 'result',
                  type: 'result',
                  label: 'Result',
                  required: false,
                  position: { x: 0, y: candidateData.fields.length * 80 }
                });
              }

              // Validate against schema before returning
              const validationResult = insertCalculatorSchema.safeParse(candidateData);
              if (validationResult.success) {
                calculatorData = validationResult.data;
                console.log("Successfully validated calculator data against schema");
                break; // Exit retry loop on success
              } else {
                console.log("Calculator data validation failed:", validationResult.error);
              }
            }
          } else {
            console.log("No text in structured response, response object:", structuredResponse.response);
          }
        } catch (error: any) {
          structuredAttempts++;
          console.log(`Structured generation attempt ${structuredAttempts} failed:`, error.message);

          // Specific fix for mortgage calculator formula issue
          if (userMessage.toLowerCase().includes("mortgage") && error.message.includes("Invalid formula characters")) {
            console.log("Detected mortgage calculator formula issue, applying specific fix.");
            calculatorData = {
              name: "Mortgage Calculator",
              description: "Calculate monthly mortgage payments",
              template: "financial",
              fields: [
                { id: "loanAmount", type: "number", label: "Loan Amount", required: true, placeholder: "Enter loan amount", position: { x: 0, y: 0 } },
                { id: "interestRate", type: "number", label: "Interest Rate (Annual %)", required: true, placeholder: "Enter annual interest rate", position: { x: 0, y: 80 } },
                { id: "loanTerm", type: "number", label: "Loan Term (Years)", required: true, placeholder: "Enter loan term in years", position: { x: 0, y: 160 } },
                { id: "result", type: "result", label: "Monthly Payment", required: false, position: { x: 0, y: 240 } }
              ],
              formula: "((loanAmount * (interestRate/100/12)) / (1 - Math.pow(1 + (interestRate/100/12), -loanTerm * 12)))"
            };
            break; // Exit retry loop as we've applied the fix
          }

          // If it's a 503 error or other API issue, wait a bit before retrying
          if (error.status === 503 || error.message?.includes('overloaded')) {
            console.log("API overloaded, waiting before retry...");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // If structured generation failed, try a simple fallback based on common calculator types
      if (!calculatorData) {
        console.log("Fallback: Creating calculator data based on user request pattern");
        calculatorData = createFallbackCalculatorData(userMessage);
      }
    }

    return {
      response: responseText,
      calculatorData
    };
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw new Error("Failed to generate response from AI assistant");
  }
}

function isCalculatorRequest(message: string): boolean {
  const calculatorKeywords = [
    'calculator', 'calculate', 'compute', 'formula',
    'bmi', 'mortgage', 'loan', 'tax', 'age', 'roi', 'interest',
    'convert', 'conversion', 'percentage', 'tip', 'discount',
    'create', 'build', 'make', 'generate', 'need', 'want'
  ];

  const lowerMessage = message.toLowerCase();
  return calculatorKeywords.some(keyword => lowerMessage.includes(keyword));
}

function createFallbackCalculatorData(userMessage: string): Partial<InsertCalculator> | undefined {
  const lowerMessage = userMessage.toLowerCase();

  // BMI Calculator fallback
  if (lowerMessage.includes('bmi')) {
    return {
      name: "BMI Calculator",
      description: "Calculate Body Mass Index",
      template: "health",
      fields: [
        {
          id: "weight",
          type: "number",
          label: "Weight (kg)",
          required: true,
          placeholder: "Enter your weight",
          position: { x: 0, y: 0 }
        },
        {
          id: "height",
          type: "number", 
          label: "Height (cm)",
          required: true,
          placeholder: "Enter your height",
          position: { x: 0, y: 80 }
        },
        {
          id: "result",
          type: "result",
          label: "BMI Result",
          required: false,
          position: { x: 0, y: 160 }
        }
      ],
      formula: "weight / ((height / 100) * (height / 100))"
    };
  }

  // Tip Calculator fallback
  if (lowerMessage.includes('tip')) {
    return {
      name: "Tip Calculator",
      description: "Calculate tip amount",
      template: "financial",
      fields: [
        {
          id: "bill",
          type: "number",
          label: "Bill Amount ($)",
          required: true,
          placeholder: "Enter bill amount",
          position: { x: 0, y: 0 }
        },
        {
          id: "tipPercent",
          type: "number",
          label: "Tip Percentage (%)",
          required: true,
          placeholder: "Enter tip percentage",
          position: { x: 0, y: 80 }
        },
        {
          id: "result",
          type: "result",
          label: "Tip Amount",
          required: false,
          position: { x: 0, y: 160 }
        }
      ],
      formula: "bill * (tipPercent / 100)"
    };
  }

  // Percentage Calculator fallback
  if (lowerMessage.includes('percentage') || lowerMessage.includes('percent')) {
    return {
      name: "Percentage Calculator",
      description: "Calculate percentages",
      template: "math",
      fields: [
        {
          id: "value",
          type: "number",
          label: "Value",
          required: true,
          placeholder: "Enter the value",
          position: { x: 0, y: 0 }
        },
        {
          id: "percent",
          type: "number",
          label: "Percentage (%)",
          required: true,
          placeholder: "Enter percentage",
          position: { x: 0, y: 80 }
        },
        {
          id: "result",
          type: "result",
          label: "Result",
          required: false,
          position: { x: 0, y: 160 }
        }
      ],
      formula: "value * (percent / 100)"
    };
  }

  return undefined;
}