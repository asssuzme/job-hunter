import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bot, Mail, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            LinkedIn Job Scraper
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automate your job search with AI-powered LinkedIn scraping, 
            intelligent filtering, and personalized application emails.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Smart Scraping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Extract comprehensive job data from LinkedIn including company info, 
                requirements, and contact details.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-600" />
                AI Filtering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Intelligent filtering to identify quality opportunities with 
                verified email addresses and application pathways.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Email Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered personalized emails using your resume, company data, 
                and job requirements for higher response rates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Secure & Private
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your data is protected with industry-standard security. 
                Resume content stays private and is never shared.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Submit LinkedIn URL</h3>
              <p className="text-gray-600">
                Paste a LinkedIn job search URL and optionally upload your resume for personalization.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
              <p className="text-gray-600">
                Our AI scrapes, filters, and enriches job data, finding contact information and verifying emails.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Results</h3>
              <p className="text-gray-600">
                Receive filtered opportunities with personalized application emails ready to send.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Accelerate Your Job Search?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of job seekers who are landing interviews faster with AI-powered automation.
          </p>
          <Link href="/register">
            <Button size="lg" className="px-12 py-4 text-lg">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}