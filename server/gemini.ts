import { GoogleGenAI } from "@google/genai";
import type { InsertCalculator, CalculatorField } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Using Gemini integration blueprint for calculator creation assistance

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });

    const responseText = response.text || "I'm sorry, I couldn't process that request.";

    // Try to extract calculator data if the response seems to include specifications
    let calculatorData: Partial<InsertCalculator> | undefined;

    // Use a second call to generate structured calculator data if it seems like the user wants a calculator
    if (isCalculatorRequest(userMessage)) {
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

Make sure all field IDs are used in the formula. Use realistic field names and calculations.`;

      try {
        const structuredResponse = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          config: {
            responseMimeType: "application/json",
          },
          contents: structuredPrompt,
        });

        if (structuredResponse.text) {
          const parsedData = JSON.parse(structuredResponse.text);
          
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

            calculatorData = {
              name: parsedData.name,
              description: parsedData.description || "",
              template: parsedData.template || "custom",
              fields: formattedFields,
              formula: parsedData.formula || "",
            };

            // Add a result field if not present
            const hasResultField = calculatorData.fields?.some(field => field.type === 'result');
            if (!hasResultField && calculatorData.fields) {
              calculatorData.fields.push({
                id: 'result',
                type: 'result',
                label: 'Result',
                required: false,
                position: { x: 0, y: calculatorData.fields.length * 80 }
              });
            }
          }
        }
      } catch (parseError) {
        console.log("Could not parse structured calculator data, proceeding with text response only");
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