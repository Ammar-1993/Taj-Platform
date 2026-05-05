import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types";
import { formatTime, formatDate, formatCurrency } from "@/lib/formatters";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Video, XCircle, Coins, BookOpen, Rocket, Check } from "lucide-react";

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
    <>
      {/* ─── Mobile: Card Layout (< md) ─────────────────────────────────── */}
      <div className="md:hidden space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white border border-border rounded-taj-lg p-4 shadow-sm flex flex-col gap-3"
          >
            <div className="flex justify-between items-center border-b border-surface-subtle pb-3">
              <span className="font-bold text-brand-600">#{booking.id}</span>
              <StatusBadge status={booking.status} />
            </div>

            <div className="flex flex-col gap-2">
              {/* Person */}
              <div className="flex items-center gap-3 bg-surface-subtle p-3 rounded-taj-md">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-purple-100 rounded-taj-md flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                  {(isTeacher ? booking.student?.name : booking.teacher?.name)?.charAt(0) || "?"}
                </div>
                <div>
                  <span className="block font-bold text-text-primary text-sm">
                    {isTeacher ? booking.student?.name : booking.teacher?.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {isTeacher ? "الطالب" : "المعلم"}
                  </span>
                </div>
              </div>

              {/* Date + Amount */}
              <div className="flex justify-between items-center bg-surface-subtle p-3 rounded-taj-md">
                <div>
                  <div className="font-bold text-text-primary text-sm">
                    {formatDate(booking.booking_date, "medium")}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {formatTime(booking.teacher_slot?.start_time)}
                  </div>
                </div>
                <div className="text-left">
                  <span className="font-bold font-mono text-text-primary" dir="ltr">
                    {formatCurrency(booking.net_paid)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(booking.status === "scheduled" || booking.status === "in_progress") ? (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/classroom/${booking.id}`)}
                    className="flex-1 bg-brand-50 border-brand-100 text-brand-700 hover:bg-brand-100 hover:text-brand-800 h-9 whitespace-nowrap"
                  >
                    دخول الفصل <Video className="w-3.5 h-3.5 mr-2" />
                  </Button>
                  {isTeacher && booking.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancelClick(booking.id)}
                      className="text-error-text hover:bg-error-bg h-9"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {isTeacher && booking.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => onCompleteClick(booking.id)}
                      className="bg-success-text hover:bg-success-text/90 text-white h-9 px-3 whitespace-nowrap"
                    >
                      إنهاء وتحصيل <Coins className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="pt-1 text-center">
                  {booking.status === "completed" ? (
                    <div className="flex justify-center">
                      <div className="w-8 h-8 bg-success-bg text-success-text rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-text-muted bg-surface-muted px-3 py-1.5 rounded-full inline-block whitespace-nowrap">
                      {booking.status === "cancelled" ? "تم الإلغاء" : "حصة مسترجعة"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Desktop: Scrollable Table (>= md) ───────────────────────────── */}
      <div className="hidden md:block w-full overflow-x-auto rounded-taj-lg">
        <table className="min-w-full w-full text-sm text-right">
          <thead>
            <tr className="bg-gradient-to-l from-surface-subtle to-surface-muted border-b border-border">
              <th className="px-2 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider rounded-tr-taj-lg text-right">رقم</th>
              <th className="px-2 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">
                {isTeacher ? "الطالب" : "المعلم"}
              </th>
              <th className="px-2 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">التاريخ والوقت</th>
              <th className="px-2 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right whitespace-nowrap">المبلغ</th>
              <th className="px-2 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">الحالة</th>
              <th className="px-2 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider rounded-tl-taj-lg text-right">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-subtle">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-brand-50/50 transition-all duration-200 group"
              >
                {/* Booking ID */}
                <td className="px-2 py-4 font-bold text-brand-600 whitespace-nowrap">
                  #{booking.id}
                </td>

                {/* Person */}
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-brand-100 to-purple-100 rounded-taj-md flex items-center justify-center text-brand-600 font-bold text-xs shrink-0">
                      {(isTeacher ? booking.student?.name : booking.teacher?.name)?.charAt(0) || "?"}
                    </div>
                    <span className="font-bold text-text-primary">
                      {isTeacher ? booking.student?.name : booking.teacher?.name}
                    </span>
                  </div>
                </td>

                {/* Date + Time — whitespace-nowrap prevents column collapse */}
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="font-bold text-text-primary">
                    {formatDate(booking.booking_date, "medium")}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {formatTime(booking.teacher_slot?.start_time)}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-2 py-4 whitespace-nowrap">
                  <span className="font-bold font-mono text-text-primary" dir="ltr">
                    {formatCurrency(booking.net_paid)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-2 py-4 whitespace-nowrap">
                  <StatusBadge status={booking.status} />
                </td>

                {/* Actions — whitespace-nowrap keeps button on one line */}
                <td className="px-2 py-4 whitespace-nowrap">
                  <div className="flex gap-2 justify-end">
                    {(booking.status === "scheduled" || booking.status === "in_progress") ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/classroom/${booking.id}`)}
                          className="bg-brand-50 border-brand-100 text-brand-700 hover:bg-brand-100 hover:text-brand-800 h-9 whitespace-nowrap"
                        >
                          دخول الفصل <Video className="w-3.5 h-3.5 mr-2" />
                        </Button>
                        {isTeacher && booking.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCancelClick(booking.id)}
                            className="w-9 h-9 p-0 text-error-text hover:bg-error-bg hover:text-error-text rounded-taj-md flex items-center justify-center shrink-0"
                            title="إلغاء طارئ"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {isTeacher && booking.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() => onCompleteClick(booking.id)}
                            className="bg-success-text hover:bg-success-text/90 text-white h-9 px-3 whitespace-nowrap"
                          >
                            إنهاء وتحصيل <Coins className="w-3.5 h-3.5 mr-1" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {booking.status === "completed" ? (
                          <div className="w-9 h-9 bg-success-bg text-success-text rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-5 h-5" />
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-text-muted bg-surface-muted px-3 py-1.5 rounded-full whitespace-nowrap">
                            {booking.status === "cancelled" ? "تم الإلغاء" : "حصة مسترجعة"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
