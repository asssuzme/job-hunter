import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Brain, Zap, Shield, Globe, Activity, Database, Terminal, Cpu, Binary, Network } from "lucide-react";
import { useEffect, useState } from "react";

export default function Landing() {
  const { isLoading } = useAuth();
  const [matrixText, setMatrixText] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState("INITIALIZING");

  useEffect(() => {
    // Generate matrix rain effect
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()";
    const columns = Math.floor(window.innerWidth / 20);
    const drops: string[] = [];
    
    for (let i = 0; i < columns; i++) {
      drops.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    
    setMatrixText(drops);

    // Simulate system initialization
    setTimeout(() => setSystemStatus("ONLINE"), 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="h-20 w-20 border-4 border-primary/20 rounded-full animate-spin"></div>
          <div className="absolute inset-0 h-20 w-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background cyber-grid">
      {/* Matrix rain effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {matrixText.map((char, i) => (
          <div
            key={i}
            className="matrix-rain absolute text-xs opacity-30"
            style={{
              left: `${(i * 20) % window.innerWidth}px`,
              animationDelay: `${Math.random() * 10}s`,
              fontSize: `${Math.random() * 10 + 10}px`
            }}
          >
            {char}
          </div>
        ))}
      </div>

      {/* Scanning lines */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="scanner absolute inset-0"></div>
      </div>
      
      <div className="max-w-5xl mx-auto text-center space-y-8 tech-glass p-12 rounded-lg relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Activity className={`h-8 w-8 ${systemStatus === 'ONLINE' ? 'text-primary animate-pulse' : 'text-primary/40'}`} />
            <span className="text-primary font-mono text-sm uppercase tracking-widest terminal-cursor">
              SYSTEM {systemStatus}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold gradient-text tracking-tight">
            NEXUS JOB HUNTER
          </h1>
          <div className="flex items-center justify-center space-x-4">
            <div className="h-px bg-primary/50 flex-1"></div>
            <p className="text-lg text-primary font-mono">[ AI-POWERED RECRUITMENT SYSTEM ]</p>
            <div className="h-px bg-primary/50 flex-1"></div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light">
            Advanced LinkedIn data extraction with neural network filtering 
            and quantum-enhanced email generation protocols
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="tech-card p-6 space-y-3 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-primary/60 font-mono">MODULE_01</span>
            </div>
            <h3 className="font-bold text-lg text-primary">NEURAL FILTERING</h3>
            <p className="text-sm text-muted-foreground">
              Deep learning algorithms analyze job compatibility with 99.7% accuracy
            </p>
            <div className="h-1 bg-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary processing-bar"></div>
            </div>
          </div>
          
          <div className="tech-card p-6 space-y-3 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Network className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-primary/60 font-mono">MODULE_02</span>
            </div>
            <h3 className="font-bold text-lg text-primary">DATA EXTRACTION</h3>
            <p className="text-sm text-muted-foreground">
              Multi-threaded scraping engine with real-time data enrichment
            </p>
            <div className="h-1 bg-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary processing-bar"></div>
            </div>
          </div>
          
          <div className="tech-card p-6 space-y-3 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs text-primary/60 font-mono">MODULE_03</span>
            </div>
            <h3 className="font-bold text-lg text-primary">DATA PERSISTENCE</h3>
            <p className="text-sm text-muted-foreground">
              Encrypted storage with blockchain-level security protocols
            </p>
            <div className="h-1 bg-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary processing-bar"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-4">
            <Terminal className="h-5 w-5 text-primary/60" />
            <span className="text-sm font-mono text-primary/60 terminal-cursor">INITIALIZE_AUTHENTICATION_PROTOCOL</span>
          </div>
          
          <button
            className="tech-btn text-lg group relative"
            onClick={() => window.location.href = '/api/auth/google/simple'}
          >
            <Globe className="inline-block mr-2 h-5 w-5" />
            <span>AUTHENTICATE WITH GOOGLE</span>
            <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center justify-center space-x-8 text-xs font-mono text-primary/60">
            <span className="flex items-center space-x-1">
              <Binary className="h-3 w-3" />
              <span>[STATUS: OPERATIONAL]</span>
            </span>
            <span className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>[SECURITY: MAXIMUM]</span>
            </span>
            <span>[VERSION: 3.0.1]</span>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center">
        <p className="text-sm font-mono text-primary/40">
          &lt;/&gt; ENGINEERED FOR ELITE JOB HUNTERS
        </p>
      </footer>
    </div>
  );
}