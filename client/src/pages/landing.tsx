import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Search, Mail, Users, BarChart3, Target, Zap, Globe, Shield, CheckCircle, Star, TrendingUp, Briefcase, Brain, Clock, Award } from "lucide-react";
import Footer from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { signInWithGoogle } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Spinner, PageLoader } from "@/components/ui/loading-animations";

export default function Landing() {
  const { isLoading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Sign in failed",
        description: "Unable to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"></div>
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Dynamic floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            y: [-40, 40, -40],
            x: [-30, 30, -30],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-48 -left-48 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [40, -40, 40],
            x: [30, -30, 30],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-48 -right-48 w-[32rem] h-[32rem] bg-gradient-radial from-accent/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [-30, 30, -30],
            rotate: [0, 360],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-conic from-primary/10 via-accent/10 to-primary/10 rounded-full blur-2xl"
        />
      </div>

      {/* Navigation bar */}
      <nav className="relative z-20 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {/* Simple Text Logo */}
            <div className="flex items-center">
              <span className="text-3xl font-black tracking-tight">
                <span className="text-black">AUTOAPPLY</span>
                <span className="text-blue-600">.AI</span>
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button variant="ghost" className="hidden md:inline-flex">
              Features
            </Button>
            <Button variant="ghost" className="hidden md:inline-flex">
              Pricing
            </Button>
            <Button
              onClick={handleSignIn}
              className="btn-primary"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto w-full"
        >
          {/* Hero section */}
          <div className="text-center mb-20 pt-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8"
            >
              <Badge variant="outline" className="px-4 py-2 border-primary/20 bg-primary/5">
                <Sparkles className="h-3 w-3 mr-2 text-primary" />
                <span className="text-sm font-semibold">Powered by OpenAI GPT-4</span>
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
            >
              <span className="block">Find Your Dream Job</span>
              <span className="block text-6xl md:text-8xl gradient-text mt-2">10x Faster</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed"
            >
              Stop wasting hours on job applications. Our AI scrapes LinkedIn, finds decision-makers, 
              and writes personalized emails that actually get responses.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <button
                onClick={handleSignIn}
                className="btn-primary text-lg px-8 py-4 group flex items-center gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Start Free with Google</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Watch Demo
                <Clock className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                <span>4.9/5 Rating</span>
              </div>
            </motion.div>
          </div>

          {/* Stats section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-24"
          >
            <div className="glass-card p-8 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { label: "Jobs Analyzed", value: "1M+", icon: Briefcase },
                  { label: "Success Rate", value: "85%", icon: TrendingUp },
                  { label: "Time Saved", value: "10hrs/week", icon: Clock },
                  { label: "Happy Users", value: "10K+", icon: Award },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                    className="text-center"
                  >
                    <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Features section with better layout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Target className="h-3 w-3 mr-2" />
                Features
              </Badge>
              <h2 className="text-4xl font-bold mb-4">Everything You Need to Land Your Dream Job</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered platform automates the entire job search process, from finding opportunities to sending applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: "AI Job Matching",
                  description: "Smart algorithms analyze your profile and find perfect job matches from LinkedIn's database",
                  features: ["Keyword optimization", "Skill matching", "Location preferences"]
                },
                {
                  icon: Users,
                  title: "Contact Discovery",
                  description: "Automatically find hiring managers and decision makers at target companies",
                  features: ["Email finder", "LinkedIn profiles", "Contact verification"]
                },
                {
                  icon: Mail,
                  title: "Smart Outreach",
                  description: "Generate personalized emails that get 3x higher response rates",
                  features: ["AI-written emails", "Follow-up sequences", "Gmail integration"]
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass-card p-8 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground mb-6">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Testimonials section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Star className="h-3 w-3 mr-2" />
                Testimonials
              </Badge>
              <h2 className="text-4xl font-bold mb-4">Loved by Job Seekers Worldwide</h2>
              <p className="text-xl text-muted-foreground">
                See what our users say about their success stories
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Software Engineer",
                  company: "Google",
                  image: "/avatars/avatar1.jpg",
                  content: "Found my dream job at Google in just 2 weeks! The AI-written emails were incredibly personalized.",
                  rating: 5
                },
                {
                  name: "Michael Chen",
                  role: "Product Manager",
                  company: "Microsoft",
                  image: "/avatars/avatar2.jpg",
                  content: "The contact discovery feature is a game-changer. I connected directly with hiring managers.",
                  rating: 5
                },
                {
                  name: "Emily Rodriguez",
                  role: "Data Scientist",
                  company: "Amazon",
                  image: "/avatars/avatar3.jpg",
                  content: "Saved me 20+ hours per week on job applications. The ROI is incredible!",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1, duration: 0.5 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent" />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Pricing preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="mb-24"
          >
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4">
                <Zap className="h-3 w-3 mr-2" />
                Pricing
              </Badge>
              <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">
                Start free, upgrade when you need more
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card p-8 relative"
              >
                <Badge className="absolute top-4 right-4">Free Forever</Badge>
                <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
                <p className="text-muted-foreground mb-6">Perfect for getting started</p>
                <div className="text-4xl font-bold mb-6">₹0<span className="text-lg font-normal">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Jobs with contact info</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>10 AI emails per month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Basic job matching</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/api/auth/google/simple'}>
                  Start Free
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="glass-card p-8 relative border-primary/50"
              >
                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-accent">Popular</Badge>
                <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
                <p className="text-muted-foreground mb-6">For serious job seekers</p>
                <div className="text-4xl font-bold mb-6">₹129<span className="text-lg font-normal">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>All jobs (with & without contacts)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Unlimited AI emails</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Advanced job matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full btn-primary" onClick={() => window.location.href = '/api/auth/google/simple'}>
                  Upgrade to Pro
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="text-center mb-24"
          >
            <div className="glass-card p-12 bg-gradient-to-br from-primary/5 to-accent/5 max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-4">Ready to 10x Your Job Search?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of professionals who've found their dream jobs faster with AI-powered automation
              </p>
              <button
                onClick={() => window.location.href = '/api/auth/google/simple'}
                className="btn-primary text-lg px-10 py-5 group inline-flex items-center gap-3"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Get Started Now - It's Free</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • 5-minute setup • Cancel anytime
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Footer with policy links */}
      <Footer />
      

    </div>
  );
}