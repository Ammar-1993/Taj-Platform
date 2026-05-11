"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Menu } from "lucide-react";
import { useNavLinks } from "@/hooks/useNavLinks";

import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const navLinks = useNavLinks();
  
  // Default state is closed (true) to save screen real estate
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside className={cn(
      "hidden md:flex flex-col bg-white border-l border-slate-100 h-screen sticky top-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "border-b border-slate-100 flex items-center transition-all duration-300",
        isCollapsed ? "p-4 justify-center" : "p-6 justify-between"
      )}>
        {!isCollapsed && <h2 className="text-2xl font-black text-brand-600 truncate tracking-tight">منصة تاج 👑</h2>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "relative group text-slate-400 hover:text-brand-600 transition-all p-2 rounded-taj-md hover:bg-brand-50 flex-shrink-0 active:scale-90",
            isCollapsed && "bg-slate-50"
          )}
        >
          <Menu className="w-5 h-5" />
          {/* Tooltip */}
          {isCollapsed && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-slate-800 text-sm font-bold rounded-md shadow-md border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              توسيع القائمة
              <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-t border-r border-slate-100 rotate-45" />
            </span>
          )}
        </button>
      </div>
      
      <nav className={cn(
        "flex-1 overflow-y-auto space-y-1.5 py-4 scrollbar-hide",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "relative group flex items-center rounded-taj-md font-bold transition-all duration-200",
                isActive 
                  ? "bg-brand-50 text-brand-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-brand-600",
                isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110",
                isActive ? "text-brand-600" : "group-hover:text-brand-600"
              )} />
              {!isCollapsed && (
                <span className={cn(
                  "truncate transition-colors",
                  isActive ? "text-brand-700" : "group-hover:text-brand-600"
                )}>
                  {link.name}
                </span>
              )}
              {isActive && !isCollapsed && (
                <div className="absolute right-0 w-1 h-6 bg-brand-600 rounded-l-full animate-fade-up" />
              )}
              {/* Tooltip */}
              {isCollapsed && (
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-slate-800 text-sm font-bold rounded-md shadow-md border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {link.name}
                  <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-t border-r border-slate-100 rotate-45" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className={cn(
        "border-t border-slate-100 py-4 flex flex-col items-center gap-3",
        isCollapsed ? "px-2" : "px-4"
      )}>
        <button 
          onClick={logout}
          className={cn(
            "relative group flex items-center w-full text-rose-500 hover:bg-rose-50 rounded-taj-md font-bold transition-all duration-200 active:scale-95",
            isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1" />
          {!isCollapsed && <span className="truncate">تسجيل الخروج</span>}
          {/* Tooltip */}
          {isCollapsed && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-rose-600 text-sm font-bold rounded-md shadow-md border border-rose-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              تسجيل الخروج
              <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-t border-r border-rose-100 rotate-45" />
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
