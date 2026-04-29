import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types";
import { formatTime, formatDate } from "@/lib/formatters";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Video, XCircle, Coins, BookOpen, Rocket } from "lucide-react";

interface ResponsiveBookingTableProps {
  bookings: Booking[];
  isTeacher: boolean;
  onCancelClick: (id: number) => void;
  onCompleteClick: (id: number) => void;
}

export const ResponsiveBookingTable: React.FC<ResponsiveBookingTableProps> = ({
  bookings,
  isTeacher,
  onCancelClick,
  onCompleteClick,
}) => {
  const router = useRouter();

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-brand-50 text-brand-300 rounded-full flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-10 h-10" />
        </div>
        <h4 className="text-xl font-bold text-text-primary mb-2">
          ليس لديك أي حجوزات حتى الآن
        </h4>
        <p className="text-text-muted text-sm mb-6">
          ابدأ رحلتك التعليمية بحجز حصتك الأولى مع نخبة المعلمين
        </p>
        {!isTeacher && (
          <Button asChild className="px-6 rounded-taj-lg font-bold">
            <Link href="/">
              احجز حصتك الأولى <Rocket className="w-4 h-4 mr-2" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full text-sm text-right block md:table">
        <thead className="hidden md:table-header-group">
          <tr className="bg-gradient-to-l from-surface-subtle to-surface-muted border-b border-border">
            <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider rounded-tr-taj-lg text-right">رقم</th>
            <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">{isTeacher ? "الطالب" : "المعلم"}</th>
            <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">التاريخ والوقت</th>
            <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">المبلغ</th>
            <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">الحالة</th>
            <th className="px-4 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider rounded-tl-taj-lg text-right">الإجراء</th>
          </tr>
        </thead>
        <tbody className="block md:table-row-group">
          {bookings.map((booking) => (
            <tr
              key={booking.id}
              className="block md:table-row bg-white border border-border md:border-b md:border-surface-muted hover:bg-brand-50/50 hover:-translate-y-1 hover:shadow-md rounded-taj-lg md:rounded-none mb-4 md:mb-0 p-4 md:p-0 shadow-sm md:shadow-none transition-all duration-300 group"
            >
              <td className="flex justify-between items-center md:table-cell px-2 md:px-4 py-2 md:py-4 font-bold text-brand-600 border-b border-surface-muted md:border-none mb-3 md:mb-0">
                <span className="md:hidden font-bold text-text-secondary text-xs">رقم الحجز:</span>
                <span>#{booking.id}</span>
              </td>
              
              <td className="block md:table-cell px-2 md:px-4 py-2 md:py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-9 md:h-9 bg-gradient-to-br from-brand-100 to-purple-100 rounded-taj-md flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                    {(isTeacher ? booking.student?.name : booking.teacher?.name)?.charAt(0) || "?"}
                  </div>
                  <div>
                    <span className="block font-bold text-text-primary">
                      {isTeacher ? booking.student?.name : booking.teacher?.name}
                    </span>
                    <span className="md:hidden text-xs text-text-secondary">
                      {isTeacher ? "الطالب" : "المعلم"}
                    </span>
                  </div>
                </div>
              </td>

              <td className="flex justify-between items-center md:table-cell px-2 md:px-4 py-2 md:py-4 bg-surface-subtle md:bg-transparent rounded-taj-md md:rounded-none mt-2 md:mt-0 p-3 md:p-0">
                <span className="md:hidden font-bold text-text-secondary text-xs">الموعد:</span>
                <div className="text-left md:text-right">
                  <div className="font-bold text-text-primary text-sm md:text-base">
                    {formatDate(booking.booking_date, "medium")}
                  </div>
                  <div className="text-xs text-text-secondary md:text-text-muted mt-0.5">
                    {formatTime(booking.teacher_slot?.start_time)}
                  </div>
                </div>
              </td>

              <td className="flex justify-between items-center md:table-cell px-2 md:px-4 py-2 md:py-4 bg-surface-subtle md:bg-transparent rounded-taj-md md:rounded-none mt-1 md:mt-0 p-3 md:p-0">
                <span className="md:hidden font-bold text-text-secondary text-xs">المبلغ:</span>
                <div className="text-left md:text-right">
                  <span className="font-bold font-mono text-text-primary" dir="ltr">
                    {booking.net_paid}
                  </span>
                  <span className="text-xs text-text-muted mr-1">ريال</span>
                </div>
              </td>

              <td className="flex justify-between items-center md:table-cell px-2 md:px-4 py-2 md:py-4 mt-2 md:mt-0">
                <span className="md:hidden font-bold text-text-secondary text-xs">الحالة:</span>
                <StatusBadge status={booking.status} />
              </td>

              <td className="flex justify-end md:table-cell px-2 md:px-4 py-2 md:py-4 mt-2 md:mt-0 pt-3 md:pt-4 border-t border-surface-muted md:border-none">
                <div className="flex gap-2 justify-end">
                  {(booking.status === "scheduled" || booking.status === "in_progress") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/classroom/${booking.id}`)}
                      className="bg-brand-50 border-brand-100 text-brand-700 hover:bg-brand-100 hover:text-brand-800 h-9"
                    >
                      دخول الفصل <Video className="w-3.5 h-3.5 mr-2" />
                    </Button>
                  )}
                  {isTeacher && booking.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancelClick(booking.id)}
                      className="text-error-text hover:bg-error-bg hover:text-error-text h-9"
                    >
                      إلغاء طارئ <XCircle className="w-3.5 h-3.5 mr-2" />
                    </Button>
                  )}
                  {isTeacher && booking.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => onCompleteClick(booking.id)}
                      className="bg-success-text hover:bg-success-text/90 text-white h-9"
                    >
                      إنهاء وتحصيل <Coins className="w-3.5 h-3.5 mr-2" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
