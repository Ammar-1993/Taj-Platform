import React, { useState } from "react";
import dynamic from "next/dynamic";
const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog"), { ssr: false });
import api from "@/lib/axios";
import { Wallet, Booking, AppNotification } from "@/types";
import toast from "react-hot-toast";
import { showApiError } from "@/hooks/useApiError";
import { Card } from "@/components/ui/Card";
import { ClipboardList } from "lucide-react";
import { WalletWidget } from "./wallet";
import { TeacherNotifications, ResponsiveBookingTable } from "./bookings";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

interface StudentTeacherDashboardProps {
  isTeacher: boolean;
  wallet: Wallet | null;
  bookings: Booking[];
  bookingPage: number;
  bookingLastPage: number;
  setBookingPage: (page: number) => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const StudentTeacherDashboard: React.FC<
  StudentTeacherDashboardProps
> = ({
  isTeacher,
  wallet,
  bookings,
  bookingPage,
  bookingLastPage,
  setBookingPage,
  notifications,
  markNotificationAsRead,
  onRefresh,
  loading = false,
}) => {
  const { isCollapsed } = useSidebar();

  // حالات مربعات التأكيد
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: "cancel" | "complete";
    bookingId: number;
  }>({ isOpen: false, type: "cancel", bookingId: 0 });
  const [actionLoading, setActionLoading] = useState(false);

  const handleCancelClass = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/bookings/${confirmState.bookingId}/cancel`);
      toast.success(res.data.message || "تم إلغاء الحصة بنجاح.");
      onRefresh();
    } catch (err: unknown) {
      showApiError(err, "حدث خطأ أثناء الإلغاء");
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: "cancel", bookingId: 0 });
    }
  };

  const handleCompleteClass = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(
        `/bookings/${confirmState.bookingId}/complete`,
      );
      toast.success(res.data.message || "تم إنهاء الحصة وإيداع الأرباح.");
      onRefresh();
    } catch (err: unknown) {
      showApiError(err, "حدث خطأ أثناء إنهاء الحصة");
    } finally {
      setActionLoading(false);
      setConfirmState({ isOpen: false, type: "complete", bookingId: 0 });
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-5 xl:gap-6 items-stretch">
        {/* ============ SIDEBAR / WALLET COLUMN ============ */}
        <div className={cn(
          "w-full lg:shrink-0 space-y-6 transition-all duration-300 ease-in-out",
          isCollapsed 
            ? "lg:w-[325px] xl:w-[355px] 2xl:w-[390px]" 
            : "lg:w-[275px] xl:w-[305px] 2xl:w-[335px]"
        )}>
          {loading ? (
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="animate-pulse bg-white/60 backdrop-blur-xl border border-white/80 p-5 sm:p-6 rounded-[2rem] shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-200 rounded-2xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-slate-200 rounded-xl w-3/4"></div>
                <div className="h-12 bg-slate-200 rounded-2xl w-full"></div>
              </div>
              <div className="animate-pulse h-48 bg-white/50 backdrop-blur-xl border border-white/80 rounded-[2rem]"></div>
              <div className="animate-pulse h-36 bg-white/50 backdrop-blur-xl border border-white/80 rounded-[2rem]"></div>
            </div>
          ) : (
            <WalletWidget wallet={wallet} isTeacher={isTeacher} />
          )}
        </div>

        {/* ============ MAIN CONTENT ============ */}
        <Card variant="glass" className="flex-1 min-w-0 h-full flex flex-col p-4 sm:p-6 lg:p-5 xl:p-6 border border-white/80 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.03)] rounded-[2rem]">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5 sm:mb-6">
            <h3 className="font-black text-lg sm:text-xl text-text-primary flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-2xs">
                <ClipboardList className="w-5 h-5" />
              </span>
              سجل الحجوزات
            </h3>
            {bookings.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-100/80 px-3 py-1 rounded-full">
                <span>{bookings.length}</span>
                <span>حصة مسجلة</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {/* Notifications skeleton */}
              <div className="bg-slate-100 p-4 rounded-2xl animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              {/* Table skeleton */}
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex justify-between items-center animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-slate-200 rounded-xl w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <TeacherNotifications 
                isTeacher={isTeacher} 
                notifications={notifications} 
                markNotificationAsRead={markNotificationAsRead} 
              />

              <div className="flex-1 min-w-0">
                <ResponsiveBookingTable 
                  bookings={bookings} 
                  isTeacher={isTeacher}
                  onCancelClick={(id: number) => setConfirmState({ isOpen: true, type: "cancel", bookingId: id })}
                  onCompleteClick={(id: number) => setConfirmState({ isOpen: true, type: "complete", bookingId: id })}
                />
              </div>

              {bookings.length > 0 && (
                <div className="mt-8 border-t border-slate-100/80 pt-6">
                  <PaginationControls
                    page={bookingPage}
                    totalPages={bookingLastPage}
                    onPageChange={setBookingPage}
                    isLoading={loading}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* مربعات التأكيد */}
      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.type === "cancel"}
        title="إلغاء الحصة"
        message="هل أنت متأكد من إلغاء الحصة؟ سيتم إرجاع المبلغ للطالب."
        confirmText="تأكيد الإلغاء"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleCancelClass}
        onCancel={() =>
          setConfirmState({ isOpen: false, type: "cancel", bookingId: 0 })
        }
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen && confirmState.type === "complete"}
        title="إنهاء الحصة وتحصيل الأرباح"
        message="هل أنت متأكد من إنهاء الحصة؟ سيتم إيداع الأرباح في محفظتك الآن."
        confirmText="إنهاء وتحصيل"
        variant="info"
        isLoading={actionLoading}
        onConfirm={handleCompleteClass}
        onCancel={() =>
          setConfirmState({ isOpen: false, type: "complete", bookingId: 0 })
        }
      />
    </>
  );
};
