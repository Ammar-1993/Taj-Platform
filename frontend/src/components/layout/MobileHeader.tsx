"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useNavLinks } from "@/hooks/useNavLinks";
import ProfileDropdown from "./ProfileDropdown";

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const navLinks = useNavLinks();

  // إغلاق القائمة الجانبية عند تغيير المسار (الانتقال لصفحة جديدة)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // منع التمرير في الخلفية عندما تكون القائمة مفتوحة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  return (
    <>
      {/* الشريط العلوي الثابت للموبايل - بتصميم RTL عصري */}
      <header className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        {/* اليسار: قائمة الملف الشخصي (معدلة لتجنب القطع) */}
        <div className="flex items-center">
          {user && (
            <ProfileDropdown 
              userName={user.name}
              imageUrl={user.avatar_url || null}
              settingsPath="/dashboard/settings"
              onLogout={logout}
            />
          )}
        </div>

        {/* المنتصف: البراند */}
        <h2 className="text-lg font-bold text-brand-600 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          منصة تاج التعليمية 👑
        </h2>
        
        {/* اليمين: زر القائمة الجانبية (البداية الطبيعية في RTL) */}
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-text-secondary hover:bg-brand-50 hover:text-brand-600 rounded-taj-sm transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* خلفية التعتيم (Overlay) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* درج القائمة الجانبية (Slide-out Drawer) */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-surface-subtle flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-600">منصة تاج التعليمية 👑</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -ml-2 text-text-muted hover:bg-surface-subtle hover:text-text-primary rounded-taj-sm transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2" dir="rtl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-taj-md font-bold transition-all ${
                  isActive 
                    ? "bg-brand-50 text-brand-700 border-r-4 border-brand-600" 
                    : "text-text-secondary hover:bg-surface-subtle hover:text-brand-600"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-text-muted'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-surface-subtle">
          <button 
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-error-text hover:bg-error-bg rounded-taj-md font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </>
  );
}
