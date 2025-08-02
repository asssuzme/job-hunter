import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Briefcase,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: Search,
    label: "Job Search",
    href: "/search",
  },
  {
    icon: Briefcase,
    label: "Applications",
    href: "/applications",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

interface SidebarProps {
  user?: any;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, onLogout, isOpen = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use props if provided, otherwise use internal state
  const isSidebarOpen = isOpen !== undefined ? isOpen : internalOpen;
  const handleClose = onClose || (() => setInternalOpen(false));

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isSidebarOpen || window.innerWidth >= 768 ? 0 : -320 }}
        transition={{ type: "spring", damping: 20 }}
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card border-r z-50",
          "flex flex-col",
          "md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {/* SaaS Neon Logo */}
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <defs>
                <linearGradient id="sidebarSaasMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="50%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                
                <linearGradient id="sidebarSaasBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                
                <filter id="sidebarNeon" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <rect x="6" y="6" width="36" height="36" rx="10" fill="white" fillOpacity="0.05" />
              <rect x="6" y="6" width="36" height="36" rx="10" stroke="url(#sidebarSaasMain)" strokeWidth="1" fillOpacity="0" strokeOpacity="0.3" />
              
              <g filter="url(#sidebarNeon)">
                <path d="M24 12 L16 32 L19 32 L21 27 L27 27 L29 32 L32 32 L24 12 Z M22.5 23 L25.5 23 L24 18 L22.5 23 Z" 
                      fill="url(#sidebarSaasMain)" />
                
                <line x1="21" y1="12" x2="27" y2="12" stroke="url(#sidebarSaasBlue)" strokeWidth="1.5" strokeLinecap="round" />
                
                <circle cx="24" cy="12" r="1.5" fill="url(#sidebarSaasBlue)" />
                <circle cx="16" cy="32" r="1" fill="url(#sidebarSaasBlue)" opacity="0.8" />
                <circle cx="32" cy="32" r="1" fill="url(#sidebarSaasBlue)" opacity="0.8" />
              </g>
            </svg>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">AUTOAPPLY</span>
                <span className="text-cyan-400">.AI</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "sidebar-item flex items-center gap-3",
                      isActive && "sidebar-item-active"
                    )}
                    onClick={handleClose}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t space-y-4">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={toggleTheme}
          >
            {theme === "light" ? (
              <>
                <Moon className="h-4 w-4 mr-2" />
                Dark mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4 mr-2" />
                Light mode
              </>
            )}
          </Button>

          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.firstName?.[0] || user.email?.[0] || "U"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* Logout button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.aside>
    </>
  );
}