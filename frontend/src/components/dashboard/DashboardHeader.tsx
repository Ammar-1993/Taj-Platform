import React from "react";
import Link from "next/link";
import { User } from "@/types";

interface DashboardHeaderProps {
  user: User;
  isTeacher: boolean;
  isParent: boolean;
  logout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, isTeacher, isParent, logout }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-l from-indigo-700 via-indigo-600 to-purple-700 p-6 md:p-8 rounded-3xl shadow-xl text-white animate-fade-in-up">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-10">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-300 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        {/* Left: Brand & Welcome */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl drop-shadow-lg animate-subtle-pulse">👑</span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
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

        {/* Right: Action Buttons (Glassmorphism) */}
        <div className="flex flex-wrap gap-2">
          {isParent ? (
            <>
              <Link
                href="/dashboard/children"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-sm font-bold transition-all duration-200 border border-white/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                إدارة الأبناء 👨‍👩‍👧‍👦
              </Link>
              <Link
                href="/dashboard/support"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 hover:shadow-lg hover:-translate-y-0.5"
              >
                الدعم الفني 🛟
              </Link>
            </>
          ) : (
            <>
              {isTeacher && (
                <Link
                  href="/dashboard/profile"
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-sm font-bold transition-all duration-200 border border-white/20 hover:shadow-lg hover:-translate-y-0.5"
                >
                  إكمال الملف الشخصي ✏️
                </Link>
              )}
              <Link
                href="/dashboard/support"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 hover:shadow-lg hover:-translate-y-0.5"
              >
                الدعم الفني 🛟
              </Link>
              <Link
                href="/"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-all duration-200 border border-white/10 hover:shadow-lg hover:-translate-y-0.5"
              >
                الرئيسية
              </Link>
            </>
          )}

          <button
            onClick={logout}
            className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-sm rounded-xl text-sm font-bold transition-all duration-200 border border-red-400/20 text-red-100 hover:text-white hover:shadow-lg hover:-translate-y-0.5"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};
