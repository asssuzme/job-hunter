import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Refund & Cancellation Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: August 2, 2025</p>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Subscription Cancellation</h2>
              <p className="mb-3">You can cancel your Pro Plan subscription at any time:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancel through your account settings</li>
                <li>Access continues until the end of current billing period</li>
                <li>No partial refunds for unused time in billing period</li>
                <li>Automatic renewal stops immediately upon cancellation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Refund Eligibility</h2>
              <p className="mb-3">Refunds may be provided in the following cases:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Technical issues preventing service access for extended periods</li>
                <li>Accidental duplicate charges</li>
                <li>Service not functioning as described</li>
                <li>Within 7 days of initial subscription if unsatisfied</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Refund Process</h2>
              <p className="mb-3">To request a refund:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Contact support at support@jobhunter.app</li>
                <li>Include your account email and transaction details</li>
                <li>Explain the reason for refund request</li>
                <li>Allow 5-7 business days for review</li>
                <li>Refunds processed within 7-10 business days after approval</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Non-Refundable Items</h2>
              <p className="mb-3">The following are not eligible for refunds:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Services already consumed (emails sent, jobs scraped)</li>
                <li>Subscription fees after 7-day satisfaction period</li>
                <li>Account suspension due to terms violation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Free Plan</h2>
              <p>The Free Plan does not involve any payment and therefore no refunds apply. You can upgrade to Pro Plan anytime to access premium features.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Payment Disputes</h2>
              <p>If you have a payment dispute, please contact us before initiating a chargeback. We will work with you to resolve the issue promptly.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Price Changes</h2>
              <p>We reserve the right to change subscription prices. Existing subscribers will be notified 30 days before any price increase takes effect.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Contact Us</h2>
              <p>For refund requests or questions about this policy:</p>
              <p className="mt-2">Email: support@jobhunter.app</p>
              <p>Response time: Within 24-48 hours</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}