import React from "react";
import Link from "next/link";
import { LogOut, Shield, Search } from "lucide-react";
import { User } from "@/types";

interface DashboardHeaderProps {
  user: User;
  isTeacher: boolean;
  isParent: boolean;
  logout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, isTeacher, isParent, logout }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-800 p-6 md:p-8 rounded-2xl shadow-md text-white">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-10">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-300 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Left: Brand & Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-white/10 rounded-lg shrink-0">
                  <Shield className="w-6 h-6 text-indigo-100" />
              </span>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                مرحباً، {user.name}
              </h1>
            </div>
            <p className="text-indigo-200 text-xs md:text-sm lg:text-base font-medium leading-relaxed">
              {isParent
                ? "بوابة أولياء الأمور للمتابعة الشاملة وحجوزات نفقات الطلاب(الأبناء)"
                : isTeacher
                ? "بوابة المعلم لإدارة الحصص والأرباح"
                : "بوابة الطالب لإدارة الحجوزات والمحفظة"}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto mt-2 lg:mt-0">
          {!isTeacher && (
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-bold text-white transition-all duration-200 border border-white/20 shadow-sm whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span>{isParent ? "اختر المعلم المفضل لأبنائك" : "اختر معلمك المفضل"}</span>
            </Link>
          )}

          {/* Mobile Logout */}
          <button
            onClick={logout}
            className="lg:hidden flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-bold transition-all duration-200 border border-rose-400 text-white shadow-sm"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

