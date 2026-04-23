"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";
import { useNavLinks } from "@/hooks/useNavLinks";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const navLinks = useNavLinks();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-100 h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-indigo-600">منصة تاج </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors ${
                isActive 
                  ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-rose-600 hover:bg-rose-50 rounded-lg font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
