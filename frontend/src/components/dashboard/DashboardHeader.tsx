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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          مرحباً بك، {user.name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isParent
            ? "لوحة المراقبة الشاملة لحجوزات ونفقات الأبناء"
            : isTeacher
            ? "بوابة المعلم لإدارة الحصص والأرباح"
            : "بوابة الطالب لإدارة الحجوزات والمحفظة"}
        </p>
      </div>
      <div className="flex gap-3">
        {isParent ? (
          <>
            <Link
              href="/dashboard/children"
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
            >
              إدارة الأبناء 👨‍👩‍👧‍👦
            </Link>
            <Link
              href="/dashboard/support"
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition border border-blue-100"
            >
              الدعم الفني 🛟
            </Link>
          </>
        ) : (
          <>
            {isTeacher && (
              <Link
                href="/dashboard/profile"
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1 border border-indigo-100"
              >
                إكمال الملف الشخصي
              </Link>
            )}
            <Link
              href="/dashboard/support"
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition border border-blue-100"
            >
              الدعم الفني 🛟
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
            >
              الرئيسية
            </Link>
          </>
        )}

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
