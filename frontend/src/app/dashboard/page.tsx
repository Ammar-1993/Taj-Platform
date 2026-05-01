"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Shield, Search, LogOut } from "lucide-react";
import { ParentDashboard } from "@/components/dashboard/ParentDashboard";
import { StudentTeacherDashboard } from "@/components/dashboard/StudentTeacherDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import dynamic from "next/dynamic";
const ReviewModal = dynamic(() => import("@/components/dashboard/ReviewModal").then(mod => mod.ReviewModal), { ssr: false });
import { Role } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const isTeacher = user?.roles?.some((r: Role) => r.name === "teacher") || false;
  const isParent = user?.roles?.some((r: Role) => r.name === "parent") || false;

  const {
    wallet,
    bookings,
    bookingPage,
    setBookingPage,
    bookingLastPage,
    parentData,
    parentBookingPage,
    setParentBookingPage,
    parentBookingLastPage,
    notifications,
    pendingReview,
    dataLoading,
    fetchDashboardData,
    dismissPendingReview,
    markNotificationAsRead,
  } = useDashboardData(user, isParent, isTeacher);

  useEffect(() => {
    // حماية المسار: إذا انتهى التحميل ولم نجد مستخدماً، نوجهه لتسجيل الدخول
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={`مرحباً، ${user.name}`}
          subtitle={
            isParent
              ? "لوحة المراقبة الشاملة لحجوزات ونفقات الأبناء"
              : isTeacher
              ? "بوابة المعلم لإدارة الحصص والأرباح"
              : "بوابة الطالب لإدارة الحجوزات والمحفظة"
          }
          icon={<Shield className="w-7 h-7" />}
          variant="indigo"
          showBack={false}
          actions={
            <>
              {!isTeacher && (
                <Button asChild variant="outline" className="bg-white/20 border-white/20 text-white hover:bg-white/30 h-11 px-5 rounded-taj-md">
                  <Link href="/">
                    <Search className="w-4 h-4 mr-2" />
                    {isParent ? "اختر المعلم المفضل لأبنائك" : "اختر معلمك المفضل"}
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={logout}
                className="md:hidden bg-rose-500/20 hover:bg-rose-500/40 text-white border border-rose-500/30 h-11 px-5 rounded-taj-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                تسجيل الخروج
              </Button>
            </>
          }
        />

        {isParent ? (
          <ParentDashboard
            parentData={parentData}
            parentBookingPage={parentBookingPage}
            parentBookingLastPage={parentBookingLastPage}
            setParentBookingPage={setParentBookingPage}
            loading={dataLoading}
          />
        ) : (
          <StudentTeacherDashboard
            isTeacher={isTeacher}
            wallet={wallet}
            bookings={bookings}
            bookingPage={bookingPage}
            bookingLastPage={bookingLastPage}
            setBookingPage={setBookingPage}
            notifications={notifications}
            markNotificationAsRead={markNotificationAsRead}
            onRefresh={fetchDashboardData}
            loading={dataLoading}
          />
        )}
      </div>

      <ReviewModal
        pendingReview={pendingReview}
        onSuccess={() => {
          dismissPendingReview();
          fetchDashboardData();
        }}
        onClose={() => dismissPendingReview()}
      />
    </div>
  );
}
