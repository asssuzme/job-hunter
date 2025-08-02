// Subscribe page for Pro Plan with Indian payment gateway
import { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { motion } from "framer-motion";
import { CheckCircle, CreditCard, Shield, Zap, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/footer";

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    
    try {
      // TODO: Implement payment gateway integration
      toast({
        title: "Payment Gateway Integration Needed",
        description: "Please select an Indian payment gateway (Razorpay, Paytm, PhonePe, etc.) to enable subscriptions.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process subscription",
        variant: "destructive",
      });
    } finally {
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
            Secure payment powered by Indian payment gateway
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}