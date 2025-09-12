import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalculatorRenderer from "@/components/CalculatorRenderer";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Template } from "@shared/schema";
import { 
  Calculator as CalculatorIcon, 
  Smartphone, 
  CreditCard, 
  Share2, 
  Layout, 
  BarChart, 
  Eye,
  DollarSign,
  TrendingUp,
  CheckCircle
} from "lucide-react";

export default function Landing() {
  const params = useParams();
  const calculatorId = params.id;
  const [demoValues, setDemoValues] = useState({
    principal: 100000,
    rate: 5.5,
    years: 30
  });

  // Fetch public calculator if ID is provided
  const { data: calculator, isLoading: calculatorLoading } = useQuery({
    queryKey: ['/api/public/calculators', calculatorId],
    enabled: !!calculatorId,
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/templates'],
  });

  const calculatePayment = () => {
    const { principal, rate, years } = demoValues;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                   (Math.pow(1 + monthlyRate, numPayments) - 1);
    return payment.toFixed(2);
  };

  if (calculatorId && calculatorLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (calculatorId && calculator) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4 text-foreground">{calculator.name}</h1>
                {calculator.description && (
                  <p className="text-muted-foreground">{calculator.description}</p>
                )}
              </div>
              <CalculatorRenderer calculator={calculator} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 gradient-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Build Professional
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {" "}Calculators
              </span>
              <br />Without Code
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Create custom calculators with our visual drag-and-drop builder. 
              Monetize your expertise with Stripe integration and publish anywhere.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="gradient-secondary text-white px-8 py-4 text-lg font-bold rounded-full hover:shadow-xl transform hover:-translate-y-1 transition-all"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-start-building"
              >
                Start Building Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="glass-effect text-white border-white/30 px-8 py-4 text-lg font-semibold rounded-full hover:bg-white/20 transition-all"
                data-testid="button-watch-demo"
              >
                Watch Demo
              </Button>
            </div>
            
            {/* Hero Calculator Preview */}
            <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-4 text-center">Live Calculator Preview</h3>
              <div className="space-y-3">
                <Input 
                  type="number" 
                  placeholder="Principal Amount"
                  value={demoValues.principal}
                  onChange={(e) => setDemoValues({...demoValues, principal: Number(e.target.value)})}
                  className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-300"
                  data-testid="input-principal"
                />
                <Input 
                  type="number" 
                  placeholder="Interest Rate %"
                  value={demoValues.rate}
                  onChange={(e) => setDemoValues({...demoValues, rate: Number(e.target.value)})}
                  className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-300"
                  data-testid="input-rate"
                />
                <Input 
                  type="number" 
                  placeholder="Years"
                  value={demoValues.years}
                  onChange={(e) => setDemoValues({...demoValues, years: Number(e.target.value)})}
                  className="bg-white/20 border-white/30 text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-300"
                  data-testid="input-years"
                />
                <div className="bg-yellow-400 text-gray-900 p-4 rounded-lg font-bold text-center">
                  <div className="text-sm">Monthly Payment</div>
                  <div className="text-2xl" data-testid="text-payment">${calculatePayment()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 gradient-bg">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient-primary">
              Everything You Need to Build
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional calculator builder with drag-and-drop interface, formula editor, and monetization tools
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Layout className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-card-foreground">Visual Builder</h3>
                <p className="text-muted-foreground">Drag and drop form fields, customize layouts, and build complex calculators without writing a single line of code.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center mb-6">
                  <CalculatorIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-card-foreground">Formula Editor</h3>
                <p className="text-muted-foreground">Create custom calculations with our intuitive formula editor. Support for complex math operations and functions.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-card-foreground">Stripe Integration</h3>
                <p className="text-muted-foreground">Monetize your calculators with built-in Stripe payments. Accept one-time payments or subscriptions.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center mb-6">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-card-foreground">Easy Publishing</h3>
                <p className="text-muted-foreground">Publish calculators with shareable URLs. Embed anywhere with custom iframe codes.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-card-foreground">Mobile Responsive</h3>
                <p className="text-muted-foreground">All calculators are automatically optimized for mobile devices with responsive design.</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
              <CardContent className="p-8">
                <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center mb-6">
                  <BarChart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-card-foreground">Analytics Dashboard</h3>
                <p className="text-muted-foreground">Track usage, conversions, and revenue with comprehensive analytics and reporting tools.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient-primary">
              Ready-Made Templates
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start with professional templates and customize to your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templatesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
                    <div className="h-4 bg-muted rounded mb-4 animate-pulse" />
                    <div className="h-10 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))
            ) : (
              templates.map((template: Template) => (
                <Card key={template.id} className="overflow-hidden hover:shadow-xl transform hover:-translate-y-2 transition-all border border-border">
                  <div className="h-48 gradient-primary flex items-center justify-center text-white text-4xl font-bold">
                    {template.category === 'finance' ? '💰' : 
                     template.category === 'health' ? '🏃' : 
                     template.category === 'business' ? '📊' : '🧮'}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-card-foreground">{template.name}</h3>
                      {template.isPopular && (
                        <Badge variant="secondary" className="text-green-600">Popular</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4">{template.description}</p>
                    <Button 
                      className="w-full gradient-primary text-white hover:shadow-lg transition-all"
                      onClick={() => window.location.href = "/api/login"}
                      data-testid={`button-use-template-${template.id}`}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 gradient-bg">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient-primary">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and scale as you grow. All plans include PayPal integration.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="hover:shadow-xl transition-all border border-border">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2 text-card-foreground">Free</h3>
                  <div className="text-4xl font-bold mb-2 text-card-foreground">$0</div>
                  <div className="text-muted-foreground">per month</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Up to 3 calculators</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Basic templates</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Webcalc branding</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Basic analytics</span>
                  </li>
                </ul>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-get-started-free"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="hover:shadow-xl transition-all border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2 text-card-foreground">Pro</h3>
                  <div className="text-4xl font-bold mb-2 text-card-foreground">$29</div>
                  <div className="text-muted-foreground">per month</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Unlimited calculators</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">All templates</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Remove branding</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Advanced analytics</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Stripe integration</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Custom domains</span>
                  </li>
                </ul>
                
                <Button 
                  className="w-full gradient-primary text-white hover:shadow-lg transition-all"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-start-pro-trial"
                >
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="hover:shadow-xl transition-all border border-border">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2 text-card-foreground">Enterprise</h3>
                  <div className="text-4xl font-bold mb-2 text-card-foreground">$99</div>
                  <div className="text-muted-foreground">per month</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Everything in Pro</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">White-label solution</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">API access</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Priority support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-card-foreground">Custom integrations</span>
                  </li>
                </ul>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-contact-sales"
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
