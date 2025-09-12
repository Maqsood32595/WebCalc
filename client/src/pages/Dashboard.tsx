import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import { Calculator, Eye, DollarSign, TrendingUp, Plus, Edit, Share, MoreHorizontal, Trash2 } from "lucide-react";
import type { Calculator as CalculatorType } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: calculators = [], isLoading } = useQuery({
    queryKey: ['/api/calculators'],
    retry: false,
    enabled: !!user,
  });

  const deleteCalculatorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/calculators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calculators'] });
      toast({
        title: "Calculator deleted",
        description: "Calculator has been deleted successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete calculator.",
        variant: "destructive",
      });
    },
  });

  const filteredCalculators = calculators.filter((calc: CalculatorType) =>
    calc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalCalculators: calculators.length,
    monthlyViews: calculators.reduce((sum: number, calc: CalculatorType) => sum + (calc.views || 0), 0),
    revenue: calculators.reduce((sum: number, calc: CalculatorType) => sum + (calc.revenue || 0), 0) / 100,
    conversions: calculators.reduce((sum: number, calc: CalculatorType) => sum + (calc.conversions || 0), 0),
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-6">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.firstName || 'User'}!</p>
            </div>
            <Button 
              className="gradient-secondary text-white hover:shadow-lg transition-all"
              onClick={() => setLocation('/builder')}
              data-testid="button-new-calculator"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Calculator
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Total Calculators</div>
                    <div className="text-2xl font-bold text-blue-900" data-testid="text-total-calculators">
                      {stats.totalCalculators}
                    </div>
                  </div>
                  <Calculator className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 font-medium">Monthly Views</div>
                    <div className="text-2xl font-bold text-green-900" data-testid="text-monthly-views">
                      {stats.monthlyViews.toLocaleString()}
                    </div>
                  </div>
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Revenue</div>
                    <div className="text-2xl font-bold text-purple-900" data-testid="text-revenue">
                      ${stats.revenue.toFixed(2)}
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600 font-medium">Conversions</div>
                    <div className="text-2xl font-bold text-orange-900" data-testid="text-conversions">
                      {stats.conversions}
                    </div>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calculator List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Calculators</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="text" 
                    placeholder="Search calculators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                    data-testid="input-search-calculators"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                        <div>
                          <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredCalculators.length === 0 ? (
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchTerm ? 'No calculators found' : 'No calculators yet'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms.' 
                      : 'Create your first calculator to get started.'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      className="gradient-primary text-white"
                      onClick={() => setLocation('/builder')}
                      data-testid="button-create-first-calculator"
                    >
                      Create Calculator
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCalculators.map((calculator: CalculatorType) => (
                    <div 
                      key={calculator.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-all"
                      data-testid={`card-calculator-${calculator.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                          {calculator.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-semibold text-card-foreground">
                            {calculator.name}
                          </h5>
                          <div className="text-sm text-muted-foreground">
                            Created {new Date(calculator.createdAt!).toLocaleDateString()} • {calculator.views || 0} views
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={calculator.isPublished ? "default" : "secondary"}>
                          {calculator.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/builder/${calculator.id}`)}
                          data-testid={`button-edit-${calculator.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            if (calculator.isPublished) {
                              navigator.clipboard.writeText(`${window.location.origin}/public/${calculator.id}`);
                              toast({ title: "Link copied!", description: "Calculator URL copied to clipboard." });
                            }
                          }}
                          data-testid={`button-share-${calculator.id}`}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteCalculatorMutation.mutate(calculator.id)}
                          data-testid={`button-delete-${calculator.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
