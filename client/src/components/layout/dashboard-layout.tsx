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
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="mobileTech1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="50%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="mobileTech2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              
              <rect x="6" y="6" width="36" height="36" rx="6" fill="#0A0E1B" />
              <rect x="6" y="6" width="36" height="36" rx="6" stroke="url(#mobileTech1)" strokeWidth="1.5" fill="none" opacity="0.8" />
              
              <g>
                <path d="M24 14 L18 34 L21 34 L22.5 28 L25.5 28 L27 34 L30 34 L24 14 Z" 
                      fill="url(#mobileTech1)" />
                
                <circle cx="24" cy="14" r="2" fill="url(#mobileTech2)" />
                <circle cx="18" cy="34" r="2" fill="url(#mobileTech2)" />
                <circle cx="30" cy="34" r="2" fill="url(#mobileTech2)" />
              </g>
            </svg>
            <h1 className="text-lg font-black tracking-wider uppercase gradient-text">AUTOAPPLY.AI</h1>
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