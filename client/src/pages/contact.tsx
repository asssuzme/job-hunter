import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Mail, MessageSquare, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg text-muted-foreground mb-8">
            We're here to help with any questions or concerns about autoapply.ai
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Support Section */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email Support</h3>
                  <p className="text-muted-foreground mb-2">
                    For general inquiries and support:
                  </p>
                  <a 
                    href="mailto:support@autoapply.ai" 
                    className="text-primary hover:underline"
                  >
                    support@autoapply.ai
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-muted-foreground">
                    We typically respond within 24-48 hours during business days
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Privacy & Security</h3>
                  <p className="text-muted-foreground mb-2">
                    For privacy concerns or data requests:
                  </p>
                  <a 
                    href="mailto:privacy@autoapply.ai" 
                    className="text-primary hover:underline"
                  >
                    privacy@autoapply.ai
                  </a>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Business Information</h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    <span className="font-medium">Company:</span> autoapply.ai
                  </p>
                  <p>
                    <span className="font-medium">Operated by:</span> Ashutosh Lath
                  </p>
                  <p>
                    <span className="font-medium">Service Type:</span> Job Application Automation Platform
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Data Protection Officer</h3>
                <p className="text-muted-foreground mb-2">
                  For GDPR/CCPA inquiries and data protection matters:
                </p>
                <a 
                  href="mailto:dpo@autoapply.ai" 
                  className="text-primary hover:underline"
                >
                  dpo@autoapply.ai
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Before You Contact Us
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Check our FAQ section for common questions</li>
              <li>• Review our Terms of Service and Privacy Policy</li>
              <li>• Include your account email when contacting support</li>
              <li>• Be specific about any issues you're experiencing</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}