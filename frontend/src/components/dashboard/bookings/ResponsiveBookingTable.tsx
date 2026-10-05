import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking } from "@/types";
import { formatTime, formatDate } from "@/lib/formatters";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Video, XCircle, Coins, BookOpen, Rocket, MoreVertical, Sparkles } from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { SessionSummaryModal } from "@/components/dashboard/ai/SessionSummaryModal";

// ─── Dropdown Component for Secondary Actions ──────────────────────────────────
function BookingDropdown({
  booking,
  isTeacher,
  onCancelClick,
  onCompleteClick,
}: {
  booking: Booking;
  isTeacher: boolean;
  onCancelClick: (id: number) => void;
  onCompleteClick: (id: number) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hasOptions = isTeacher && (booking.status === "scheduled" || booking.status === "in_progress");

  if (!hasOptions) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
        title="خيارات إضافية"
      >
        <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>

      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] z-50 animate-in fade-in slide-in-from-top-2 duration-200" 
          dir="rtl"
        >
          {isTeacher && booking.status === "scheduled" && (
            <button
              onClick={() => {
                setIsOpen(false);
                onCancelClick(booking.id);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full transition-colors text-error-text font-medium hover:bg-error-bg text-sm"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>إلغاء طارئ</span>
            </button>
          )}
          {isTeacher && booking.status === "in_progress" && (
            <button
              onClick={() => {
                setIsOpen(false);
                onCompleteClick(booking.id);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full transition-colors text-success-text font-medium hover:bg-success-bg text-sm"
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span>إنهاء وتحصيل</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ResponsiveBookingTableProps {
  bookings: Booking[];
  isTeacher: boolean;
  isParent?: boolean;
  onCancelClick: (id: number) => void;
  onCompleteClick: (id: number) => void;
}

export const ResponsiveBookingTable: React.FC<ResponsiveBookingTableProps> = ({
  bookings,
  isTeacher,
  isParent = false,
  onCancelClick,
  onCompleteClick,
}) => {
  const router = useRouter();
  const [selectedSummaryBookingId, setSelectedSummaryBookingId] = useState<number | null>(null);

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-brand-50 text-brand-300 rounded-full flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-10 h-10" />
        </div>
        <h4 className="text-xl font-bold text-text-primary mb-2">
          {isParent ? "لا توجد حجوزات لأبنائك حتى الآن" : "ليس لديك أي حجوزات حتى الآن"}
        </h4>
        <p className="text-text-muted text-sm mb-6">
          {isParent ? "ابدأ بحجز حصص لأبنائك مع نخبة المعلمين" : "ابدأ رحلتك التعليمية بحجز حصتك الأولى مع نخبة المعلمين"}
        </p>
        {!isTeacher && (
          <Button asChild className="px-6 rounded-taj-lg font-bold">
            <Link href={isParent ? "/dashboard/teachers" : "/"}>
              {isParent ? "ابحث عن معلم" : "احجز حصتك الأولى"} <Rocket className="w-4 h-4 mr-2" />
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
              {/* Person(s) */}
              {isParent ? (
                <>
                  <div className="flex items-center justify-between bg-surface-subtle p-3 rounded-taj-md">
                    <span className="text-xs text-text-secondary font-bold">الابن</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-brand-50 rounded flex items-center justify-center text-brand-600 font-bold text-xs">
                        {booking.student?.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-bold text-brand-700 text-sm">
                        {booking.student?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-surface-subtle p-3 rounded-taj-md">
                    <span className="text-xs text-text-secondary font-bold">المعلم</span>
                    <span className="font-bold text-text-primary text-sm">
                      {booking.teacher?.name}
                    </span>
                  </div>
                </>
              ) : (
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
              )}

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
                  <CurrencyDisplay 
                    amount={booking.net_paid} 
                    size="md" 
                    className="text-text-primary"
                  />
                </div>
              </div>

              {/* Actions (Hidden for Parent) */}
              {!isParent && (booking.status === "scheduled" || booking.status === "in_progress") && (
                <div className="flex gap-2 pt-1 items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/classroom/${booking.id}`)}
                    className="flex-1 bg-brand-50 border-brand-100 text-brand-700 hover:bg-brand-100 hover:text-brand-800 h-9 whitespace-nowrap"
                  >
                    دخول الفصل <Video className="w-3.5 h-3.5 mr-2" />
                  </Button>
                  
                  <BookingDropdown
                    booking={booking}
                    isTeacher={isTeacher}
                    onCancelClick={onCancelClick}
                    onCompleteClick={onCompleteClick}
                  />
                </div>
              )}

              {/* AI Session Summary & Quiz Button (Mobile) */}
              {booking.status === "completed" && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSummaryBookingId(booking.id)}
                    className="w-full bg-gradient-to-r from-purple-50/80 via-brand-50/70 to-indigo-50/80 border-brand-200/90 text-brand-700 hover:text-brand-800 font-bold h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>الملخص والاختبار الذكي</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Desktop: Scrollable Table (>= md) ───────────────────────────── */}
      <div className="hidden md:block w-full overflow-x-auto scrollbar-none md:hover:scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent rounded-2xl">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="bg-gradient-to-l from-surface-subtle to-surface-muted border-b border-border">
              <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right rounded-tr-taj-lg whitespace-nowrap">رقم الحجز</th>
              {isParent ? (
                <>
                  <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right whitespace-nowrap">الابن</th>
                  <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right whitespace-nowrap">المعلم</th>
                </>
              ) : (
                <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right whitespace-nowrap">
                  {isTeacher ? "الطالب" : "المعلم"}
                </th>
              )}
              <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right whitespace-nowrap">التاريخ والوقت</th>
              <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right whitespace-nowrap">التكلفة</th>
              <th className={`px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right whitespace-nowrap ${isParent ? 'rounded-tl-taj-lg' : ''}`}>الحالة</th>
              {!isParent && <th className="px-2 lg:px-2.5 xl:px-3 py-3 text-[11px] sm:text-xs font-bold text-text-secondary text-right rounded-tl-taj-lg whitespace-nowrap">الإجراء</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-subtle">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-brand-50/50 transition-all duration-200 group"
              >
                {/* Booking ID */}
                <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 font-bold text-brand-600 whitespace-nowrap align-middle">
                  <div className="flex items-center h-full text-xs sm:text-sm">#{booking.id}</div>
                </td>

                {/* Person(s) */}
                {isParent ? (
                  <>
                    <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-brand-100 to-purple-100 rounded-taj-sm flex items-center justify-center text-brand-600 font-bold text-[10px] shrink-0">
                          {booking.student?.name?.charAt(0) || "?"}
                        </div>
                        <span className="font-bold text-brand-700 text-xs sm:text-sm max-w-[90px] lg:max-w-[110px] xl:max-w-none truncate" title={booking.student?.name}>
                          {booking.student?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 font-bold text-text-primary whitespace-nowrap align-middle">
                      <div className="flex items-center h-full text-xs sm:text-sm max-w-[90px] lg:max-w-[110px] xl:max-w-none truncate" title={booking.teacher?.name}>
                        {booking.teacher?.name}
                      </div>
                    </td>
                  </>
                ) : (
                  <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                    <div className="flex items-center gap-2 lg:gap-2.5 xl:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-brand-100 to-purple-100 rounded-taj-md flex items-center justify-center text-brand-600 font-bold text-[11px] sm:text-xs shrink-0">
                        {(isTeacher ? booking.student?.name : booking.teacher?.name)?.charAt(0) || "?"}
                      </div>
                      <span className="font-bold text-text-primary text-xs sm:text-sm max-w-[105px] lg:max-w-[125px] xl:max-w-none truncate" title={isTeacher ? booking.student?.name : booking.teacher?.name}>
                        {isTeacher ? booking.student?.name : booking.teacher?.name}
                      </span>
                    </div>
                  </td>
                )}

                {/* Date + Time */}
                <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                  <div className="flex flex-col justify-center">
                    <div className="font-bold text-text-primary text-xs sm:text-sm">
                      {formatDate(booking.booking_date, "medium")}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-text-muted mt-0.5">
                      {formatTime(booking.teacher_slot?.start_time)}
                    </div>
                  </div>
                </td>

                {/* Amount */}
                <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                  <div className="flex items-center h-full">
                    <CurrencyDisplay 
                      amount={booking.net_paid} 
                      size="sm" 
                      className="text-text-primary font-bold text-xs sm:text-sm"
                    />
                  </div>
                </td>

                {/* Status */}
                <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                  <div className="flex items-center h-full">
                    <StatusBadge status={booking.status} />
                  </div>
                </td>

                {/* Actions (Hidden for Parent) */}
                {!isParent && (
                  <td className="px-2 lg:px-2.5 xl:px-3 py-2.5 sm:py-3 whitespace-nowrap align-middle">
                    <div className="flex gap-1 sm:gap-1.5 justify-end items-center min-h-[36px]">
                      {(booking.status === "scheduled" || booking.status === "in_progress") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/classroom/${booking.id}`)}
                            className="bg-brand-50/90 border-brand-200/80 text-brand-700 hover:bg-brand-100 hover:text-brand-800 h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl whitespace-nowrap shadow-2xs transition-all gap-1"
                          >
                            دخول الفصل <Video className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                          </Button>
                          
                          <BookingDropdown
                            booking={booking}
                            isTeacher={isTeacher}
                            onCancelClick={onCancelClick}
                            onCompleteClick={onCompleteClick}
                          />
                        </>
                      )}

                      {/* AI Session Summary & Quiz Button (Desktop) */}
                      {booking.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSummaryBookingId(booking.id)}
                          className="bg-gradient-to-r from-purple-50/70 to-brand-50/70 border-brand-200/90 text-brand-700 hover:bg-brand-100 hover:text-brand-800 h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl whitespace-nowrap shadow-2xs transition-all gap-1"
                        >
                          <span>الملخص والاختبار</span>
                          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-brand-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── AI Session Summary & Interactive Quiz Modal ─────────────────── */}
      <SessionSummaryModal
        bookingId={selectedSummaryBookingId}
        isOpen={Boolean(selectedSummaryBookingId)}
        onClose={() => setSelectedSummaryBookingId(null)}
        isTeacher={isTeacher}
      />
    </>
  );
};
