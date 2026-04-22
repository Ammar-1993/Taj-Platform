import React from "react";
import { LogOut, Shield } from "lucide-react";
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

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        {/* Left: Brand & Welcome */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-white/10 rounded-lg">
                <Shield className="w-6 h-6 text-indigo-100" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              مرحباً، {user.name}
            </h1>
          </div>
          <p className="text-indigo-200 text-sm md:text-base font-medium">
            {isParent
              ? "لوحة المراقبة الشاملة لحجوزات ونفقات الأبناء"
              : isTeacher
              ? "بوابة المعلم لإدارة الحصص والأرباح"
              : "بوابة الطالب لإدارة الحجوزات والمحفظة"}
          </p>
        </div>

        {/* Right: Action Buttons (Mobile nav focus) */}
        <div className="flex flex-wrap gap-2 md:hidden">
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 border border-rose-400 text-white shadow-sm flex items-center gap-2"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

