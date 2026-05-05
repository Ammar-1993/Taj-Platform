"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { discoveryService, bookingService, parentService } from "@/services/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TeacherSlot, SlotsByDate } from "@/types";
import { formatDatetime, formatTime, roundToSlot } from "@/lib/formatters";
import { showApiError } from "@/hooks/useApiError";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import { 
  CalendarX2, 
  Gift, 
  Users, 
  Clock, 
  CircleDollarSign,
  CheckCircle2,
  BookOpen,
  Star
} from "lucide-react";

export default function TeacherProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const isParent = user?.roles?.some((r) => r.name === "parent");

  const [activeDate, setActiveDate] = useState<string>("");
  const [promoCode, setPromoCode] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Fetch Teacher Slots
  const { data: slotsData, isLoading: slotsLoading, refetch: refetchSlots } = useQuery({
    queryKey: ['teacher-slots-public', params.id],
    queryFn: async () => {
        const res = await discoveryService.getTeacherSlots(Number(params.id));
        // Set active date to first date if not set
        const dates = Object.keys(res.data);
        if (dates.length > 0 && !activeDate) {
            setActiveDate(dates[0]);
        }
        return res;
    },
  });

  // Fetch Children if parent
  const { data: childrenData } = useQuery({
    queryKey: ['parent-children', user?.id],
    queryFn: () => parentService.getChildren(),
    enabled: !!user && isParent,
  });

  const slots = (slotsData?.data || {}) as SlotsByDate;
  const teacherName = slotsData?.teacher_name || "";
  const teacher = slotsData?.teacher;
  const sessionPrice = slotsData?.session_price || null;
  const children = childrenData?.data || [];

  // Booking Modal State
  const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; slot: TeacherSlot | null }>({
    isOpen: false,
    slot: null,
  });

  const handleBookingRequest = (slot: TeacherSlot) => {
    if (!user) {
      toast.error("يجب عليك تسجيل الدخول أولاً لإتمام الحجز.");
      router.push("/login");
      return;
    }
    setBookingModal({ isOpen: true, slot });
  };

  // Booking Mutation
  const bookMutation = useMutation({
    mutationFn: (data: { teacher_slot_id: number; promo_code?: string; child_id?: string }) => 
        bookingService.create(data),
    onSuccess: () => {
        refetchSlots();
    },
    onError: (err: unknown) => {
        showApiError(err, "حدث خطأ أثناء الحجز.");
    }
  });

  if (slotsLoading)
    return (
        <div className="p-8 min-h-screen">
             <div className="max-w-4xl mx-auto space-y-8">
                 <Skeleton className="h-32 rounded-3xl" />
                 <Skeleton className="h-24 rounded-3xl" />
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                     <Skeleton className="h-20 rounded-xl" />
                     <Skeleton className="h-20 rounded-xl" />
                     <Skeleton className="h-20 rounded-xl" />
                     <Skeleton className="h-20 rounded-xl" />
                 </div>
             </div>
        </div>
    );

  const activeDaySlots = slots[activeDate] || [];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <Card className="max-w-4xl mx-auto rounded-taj-xl p-6 md:p-10 border-none shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-100 pb-8 mb-8 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100/50 rounded-taj-lg flex items-center justify-center text-brand-600 font-bold text-4xl shadow-sm">
            {teacherName.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {teacherName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-brand-700 bg-brand-50/80 px-3 py-1 rounded-taj-sm font-bold border border-brand-100/50">
                <BookOpen size={16} />
                {teacher?.teacher_profile?.subject?.name || "غير محدد"}
              </span>
              
              <div className="flex items-center gap-1.5">
                {(teacher?.teacher_profile?.average_rating ?? 0) > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-lg">
                    <Star size={20} className="fill-amber-500" />
                    {teacher?.teacher_profile?.average_rating}
                  </div>
                ) : (
                  <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border border-slate-200/50">
                    جديد
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  ({teacher?.teacher_profile?.reviews_count || 0} تقييم)
                </span>
              </div>
            </div>
            {teacher?.teacher_profile?.bio && (
              <p className="text-slate-500 mt-4 text-sm leading-relaxed max-w-2xl">
                {teacher.teacher_profile.bio}
              </p>
            )}
          </div>
        </div>

        {Object.keys(slots).length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="لا توجد مواعيد متاحة"
          subtitle="عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم."
        />
        ) : (
            <div className="space-y-10">
              {/* Date Selection Grid */}
              <div className="flex flex-col gap-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">اختر اليوم</h3>
                <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth no-scrollbar">
                  {Object.keys(slots).map((date) => (
                    <button
                      key={date}
                      onClick={() => setActiveDate(date)}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center min-w-[110px] p-4 rounded-taj-lg border-2 transition-all duration-300",
                        activeDate === date 
                            ? "border-brand-600 bg-brand-50 text-brand-700 shadow-lg shadow-brand-600/10 scale-105" 
                            : "border-transparent bg-slate-100 text-slate-400 hover:bg-slate-200 hover:border-slate-300"
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-widest mb-1.5 font-bold opacity-60">يوم</span>
                      <span className="block text-sm font-black leading-none">{formatDatetime(date, 'medium')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slots Grid */}
              <div className="bg-slate-50 p-8 rounded-taj-xl border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                      <Clock className="w-6 h-6 text-brand-500" /> الأوقات المتاحة للحجز
                    </h3>
                    <span className="text-xs text-brand-600 font-bold bg-white px-4 py-2 rounded-full border border-brand-100 shadow-sm">
                      {formatDatetime(activeDate, 'medium')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 relative z-10">
                    {activeDaySlots.map((slot: TeacherSlot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleBookingRequest(slot)}
                        className="group relative border-2 border-transparent bg-white hover:border-brand-500 hover:bg-brand-50 text-slate-700 font-bold py-4 px-5 rounded-taj-md transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-brand-600/10 active:scale-95 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/5 transition-colors" />
                        <span className="text-lg text-brand-700 group-hover:text-brand-800 tracking-tight">{formatTime(roundToSlot(slot.start_time))}</span>
                        <span className="text-[10px] text-slate-400 font-bold opacity-70">
                          إلى {formatTime(roundToSlot(slot.end_time))}
                        </span>
                      </button>
                    ))}
                  </div>
              </div>
            </div>
        )}
      </Card>

      <Modal
        isOpen={bookingModal.isOpen && !!bookingModal.slot}
        onClose={() => {
          setBookingModal({ isOpen: false, slot: null });
          if (bookMutation.isSuccess) {
            bookMutation.reset();
          }
        }}
        title={bookMutation.isSuccess ? "تم الحجز بنجاح!" : "تأكيد الحجز"}
      >
        {bookingModal.slot && (
          <div className="space-y-6">
            {bookMutation.isSuccess ? (
              <div className="py-6 text-center animate-success-scale">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm relative">
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">تهانينا!</h3>
                <p className="text-slate-500 text-sm max-w-[320px] mx-auto leading-relaxed font-bold">
                  لقد أتممت حجز موعدك بنجاح. سنقوم بإرسال تنبيه لك قبل موعد الحصة.
                </p>
                <RedirectCountdown 
                  href="/dashboard" 
                  seconds={5} 
                  message="جاري توجيهك للوحة التحكم لمتابعة حجزك..." 
                  onCancel={() => {
                    setBookingModal({ isOpen: false, slot: null });
                    bookMutation.reset();
                  }}
                />
              </div>
            ) : (
              <>
                <div className="bg-slate-50 rounded-taj-lg p-5 border border-slate-100 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">توقيت الحصة المختارة</span>
                  <p className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="text-brand-600">{formatTime(roundToSlot(bookingModal.slot.start_time))}</span>
                    <span className="text-slate-300 font-light">←</span>
                    <span className="text-brand-600">{formatTime(roundToSlot(bookingModal.slot.end_time))}</span>
                  </p>
                </div>

                {isParent && (
                  <div className="animate-fade-up">
                    <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand-500" /> اختر الابن (إلزامي)
                    </label>
                    <Select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                    >
                      <option value="">اضغط للاختيار</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                  <label className="block text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-brand-500" /> كود الخصم (اختياري)
                  </label>
                  <Input
                    type="text"
                    placeholder="أدخل الكود هنا إن وجد"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full"
                    dir="ltr"
                  />
                </div>

                {sessionPrice && (
                  <div className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-taj-lg px-5 py-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <span className="text-sm font-bold text-brand-700 flex items-center gap-2">
                      <CircleDollarSign className="w-5 h-5" />
                      إجمالي المبلغ
                    </span>
                    <span className="font-mono font-black text-brand-800 text-xl" dir="ltr">
                      {sessionPrice} ريال
                    </span>
                  </div>
                )}

                <div className="flex gap-4 pt-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setBookingModal({ isOpen: false, slot: null })}
                    disabled={bookMutation.isPending}
                    className="flex-1 h-12"
                  >
                    تراجع
                  </Button>
                  <Button
                    isLoading={bookMutation.isPending}
                    disabled={isParent && !selectedChildId}
                    onClick={() => {
                        if (bookingModal.slot) {
                            bookMutation.mutate({
                                teacher_slot_id: bookingModal.slot.id,
                                promo_code: promoCode,
                                child_id: selectedChildId
                            });
                        }
                    }}
                    className="flex-[2] h-12 shadow-lg shadow-brand-600/20"
                  >
                    تأكيد الحجز والدفع
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
