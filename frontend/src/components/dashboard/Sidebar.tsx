"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  CalendarDays, 
  CreditCard, 
  User, 
  LifeBuoy, 
  LogOut,
  Users,
  Search
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
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
    <aside className="hidden md:flex flex-col w-64 bg-white border-l border-gray-100 h-screen sticky top-0">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-indigo-600">منصة تاج </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navLinks.filter(link => link.show).map((link) => {
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
