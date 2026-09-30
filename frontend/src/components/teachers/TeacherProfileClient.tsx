"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { discoveryService, bookingService, parentService } from "@/services/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TeacherSlot, SlotsByDate, TeacherSlotsResponse } from "@/types";
import { formatDate, formatTime, roundToSlot } from "@/lib/formatters";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { showApiError } from "@/hooks/useApiError";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { 
  CalendarX2, 
  Gift, 
  Users, 
  Clock, 
  CircleDollarSign,
  CheckCircle2,
  BookOpen,
  Star,
  ChevronRight,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Award
} from "lucide-react";

interface TeacherProfileClientProps {
  teacherId: string;
  initialSlots?: TeacherSlotsResponse;
}

export default function TeacherProfileClient({
  teacherId,
  initialSlots,
}: TeacherProfileClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isParent = user?.roles?.some((r) => r.name === "parent");

  const initialDate = initialSlots?.data && Object.keys(initialSlots.data).length > 0 
    ? Object.keys(initialSlots.data)[0] 
    : "";

  const [activeDate, setActiveDate] = useState<string>(initialDate);
  const [promoCode, setPromoCode] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Fetch Teacher Slots with server-provided initialData
  const { data: slotsData } = useQuery({
    queryKey: ['teacher-slots-public', teacherId],
    queryFn: async () => {
        const res = await discoveryService.getTeacherSlots(Number(teacherId));
        const dates = Object.keys(res.data);
        if (dates.length > 0 && !activeDate) {
            setActiveDate(dates[0]);
        }
        return res;
    },
    initialData: initialSlots,
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
      toast.success("تم تأكيد حجز موعدك بنجاح!");
    },
    onError: (error) => {
      showApiError(error);
    }
  });

  const activeDaySlots = slots[activeDate] || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      
      {/* 🎭 الخلفية التفاعلية المضيئة وشبكة الماتريكس */}
      <DecorativeBackground />

      <div className="max-w-4xl mx-auto relative z-10 animate-fade-in-up">
        
        {/* البطاقة الرئيسية الزجاجية الفاخرة */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-white/95 shadow-2xl shadow-indigo-950/5 ring-1 ring-slate-900/5 relative overflow-hidden">
          
          {/* شريط التدرج العلوي الملكي */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600" />

          {/* شريط التنقل العلوي وزر العودة */}
          <div className="flex items-center justify-between mb-8 pb-5 border-b border-slate-100">
            <button 
              onClick={() => router.back()} 
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 font-bold text-xs sm:text-sm transition-all hover:-translate-x-0.5 active:translate-x-0 select-none cursor-pointer"
              aria-label="العودة لقائمة المعلمين"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة للمعلمين</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 select-none">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>حجز فوري ومؤكد</span>
            </div>
          </div>

          {/* ترويسة ملف المعلم الفاخرة (Teacher Profile Header) */}
          <div className="border-b border-slate-100 pb-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
            
            {/* الصورة الرمزية الملكية بتدرج نبيلي ثلاثي الألوان */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 text-white font-black text-4xl sm:text-5xl flex items-center justify-center shadow-xl shadow-indigo-500/25 ring-4 ring-white select-none">
              {teacherName.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {teacherName}
                </h1>
                <span title="معلم موثق" className="inline-flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-50 shrink-0" />
                </span>
              </div>

              {/* شارات المادة والتقييم والسعر */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-3 select-none">
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-indigo-700 bg-indigo-50/90 border border-indigo-100 px-3 py-1 rounded-full font-bold">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{teacher?.teacher_profile?.subject?.name || "غير محدد"}</span>
                </span>
                
                {(teacher?.teacher_profile?.average_rating ?? 0) > 0 ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs sm:text-sm font-black">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{teacher?.teacher_profile?.average_rating}</span>
                    <span className="text-[11px] text-slate-400 font-medium">({teacher?.teacher_profile?.reviews_count || 0} تقييم)</span>
                  </div>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
                    معلم جديد ⭐
                  </span>
                )}

                {sessionPrice && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-black">
                    <CircleDollarSign className="w-4 h-4 text-emerald-600" />
                    <CurrencyDisplay amount={sessionPrice} size="sm" className="text-emerald-800 font-black" />
                    <span className="text-[11px] text-emerald-600 font-bold">/ الحصة</span>
                  </span>
                )}
              </div>

              {teacher?.teacher_profile?.bio && (
                <p className="text-slate-600 mt-4 text-xs sm:text-sm leading-relaxed max-w-2xl bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-right">
                  {teacher.teacher_profile.bio}
                </p>
              )}
            </div>
          </div>

          {Object.keys(slots).length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="لا توجد مواعيد متاحة"
              subtitle="عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم. يمكنك استكشاف بقية المعلمين المعتمدين."
            />
          ) : (
            <div className="space-y-8">
              
              {/* قسم اختيار اليوم (Date Selection) */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      اختر اليوم المناسب
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {Object.keys(slots).length} {Object.keys(slots).length === 1 ? "يوم متاح" : "أيام متاحة"}
                  </span>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide select-none">
                  {Object.keys(slots).map((date) => {
                    const isSelected = activeDate === date;
                    const count = (slots[date] || []).length;
                    return (
                      <button
                        key={date}
                        onClick={() => setActiveDate(date)}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-center justify-center min-w-[125px] sm:min-w-[140px] py-3.5 px-4 rounded-2xl border transition-all duration-300 active:scale-95 cursor-pointer",
                          isSelected
                            ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white border-transparent shadow-lg shadow-indigo-500/25 scale-105 font-black"
                            : "bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 border-slate-200/80 shadow-sm font-bold hover:border-indigo-200"
                        )}
                      >
                        <span className="text-xs sm:text-sm font-black mb-0.5">
                          {formatDate(date, 'long')}
                        </span>
                        <span className={cn("text-[10px] font-semibold", isSelected ? "text-indigo-100" : "text-slate-400")}>
                          {count} {count === 1 ? "موعد متاح" : "مواعيد متاحة"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* قسم شبكة المواعيد المتاحة (Slots Grid) */}
              <div className="bg-gradient-to-br from-indigo-50/40 via-white/80 to-blue-50/30 p-5 sm:p-7 md:p-8 rounded-3xl border border-indigo-100/70 shadow-inner relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        الأوقات المتاحة للحجز
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        اضغط على أي وقت لتأكيد حجزك الفوري
                      </p>
                    </div>
                  </div>

                  <span className="self-start sm:self-center text-xs text-indigo-700 font-bold bg-white/90 px-3.5 py-1.5 rounded-full border border-indigo-100 shadow-sm flex items-center gap-1.5 select-none">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>مدة الحصة: 60 دقيقة</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
                  {activeDaySlots.map((slot: TeacherSlot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleBookingRequest(slot)}
                      className="group relative bg-white/95 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-blue-600 border border-slate-200/90 hover:border-transparent text-slate-700 hover:text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-xl hover:shadow-indigo-500/25 active:scale-95 cursor-pointer overflow-hidden select-none"
                    >
                      <span className="text-base sm:text-lg font-black text-indigo-700 group-hover:text-white transition-colors">
                        {formatTime(roundToSlot(slot.start_time))}
                      </span>
                      <span className="text-[11px] text-slate-400 group-hover:text-indigo-100 font-bold transition-colors">
                        إلى {formatTime(roundToSlot(slot.end_time))}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* شارة الضمان المالي الموثوق */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 font-semibold select-none pt-2">
                <span className="flex items-center gap-1.5 bg-white/80 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  حماية كاملة بالضمان المالي (Escrow)
                </span>
                <span className="flex items-center gap-1.5 bg-white/80 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-sm">
                  <Award className="w-4 h-4 text-indigo-600" />
                  فصل افتراضي تفاعلي بتقنية WebRTC
                </span>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* نافذة تأكيد الحجز المنبثقة (Booking Modal) */}
      <Modal
        isOpen={bookingModal.isOpen && !!bookingModal.slot}
        onClose={() => {
          setBookingModal({ isOpen: false, slot: null });
          if (bookMutation.isSuccess) {
            bookMutation.reset();
          }
        }}
        title={bookMutation.isSuccess ? "تم الحجز بنجاح!" : "تأكيد الحجز والدفع"}
        size="md"
        bodyClassName="p-4 sm:p-6"
      >
        {bookingModal.slot && (
          <div className="space-y-3.5 sm:space-y-4">
            {bookMutation.isSuccess ? (
              <div className="py-4 text-center animate-success-scale">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm relative">
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">تهانينا!</h3>
                <p className="text-slate-500 text-xs sm:text-sm max-w-[320px] mx-auto leading-relaxed font-bold mb-3">
                  لقد أتممت حجز موعدك بنجاح. سنقوم بإرسال تنبيه وتأكيد لك قبل موعد الحصة.
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
                {/* بطاقة توقيت الحصة المدمجة الفاخرة */}
                <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-blue-50/70 rounded-2xl p-3 sm:p-3.5 border border-indigo-100/80 flex items-center justify-between text-right">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-bold block leading-none mb-1">توقيت الحصة المختارة</span>
                      <span className="text-xs font-semibold text-slate-600">مدة الحصة: 60 دقيقة</span>
                    </div>
                  </div>
                  <div className="text-left font-black text-xs sm:text-sm text-indigo-700 bg-white/95 px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm" dir="ltr">
                    <span>{formatTime(roundToSlot(bookingModal.slot.start_time))}</span>
                    <span className="text-slate-300 font-light mx-1">→</span>
                    <span>{formatTime(roundToSlot(bookingModal.slot.end_time))}</span>
                  </div>
                </div>

                {/* اختيار الابن لولي الأمر */}
                {isParent && (
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>اختر الابن (إلزامي)</span>
                    </label>
                    <Select
                      value={selectedChildId}
                      onChange={(e) => setSelectedChildId(e.target.value)}
                      className="h-11 bg-white/90 border-slate-200/90 rounded-xl text-xs sm:text-sm font-bold focus:border-indigo-400"
                    >
                      <option value="">اضغط للاختيار من قائمة الأبناء</option>
                      {children.map((child) => (
                        <option key={child.id} value={child.id}>{child.name}</option>
                      ))}
                    </Select>
                  </div>
                )}

                {/* كود الخصم */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-indigo-600" />
                    <span>كود الخصم (اختياري)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="أدخل الكود إن وجد (مثل: TAJ2026)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="h-11 bg-white/90 border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium"
                    dir="ltr"
                  />
                </div>

                {/* إجمالي المبلغ */}
                {sessionPrice && (
                  <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2.5">
                    <span className="text-xs sm:text-sm font-bold text-indigo-800 flex items-center gap-1.5">
                      <CircleDollarSign className="w-4 h-4 text-indigo-600" />
                      <span>إجمالي المبلغ</span>
                    </span>
                    <CurrencyDisplay 
                      amount={sessionPrice} 
                      size="md" 
                      className="text-indigo-900 font-black"
                    />
                  </div>
                )}

                {/* شارة الضمان المالي في نافذة الحجز */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 text-slate-500 text-[11px] sm:text-xs leading-relaxed text-right">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>يظل المبلغ مجمداً بأمان في حساب الضمان (Escrow) ولا يُصرف للمعلم إلا بعد اكتمال الحصة بنجاح.</span>
                </div>

                {/* أزرار الإجراء */}
                <div className="flex gap-3 pt-1">
                  <Button
                    variant="secondary"
                    onClick={() => setBookingModal({ isOpen: false, slot: null })}
                    disabled={bookMutation.isPending}
                    className="flex-1 h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm"
                  >
                    تراجع
                  </Button>
                  <Button
                    variant="gradient"
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
                    className="flex-[2] h-11 sm:h-12 shadow-lg shadow-indigo-500/20 rounded-xl font-bold text-xs sm:text-sm"
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
