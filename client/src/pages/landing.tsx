import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Bot, Mail, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
            <span className="px-4 py-1 text-sm font-medium text-primary bg-white rounded-full shadow-sm">
              Powered by AI
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">LinkedIn Job</span>
            <br />
            <span className="text-foreground">Scraper</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Automate your job search with AI-powered LinkedIn scraping, 
            intelligent filtering, and personalized application emails.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="btn-gradient px-10 py-6 text-lg rounded-xl hover:-translate-y-0.5 transition-all duration-200">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-10 py-6 text-lg rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="card-hover border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.1s'}}>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Smart Scraping</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Extract comprehensive job data from LinkedIn including company info, 
                requirements, and contact details.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.2s'}}>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">AI Filtering</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Intelligent filtering to identify quality opportunities with 
                verified email addresses and application pathways.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.3s'}}>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Email Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                AI-powered personalized emails using your resume, company data, 
                and job requirements for higher response rates.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="card-hover border-0 shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
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