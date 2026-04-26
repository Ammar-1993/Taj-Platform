import React, { useState } from "react";
import dynamic from "next/dynamic";
const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog"), { ssr: false });
import api from "@/lib/axios";
import { Wallet, Booking, AppNotification } from "@/types";
import toast from "react-hot-toast";
import { showApiError } from "@/hooks/useApiError";
import { Card } from "@/components/ui/Card";
import { ClipboardList } from "lucide-react";
import { WalletWidget } from "./WalletWidget";
import { TeacherNotifications } from "./TeacherNotifications";
import { ResponsiveBookingTable } from "./ResponsiveBookingTable";

interface StudentTeacherDashboardProps {
  isTeacher: boolean;
  wallet: Wallet | null;
  bookings: Booking[];
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  onRefresh: () => void;
}

export const StudentTeacherDashboard: React.FC<
  StudentTeacherDashboardProps
> = ({
  isTeacher,
  wallet,
  bookings,
  notifications,
  markNotificationAsRead,
  onRefresh,
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
          <WalletWidget wallet={wallet} isTeacher={isTeacher} />
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

          <TeacherNotifications 
            isTeacher={isTeacher} 
            notifications={notifications} 
            markNotificationAsRead={markNotificationAsRead} 
          />

          <ResponsiveBookingTable 
            bookings={bookings} 
            isTeacher={isTeacher}
            onCancelClick={(id) => setConfirmState({ isOpen: true, type: "cancel", bookingId: id })}
            onCompleteClick={(id) => setConfirmState({ isOpen: true, type: "complete", bookingId: id })}
          />
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
