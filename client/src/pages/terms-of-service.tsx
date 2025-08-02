import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: August 2, 2025</p>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing and using JobHunter, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. Service Description</h2>
              <p className="mb-3">JobHunter provides:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>LinkedIn job search and scraping services</li>
                <li>AI-powered email generation for job applications</li>
                <li>Contact information enrichment</li>
                <li>Application tracking and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. User Accounts</h2>
              <p className="mb-3">To use our services, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account using Google OAuth</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Notify us of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Subscription and Pricing</h2>
              <p className="mb-3">Pro Plan Subscription:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Price: ₹129 per month</li>
                <li>Billed monthly in advance</li>
                <li>Auto-renewal unless cancelled</li>
                <li>Access to all premium features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the service for illegal purposes</li>
                <li>Violate any third-party rights</li>
                <li>Spam or harass recipients</li>
                <li>Attempt to circumvent service limitations</li>
                <li>Resell or redistribute our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Intellectual Property</h2>
              <p>All content, features, and functionality of JobHunter are owned by us and are protected by international copyright, trademark, and other intellectual property laws.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, JobHunter shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">8. Indemnification</h2>
              <p>You agree to indemnify and hold harmless JobHunter from any claims, damages, or expenses arising from your use of the service or violation of these terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">9. Termination</h2>
              <p>We may terminate or suspend your account at any time for violations of these terms. You may cancel your subscription at any time through your account settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">10. Governing Law</h2>
              <p>These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">11. Contact Information</h2>
              <p>For questions about these Terms of Service, contact us at:</p>
              <p className="mt-2">Email: support@jobhunter.app</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}