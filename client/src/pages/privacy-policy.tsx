import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: August 2, 2025</p>

          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">1. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us, such as:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and email address when you sign up</li>
                <li>Resume information for job applications</li>
                <li>Payment information when subscribing to Pro Plan</li>
                <li>Job search preferences and application history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">2. How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our job search services</li>
                <li>Generate personalized job application emails</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important service updates</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">3. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your data is encrypted in transit and at rest.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">4. Third-Party Services</h2>
              <p className="mb-3">We use the following third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google OAuth for authentication</li>
                <li>OpenAI for email generation</li>
                <li>Apify for job data collection</li>
                <li>Payment gateway for subscription processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">5. Data Retention</h2>
              <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your data at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">6. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-foreground">7. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <div className="mt-2 space-y-1">
                <p>Email: ashutoshlathvalo@gmail.com</p>
                <p>Phone: +91 6302961924</p>
                <p>Address: T19 TOWERS RANIGANJ FLAT NO 1004</p>
                <p>10H FLOOR NEAR RANIGANJ BUS DEPOT</p>
                <p>Hyderabad, Telangana, PIN: 500003</p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}