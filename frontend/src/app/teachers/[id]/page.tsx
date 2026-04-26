"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { discoveryService, bookingService, parentService } from "@/services/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TeacherSlot, SlotsByDate, ApiResponse, Booking } from "@/types";
import { formatTime } from "@/lib/formatters";
import { showApiError } from "@/hooks/useApiError";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarDays, CalendarX2, Gift, Users, Clock, Loader2, CircleDollarSign } from "lucide-react";

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
    onSuccess: (res: ApiResponse<Booking>) => {
        toast.success(res.message || "تم الحجز بنجاح!");
        setBookingModal({ isOpen: false, slot: null });
        refetchSlots();
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
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
      <Card className="max-w-4xl mx-auto rounded-2xl p-6 md:p-8">
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            حجز موعد مع {teacherName}
          </h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            اختر اليوم المناسب لك من الشريط الزمني ثم حدد الوقت المتاح.
          </p>
        </div>

        {Object.keys(slots).length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="لا توجد مواعيد متاحة"
          subtitle="عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم."
        />
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {Object.keys(slots).map((date) => (
                <button
                  key={date}
                  onClick={() => setActiveDate(date)}
                  className={`flex-shrink-0 min-w-[120px] p-4 rounded-xl border-2 font-bold transition-all ${
                    activeDate === date 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-100 bg-white text-gray-600 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                >
                  <CalendarDays className="w-5 h-5 mx-auto mb-2" />
                  <span className="block text-sm">{date}</span>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> الأوقات المتاحة ليوم {activeDate}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {activeDaySlots.map((slot: TeacherSlot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleBookingRequest(slot)}
                      className="border border-gray-200 hover:border-indigo-500 bg-white hover:bg-indigo-50 text-indigo-900 font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center justify-center gap-1 active:scale-95"
                    >
                      <span className="text-base">{formatTime(slot.start_time)}</span>
                      <span className="text-xs text-gray-500 font-normal">
                        إلى {formatTime(slot.end_time)}
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
        onClose={() => setBookingModal({ isOpen: false, slot: null })}
        title="تأكيد الحجز"
      >
        {bookingModal.slot && (
          <div className="space-y-5">
            <p className="text-gray-500 text-sm text-center -mt-2">
              ستقوم بحجز الموعد من <span className="font-bold text-indigo-600">{formatTime(bookingModal.slot.start_time)}</span> إلى <span className="font-bold text-indigo-600">{formatTime(bookingModal.slot.end_time)}</span>
            </p>

            {isParent && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" /> اختر الابن (إلزامي):
                </label>
                <Select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                >
                  <option value="">اختر الابن</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4" /> كود الخصم (اختياري):
              </label>
              <Input
                type="text"
                placeholder="أدخل الكود هنا"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full"
                dir="ltr"
              />
            </div>

            {sessionPrice && (
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4" />
                  سعر الحصة
                </span>
                <span className="font-mono font-bold text-indigo-800 text-base" dir="ltr">
                  {sessionPrice} ريال
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setBookingModal({ isOpen: false, slot: null })}
                disabled={bookMutation.isPending}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={() => {
                    if (bookingModal.slot) {
                        bookMutation.mutate({
                            teacher_slot_id: bookingModal.slot.id,
                            promo_code: promoCode,
                            child_id: selectedChildId
                        });
                    }
                }}
                disabled={bookMutation.isPending || (isParent && !selectedChildId)}
                className="flex-1"
              >
                {bookMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "تأكيد ودفع"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
