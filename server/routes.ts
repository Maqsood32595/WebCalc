import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { generateCalculatorFromPrompt } from "./gemini";
import { insertCalculatorSchema, insertTemplateSchema } from "@shared/schema";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Calculator routes
  app.get('/api/calculators', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const calculators = await storage.getCalculators(userId);
      res.json(calculators);
    } catch (error) {
      console.error("Error fetching calculators:", error);
      res.status(500).json({ message: "Failed to fetch calculators" });
    }
  });

  app.get('/api/calculators/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const calculator = await storage.getCalculator(id, userId);

      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }

      res.json(calculator);
    } catch (error) {
      console.error("Error fetching calculator:", error);
      res.status(500).json({ message: "Failed to fetch calculator" });
    }
  });

  app.get('/api/public/calculators/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const calculator = await storage.getPublicCalculator(id);

      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }

      // Increment view count
      await storage.incrementCalculatorViews(id);

      res.json(calculator);
    } catch (error) {
      console.error("Error fetching public calculator:", error);
      res.status(500).json({ message: "Failed to fetch calculator" });
    }
  });

  app.post('/api/calculators', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCalculatorSchema.parse(req.body);

      const calculator = await storage.createCalculator({
        ...validatedData,
        userId,
      });

      res.status(201).json(calculator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating calculator:", error);
      res.status(500).json({ message: "Failed to create calculator" });
    }
  });

  app.put('/api/calculators/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const validatedData = insertCalculatorSchema.partial().parse(req.body);

      const calculator = await storage.updateCalculator(id, validatedData, userId);
      res.json(calculator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating calculator:", error);
      res.status(500).json({ message: "Failed to update calculator" });
    }
  });

  app.delete('/api/calculators/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      await storage.deleteCalculator(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting calculator:", error);
      res.status(500).json({ message: "Failed to delete calculator" });
    }
  });

  // Gemini chat route
  app.post('/api/gemini/chat', isAuthenticated, async (req: any, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: 'Gemini API key not configured',
          response: "I'm currently not available. Please try again later."
        });
      }

      const { message, conversationHistory } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ 
          error: 'Message is required',
          response: "Please provide a message to continue our conversation."
        });
      }

      console.log('Attempting to generate structured calculator data for:', message);

      // Create a context-aware prompt that includes conversation history
      let fullPrompt = '';

      if (conversationHistory && conversationHistory.length > 0) {
        fullPrompt = 'Previous conversation:\n';
        conversationHistory.slice(-5).forEach((msg: any) => {
          fullPrompt += `${msg.role}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }

      fullPrompt += `User request: ${message}

Please analyze this request and determine if the user wants to create a calculator. If they do, respond with a JSON object containing calculator specifications AND a conversational response.

For calculator creation requests, provide both:
1. A "calculatorData" object with the calculator specification
2. A "response" string with a friendly explanation

The calculatorData should follow this exact structure:
{
  "name": "Calculator Name",
  "description": "Brief description", 
  "template": "category (health, finance, math, conversion, etc.)",
  "fields": [
    {
      "id": "uniqueFieldId",
      "type": "number|text|select|checkbox",
      "label": "Field Label",
      "required": true,
      "placeholder": "example value",
      "position": { "x": 0, "y": 0 },
      "validation": { "min": 0, "max": 1000 } // optional
    }
  ],
  "formula": "mathematical expression using field IDs"
}

For general conversation, only provide a "response" string.

Examples:
- "Create a BMI calculator" → Provide calculatorData + response
- "How does BMI work?" → Only provide response
- "Make a tip calculator" → Provide calculatorData + response`;

      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();

      console.log('Structured response received, text available:', !!responseText);

      // Try to parse JSON from the response
      let parsedResponse;
      try {
        // Look for JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log('Raw JSON response from Gemini:', jsonStr);
          parsedResponse = JSON.parse(jsonStr);

          // Validate the calculator data if present
          if (parsedResponse.calculatorData) {
            const validationResult = insertCalculatorSchema.safeParse(parsedResponse.calculatorData);
            if (validationResult.success) {
              console.log('Successfully validated calculator data against schema');
            } else {
              console.log('Calculator data validation failed:', validationResult.error);
              parsedResponse.calculatorData = undefined;
            }
          }
        }
      } catch (parseError) {
        console.log('Failed to parse JSON from response, treating as conversational');
        parsedResponse = null;
      }

      // Format the response
      let finalResponse;
      if (parsedResponse && (parsedResponse.response || parsedResponse.calculatorData)) {
        finalResponse = {
          response: parsedResponse.response || "I've created a calculator specification for you!",
          calculatorData: parsedResponse.calculatorData
        };
      } else {
        // Fallback to conversational response
        finalResponse = {
          response: responseText || "I'd be happy to help you create a calculator! What type would you like to build?"
        };
      }

      console.log('Final response being sent:', finalResponse);
      res.json(finalResponse);
    } catch (error) {
      console.error('Gemini API error:', error);
      res.status(500).json({ 
        error: 'Failed to communicate with AI assistant',
        response: "I'm having trouble processing your request right now. Please try again."
      });
    }
  });

  // Template routes
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const template = await storage.getTemplate(id);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  // PayPal payment routes - using PayPal integration
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Payment tracking for calculator conversions
  app.post('/api/payment/success', isAuthenticated, async (req: any, res) => {
    try {
      const { calculatorId, amount } = req.body;

      if (calculatorId && amount) {
        await storage.incrementCalculatorConversions(calculatorId, amount);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Payment tracking error:", error);
      res.status(500).json({ error: "Payment tracking failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}