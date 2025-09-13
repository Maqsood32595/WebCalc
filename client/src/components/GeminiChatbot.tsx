import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, User, Send, Sparkles, Calculator, Loader2 } from "lucide-react";
import type { InsertCalculator, CalculatorField } from "@shared/schema";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  calculatorData?: Partial<InsertCalculator>;
}

interface GeminiChatbotProps {
  onCreateCalculator?: (calculatorData: Partial<InsertCalculator>) => void;
  className?: string;
}

export default function GeminiChatbot({ onCreateCalculator, className = "" }: GeminiChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI assistant for creating calculators. Tell me what kind of calculator you'd like to build, and I'll help you create it. For example, you could say 'Create a mortgage calculator' or 'I need a BMI calculator'.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response: any = await apiRequest('POST', '/api/gemini/chat', {
        message: input.trim(),
        conversationHistory: messages,
      });

      console.log("Raw Gemini API response:", response);
      console.log("Calculator data from response:", response.calculatorData);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        calculatorData: response.calculatorData,
      };

      console.log("Assistant message with calculator data:", assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);

      // If the response includes calculator data, offer to create it
      if (response.calculatorData && onCreateCalculator) {
        toast({
          title: "Calculator specification ready!",
          description: "I've prepared a calculator based on your request. You can create it now or continue the conversation.",
        });
      }
    } catch (error) {
      console.error('Error communicating with Gemini:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: "Error",
        description: "Failed to communicate with AI assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateCalculator = (calculatorData: Partial<InsertCalculator>) => {
    if (onCreateCalculator) {
      onCreateCalculator(calculatorData);
      toast({
        title: "Calculator created!",
        description: "Your calculator has been created. You can now edit and publish it.",
      });
    }
  };

  return (
    <Card className={`h-96 flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Calculator Assistant
          <Badge variant="secondary" className="ml-auto">
            <Bot className="w-3 h-3 mr-1" />
            Gemini
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-100 dark:bg-blue-900' 
                    : 'bg-purple-100 dark:bg-purple-900'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    : <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  }
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.calculatorData && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Calculator Ready to Create</span>
                          </div>
                        </div>
                        
                        <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <p><strong>Name:</strong> {message.calculatorData.name}</p>
                            <p><strong>Fields:</strong> {message.calculatorData.fields?.length || 0} input fields</p>
                            {message.calculatorData.description && (
                              <p><strong>Description:</strong> {message.calculatorData.description}</p>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCreateCalculator(message.calculatorData!)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                          disabled={isLoading}
                          data-testid="button-create-suggested-calculator"
                        >
                          <Calculator className="w-4 h-4 mr-2" />
                          {isLoading ? 'Creating Calculator...' : 'Create This Calculator'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1 text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to create a calculator..."
            disabled={isLoading}
            className="flex-1"
            data-testid="input-chatbot-message"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="sm"
            data-testid="button-send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}