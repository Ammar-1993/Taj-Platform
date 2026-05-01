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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ SIDEBAR ============ */}
        <div className="lg:col-span-1">
          {loading ? (
            <Card variant="glass" className="p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-gray-200 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                </div>
              ))}
            </Card>
          ) : (
            <WalletWidget wallet={wallet} isTeacher={isTeacher} />
          )}
        </div>

        {/* ============ MAIN CONTENT ============ */}
        <Card variant="glass" className="lg:col-span-2 animate-fade-up-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl text-text-primary flex items-center gap-2">
              <span className="w-9 h-9 bg-brand-50 text-brand-600 rounded-taj-md flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </span>
              سجل الحجوزات
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4">
              {/* Notifications skeleton */}
              <div className="bg-gray-100 p-4 rounded-xl animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              {/* Table skeleton */}
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-gray-100 p-4 rounded-xl animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
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

              <ResponsiveBookingTable 
                bookings={bookings} 
                isTeacher={isTeacher}
                onCancelClick={(id: number) => setConfirmState({ isOpen: true, type: "cancel", bookingId: id })}
                onCompleteClick={(id: number) => setConfirmState({ isOpen: true, type: "complete", bookingId: id })}
              />

              <PaginationControls
                page={bookingPage}
                totalPages={bookingLastPage}
                onPageChange={setBookingPage}
                isLoading={loading}
              />
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
