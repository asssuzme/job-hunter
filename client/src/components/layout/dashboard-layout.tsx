import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  user?: any;
  onLogout: () => void;
  title?: string;
}

export function DashboardLayout({ children, user, onLogout, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mobileLogo1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="mobileLogo2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              
              <rect x="5" y="5" width="32" height="32" rx="8" fill="url(#mobileLogo1)" opacity="0.1" />
              
              <g>
                <path d="M12 10 L12 32 L30 32 L30 16 L24 10 Z" 
                      fill="white" 
                      opacity="0.9" />
                <path d="M12 10 L12 32 L30 32 L30 16 L24 10 L12 10 Z M24 10 L24 16 L30 16" 
                      stroke="url(#mobileLogo1)" 
                      strokeWidth="2" 
                      strokeLinejoin="round"
                      fill="none" />
                
                <g transform="translate(21, 21)">
                  <circle cx="0" cy="0" r="6" fill="url(#mobileLogo2)" />
                  <path d="M-2.5 0 A2.5 2.5 0 0 1 2.5 0 L1.5 -1 L2.5 0 L1.5 1 M2.5 0 A2.5 2.5 0 0 1 -2.5 0 L-1.5 1 L-2.5 0 L-1.5 -1" 
                        stroke="white" 
                        strokeWidth="1.3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none" />
                </g>
              </g>
            </svg>
            <h1 className="text-lg font-semibold gradient-text">autoapply.ai</h1>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="md:pl-64">
        <Topbar title={title} className="hidden md:block" />
        
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}