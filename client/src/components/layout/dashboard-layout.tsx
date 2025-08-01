import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  user?: any;
  onLogout: () => void;
  title?: string;
}

export function DashboardLayout({ children, user, onLogout, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} onLogout={onLogout} />
      
      <div className="md:pl-64">
        <Topbar title={title} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}