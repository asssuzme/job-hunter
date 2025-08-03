import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Users } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Shield className="h-8 w-8 text-blue-400" />
                </div>
                <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 text-lg mb-6">
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-400" />
                    Information We Collect
                  </h2>
                  <div className="bg-white/5 rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-medium text-white mb-2">Account Information</h3>
                      <p className="text-gray-300">
                        When you sign up for AutoApply.ai, we collect your name, email address, and profile information from your Google account through OAuth authentication.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white mb-2">Resume Data</h3>
                      <p className="text-gray-300">
                        We store the resume files you upload to provide personalized job application services. This data is encrypted and only accessible by you.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white mb-2">Job Search Preferences</h3>
                      <p className="text-gray-300">
                        We collect information about your job search criteria, including job titles, locations, and other preferences to improve our service.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-400" />
                    How We Use Your Information
                  </h2>
                  <div className="bg-white/5 rounded-lg p-6">
                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        To provide and improve our job application automation services
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        To generate personalized application emails based on your resume and job requirements
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        To communicate with you about your account and our services
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        To analyze usage patterns and improve user experience
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-400" />
                    Gmail Integration
                  </h2>
                  <div className="bg-white/5 rounded-lg p-6 space-y-4">
                    <p className="text-gray-300">
                      When you authorize Gmail access, we request permission to send emails on your behalf. We:
                    </p>
                    <ul className="space-y-2 text-gray-300 ml-4">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Only send emails that you explicitly approve
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Do not read, access, or store your existing emails
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Store only the minimum tokens required for sending emails
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Allow you to revoke access at any time
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-400" />
                    Data Security
                  </h2>
                  <div className="bg-white/5 rounded-lg p-6">
                    <p className="text-gray-300 mb-4">
                      We take data security seriously and implement industry-standard measures including:
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Encryption of sensitive data at rest and in transit
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Secure OAuth 2.0 authentication
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Regular security audits and updates
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Limited access to user data on a need-to-know basis
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Your Rights
                  </h2>
                  <div className="bg-white/5 rounded-lg p-6">
                    <p className="text-gray-300 mb-4">You have the right to:</p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Access and download your personal data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Request correction of inaccurate data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Request deletion of your account and associated data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Opt-out of marketing communications
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        Revoke Gmail access at any time
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                  <div className="bg-white/5 rounded-lg p-6">
                    <p className="text-gray-300">
                      If you have any questions about this Privacy Policy or our data practices, please contact us at:
                    </p>
                    <p className="text-blue-400 mt-2">privacy@autoapply.ai</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Policy</h2>
                  <div className="bg-white/5 rounded-lg p-6">
                    <p className="text-gray-300">
                      We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}