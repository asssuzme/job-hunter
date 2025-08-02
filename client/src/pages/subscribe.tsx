// Subscribe page for Pro Plan with Cashfree payment gateway
import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Shield, Zap, IndianRupee, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/footer";
import { useLocation } from "wouter";
import { CashfreeClientService } from "@/services/cashfreeClient";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useLocation();
  
  // Check URL parameters for payment status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    const paymentId = params.get('payment_id');
    
    // Handle payment return
    if (paymentId) {
      CashfreeClientService.handlePaymentReturn(paymentId).then(success => {
        if (success) {
          toast({
            title: "Payment Successful!",
            description: "Your Pro Plan subscription is now active. Enjoy unlimited access!",
            variant: "default",
          });
        } else {
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support if payment was deducted.",
            variant: "destructive",
          });
        }
        window.history.replaceState({}, '', '/subscribe');
      });
    } else if (success === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Your Pro Plan subscription is now active. Enjoy unlimited access!",
        variant: "default",
      });
      // Remove URL parameters after showing toast
      window.history.replaceState({}, '', '/subscribe');
    } else if (error) {
      let errorMessage = "Payment failed. Please try again.";
      if (error === 'payment_failed') {
        errorMessage = "Payment was not completed. Please try again.";
      } else if (error === 'processing_failed') {
        errorMessage = "Error processing payment. Please contact support.";
      }
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Remove URL parameters after showing toast
      window.history.replaceState({}, '', '/subscribe');
    }
  }, [toast]);

  const handleSubscribe = async () => {
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to the Pro Plan",
        variant: "destructive",
      });
      // Redirect to home page for login
      setLocation("/");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Use client-side payment SDK to bypass IP restrictions
      await CashfreeClientService.createPaymentAndRedirect(
        user.email || 'user@example.com',
        user.id,
        user.username || 'User'
      );
      
      // The above function will redirect to Cashfree checkout
      // Keep processing state true while redirecting
      
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={() => window.location.href = "/api/auth/logout"} title="Subscribe">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Upgrade to Pro Plan</h1>
            <p className="text-lg text-muted-foreground">
              Unlock unlimited access to all job opportunities
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="glass-card p-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-1">
              <IndianRupee className="h-8 w-8" />
              <span className="text-5xl font-bold">129</span>
              <span className="text-xl text-muted-foreground">/month</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Billed monthly • Cancel anytime
            </p>
          </Card>

          {/* Benefits */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">What's included:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Access Hidden Contact Information</p>
                  <p className="text-sm text-muted-foreground">
                    Unlock contact details for all job postings
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Priority AI Email Generation</p>
                  <p className="text-sm text-muted-foreground">
                    Get faster, more personalized application emails
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Advanced Contact Discovery</p>
                  <p className="text-sm text-muted-foreground">
                    AI-powered search for hard-to-find contacts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="font-medium">Cancel Anytime</p>
                  <p className="text-sm text-muted-foreground">
                    No long-term commitment, cancel whenever you want
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscribe Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubscribe}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Subscribe Now - ₹129/month"}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Cashfree payment gateway
          </p>
          
          <p className="text-xs text-center text-muted-foreground">
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}