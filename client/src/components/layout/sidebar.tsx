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
            {/* Modern Logo */}
            <svg width="36" height="36" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <defs>
                <linearGradient id="sidebarLogoMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="sidebarLogoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              
              <rect x="3" y="3" width="36" height="36" rx="10" fill="url(#sidebarLogoMain)" opacity="0.1" />
              
              <g>
                <path d="M12 10 L12 32 L30 32 L30 16 L24 10 Z" 
                      fill="white" 
                      opacity="0.95" />
                <path d="M12 10 L12 32 L30 32 L30 16 L24 10 L12 10 Z M24 10 L24 16 L30 16" 
                      stroke="url(#sidebarLogoMain)" 
                      strokeWidth="2" 
                      strokeLinejoin="round"
                      fill="none" />
                
                <g transform="translate(21, 21)">
                  <circle cx="0" cy="0" r="7" fill="url(#sidebarLogoAccent)" />
                  <path d="M-3 0 A3 3 0 0 1 3 0 L2 -1 L3 0 L2 1 M3 0 A3 3 0 0 1 -3 0 L-2 1 L-3 0 L-2 -1" 
                        stroke="white" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        fill="none" />
                </g>
              </g>
            </svg>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">autoapply</span>
                <span className="text-muted-foreground">.ai</span>
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