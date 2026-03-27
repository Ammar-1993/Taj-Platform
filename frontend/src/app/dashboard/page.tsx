/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ParentDashboard } from "@/components/dashboard/ParentDashboard";
import { StudentTeacherDashboard } from "@/components/dashboard/StudentTeacherDashboard";
import { ReviewModal } from "@/components/dashboard/ReviewModal";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const isTeacher = user?.roles?.some((r: any) => r.name === "teacher") || false;
  const isParent = user?.roles?.some((r: any) => r.name === "parent") || false;

  const {
    wallet,
    bookings,
    parentData,
    notifications,
    pendingReview,
    dataLoading,
    fetchDashboardData,
    setPendingReview,
    markNotificationAsRead,
  } = useDashboardData(user, isParent, isTeacher);

  useEffect(() => {
    // حماية المسار: إذا انتهى التحميل ولم نجد مستخدماً، نوجهه لتسجيل الدخول
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold animate-pulse text-gray-500">
        جاري تحميل لوحة التحكم...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <DashboardHeader
          user={user}
          isTeacher={isTeacher}
          isParent={isParent}
          logout={logout}
        />

        {isParent ? (
          <ParentDashboard user={user} parentData={parentData} />
        ) : (
          <StudentTeacherDashboard
            isTeacher={isTeacher}
            wallet={wallet}
            bookings={bookings}
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            onRefresh={fetchDashboardData}
          />
        )}
      </div>

      <ReviewModal
        pendingReview={pendingReview}
        onSuccess={() => {
          setPendingReview(null);
          fetchDashboardData();
        }}
        onClose={() => setPendingReview(null)}
      />
    </div>
  );
}
