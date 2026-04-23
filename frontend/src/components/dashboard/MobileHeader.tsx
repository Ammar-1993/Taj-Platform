"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Menu,
  X,
  LayoutDashboard, 
  CalendarDays, 
  CreditCard, 
  User, 
  LifeBuoy, 
  LogOut,
  Users,
  Search
} from "lucide-react";

export default function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
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

  const isTeacher = user?.roles?.some(r => r.name === 'teacher');
  const isParent = user?.roles?.some(r => r.name === 'parent');
  const isStudent = user?.roles?.some(r => r.name === 'student');

  const navLinks = [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "البحث عن معلمين", href: "/dashboard/teachers", icon: Search, show: isParent || isStudent },
    { name: "الجدول والمواعيد", href: "/dashboard/schedule", icon: CalendarDays, show: isTeacher },
    { name: "سحب الأرباح", href: "/dashboard/payout", icon: CreditCard, show: isTeacher },
    { name: "الملف الشخصي", href: "/dashboard/profile", icon: User, show: isTeacher },
    { name: "إدارة الأبناء", href: "/dashboard/children", icon: Users, show: isParent },
    { name: "شحن المحفظة", href: "/dashboard/top-up", icon: CreditCard, show: isParent || isStudent },
    { name: "إعدادات الطالب", href: "/dashboard/student-profile", icon: User, show: isStudent },
    { name: "الدعم الفني", href: "/dashboard/support", icon: LifeBuoy, show: true },
  ];

  return (
    <>
      {/* الشريط العلوي الثابت للموبايل */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <h2 className="text-xl font-bold text-indigo-600">منصة تاج</h2>
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 -mr-2 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* خلفية التعتيم (Overlay) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* درج القائمة الجانبية (Slide-out Drawer) */}
      <div 
        className={`md:hidden fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-600">منصة تاج</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -ml-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2" dir="rtl">
          {navLinks.filter(link => link.show).map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-600" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </>
  );
}
