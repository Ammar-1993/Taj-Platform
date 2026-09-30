"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Shield, Search } from "lucide-react";
import { ParentDashboard } from "@/components/dashboard/ParentDashboard";
import { StudentTeacherDashboard } from "@/components/dashboard/StudentTeacherDashboard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ProfileDropdown } from "@/components/layout";
import dynamic from "next/dynamic";
const ReviewModal = dynamic(
  () =>
    import("@/components/dashboard/ReviewModal").then((mod) => mod.ReviewModal),
  { ssr: false },
);
import { Role } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const isTeacher =
    user?.roles?.some((r: Role) => r.name === "teacher") || false;
  const isParent = user?.roles?.some((r: Role) => r.name === "parent") || false;

  const searchParams = useSearchParams();

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
    refreshAll,
    dismissPendingReview,
    markNotificationAsRead,
  } = useDashboardData(user, isParent, isTeacher);

  const hasRefetched = useRef(false);

  // تحديث هادئ وفوري للرصيد وبيانات لوحة التحكم في الخلفية عند العودة من بوابة الدفع دون إزعاج المستخدم برسائل منبثقة مكررة
  useEffect(() => {
    if (hasRefetched.current) return;

    if (searchParams.get('payment') === 'success' || searchParams.get('status') === 'paid') {
      hasRefetched.current = true;
      
      // مزامنة صامتة للبيانات والمحفظة في الخلفية
      setTimeout(async () => {
        await refreshAll();
      }, 400);

      // تنظيف معلمات الرابط للحفاظ على نظافة الـ URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, refreshAll]);

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
    <div className="min-h-screen p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto space-y-6">
        <PageHeader
          title={`مرحباً، ${user.name}`}
          subtitle={
            isParent
              ? "بوابة أولياء الأمور للمتابعة الشاملة وحجوزات نفقات الطلاب(الأبناء)"
              : isTeacher
                ? "بوابة المعلم لإدارة الحصص والأرباح"
                : "بوابة الطالب لإدارة الحجوزات والمحفظة"
          }
          icon={<Shield className="w-7 h-7" />}
          variant="indigo"
          showBack={false}
          actions={
            <div className="flex items-center gap-3">
              {!isTeacher && (
                <Button
                  asChild
                  variant="outline"
                  className="bg-white/20 border-white/20 text-white hover:bg-white/30 h-11 px-5 rounded-taj-md"
                >
                  <Link href="/">
                    <Search className="w-4 h-4 mr-2" />
                    {isParent
                      ? "اختر المعلم المفضل لأبنائك"
                      : "اختر معلمك المفضل"}
                  </Link>
                </Button>
              )}
              <div className="hidden md:block mr-2">
                <ProfileDropdown
                  userName={user.name}
                  imageUrl={user.avatar_url || null}
                  settingsPath="/dashboard/settings"
                  onLogout={logout}
                />
              </div>
            </div>
          }
        />

        {isParent ? (
          <ParentDashboard
            parentData={parentData}
            wallet={wallet}
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
            onRefresh={refreshAll}
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
