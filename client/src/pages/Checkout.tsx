import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import PayPalButton from "@/components/PayPalButton";

const CheckoutForm = () => {
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Thank you for your purchase!",
    });
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  };

  const handlePaymentError = () => {
    toast({
      title: "Payment Failed",
      description: "There was an error processing your payment.",
      variant: "destructive",
    });
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-primary mb-2">$29.00</div>
          <p className="text-muted-foreground">Pro Plan - Monthly Subscription</p>
        </div>

        <PayPalButton
          amount="29.00"
          currency="USD"
          intent="CAPTURE"
        />

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4"
            data-testid="button-cancel-checkout"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

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

  // PayPal integration - no environment variables required for basic setup
  useEffect(() => {
    console.log("Checkout component initialized with PayPal integration");
  }, []);

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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Upgrade to Pro</h1>
            <p className="text-muted-foreground">
              Unlock unlimited calculators, remove branding, and access premium features.
            </p>
          </div>

          <CheckoutForm />
        </div>
      </main>
    </div>
  );
}