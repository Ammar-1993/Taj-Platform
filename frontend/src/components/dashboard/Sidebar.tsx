"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavLinks } from "@/hooks/useNavLinks";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const navLinks = useNavLinks();
  
  // Default state is closed (true) to save screen real estate
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside className={`hidden md:flex flex-col bg-white border-l border-gray-100 h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`border-b border-gray-100 flex items-center transition-all duration-300 ${isCollapsed ? 'p-4 justify-center' : 'p-6 justify-between'}`}>
        {!isCollapsed && <h2 className="text-2xl font-bold text-indigo-600 truncate">منصة تاج</h2>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-gray-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50 flex-shrink-0 ${isCollapsed ? 'bg-gray-50' : ''}`}
          title={isCollapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className={`flex-1 overflow-y-auto space-y-2 py-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              title={isCollapsed ? link.name : undefined}
              className={`flex items-center rounded-lg font-bold transition-all duration-300 overflow-hidden ${
                isActive 
                  ? `bg-indigo-50 text-indigo-700 ${isCollapsed ? '' : 'border-r-4 border-indigo-600'}` 
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
              } ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive && isCollapsed ? 'text-indigo-600' : ''}`} />
              {!isCollapsed && <span className="truncate">{link.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className={`border-t border-gray-100 py-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <button 
          onClick={logout}
          title={isCollapsed ? "تسجيل الخروج" : undefined}
          className={`flex items-center w-full text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-all duration-300 overflow-hidden ${isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="truncate">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
