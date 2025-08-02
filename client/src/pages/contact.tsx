import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft, Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
          className="space-y-6"
        >
          <div className="glass-card p-8">
            <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
            <p className="text-muted-foreground mb-8">
              We're here to help! Reach out to us for any questions, support, or feedback.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Email Support</h3>
                    <p className="text-sm text-muted-foreground">ashutoshlathvalo@gmail.com</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Response Time</h3>
                    <p className="text-sm text-muted-foreground">24-48 hours</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Registered Office</h3>
                    <p className="text-sm text-muted-foreground">
                      T19 TOWERS RANIGANJ FLAT NO 1004<br />
                      10H FLOOR NEAR RANIGANJ BUS DEPOT<br />
                      Hyderabad, Telangana<br />
                      PIN: 500003
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Contact Number</h3>
                    <p className="text-sm text-muted-foreground">
                      +91 8302961924<br />
                      Business Hours: Mon-Sat 9AM-6PM IST
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6">Support Topics</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Account & Billing</h3>
                <p className="text-sm text-muted-foreground">
                  Questions about your subscription, payment issues, or account management
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Support</h3>
                <p className="text-sm text-muted-foreground">
                  Help with job scraping, email generation, or any technical difficulties
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Feature Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Suggestions for new features or improvements to existing functionality
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Partnership Inquiries</h3>
                <p className="text-sm text-muted-foreground">
                  Business partnerships, integrations, or enterprise solutions
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6">Legal Information</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p><strong>Merchant Legal Entity Name:</strong> ASHUTOSH LATH</p>
              <p><strong>Registered Address:</strong><br />
                T19 TOWERS RANIGANJ FLAT NO 1004 10H FLOOR<br />
                NEAR RANIGANJ BUS DEPOT<br />
                Hyderabad, Telangana, PIN: 500003
              </p>
              <p><strong>Operational Address:</strong><br />
                T19 TOWERS RANIGANJ FLAT NO 1004 10H FLOOR<br />
                NEAR RANIGANJ BUS DEPOT<br />
                Hyderabad, Telangana, PIN: 500003
              </p>
              <p><strong>Contact Number:</strong> +91 8302961924</p>
              <p><strong>Email:</strong> ashutoshlathvalo@gmail.com</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}