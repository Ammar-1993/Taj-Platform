"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatTime, formatDate, roundToSlot } from "@/lib/formatters";
import PageHeader from "@/components/ui/PageHeader";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { showApiError } from "@/hooks/useApiError";
import { TeacherSlot } from '@/types';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Loader2, CalendarRange, CalendarX2, CalendarDays, Clock, LockOpen, Lock, LockKeyhole, Trash2 } from "lucide-react";
import { teacherService } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch slots using TanStack Query
  const { data: slotsData, isLoading: loading } = useQuery({
    queryKey: ["teacher-slots", user?.id],
    queryFn: () => teacherService.getOwnSlots(),
    enabled: !!user,
  });

  const slots = slotsData?.data || {};

  // حالة الفورم
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Mutation for adding a slot
  const addSlotMutation = useMutation({
    mutationFn: (data: { slot_date: string; start_time: string; end_time: string }) =>
      teacherService.createSlot(data),
    onSuccess: () => {
      toast.success("تم إضافة الموعد بنجاح!");
      setStartTime("");
      setEndTime("");
      queryClient.invalidateQueries({ queryKey: ["teacher-slots", user?.id] });
    },
    onError: (error: unknown) => {
      showApiError(error, "حدث خطأ غير متوقع");
    },
  });

  // Mutation for deleting a slot
  const deleteSlotMutation = useMutation({
    mutationFn: (id: number) => teacherService.deleteSlot(id),
    onSuccess: () => {
      toast.success("تم حذف الموعد بنجاح.");
      queryClient.invalidateQueries({ queryKey: ["teacher-slots", user?.id] });
    },
    onError: (error: unknown) => {
      showApiError(error, "لا يمكن حذف الموعد.");
    },
    onSettled: () => {
      setDeleteConfirm({ isOpen: false, slotId: 0 });
    },
  });

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    addSlotMutation.mutate({
      slot_date: date,
      start_time: startTime,
      end_time: endTime,
    });
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; slotId: number }>({ isOpen: false, slotId: 0 });

  const handleDeleteSlot = () => {
    deleteSlotMutation.mutate(deleteConfirm.slotId);
  };

  if (loading)
    return (
      <div className="p-8 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
              <Skeleton className="h-10 w-1/3" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Skeleton className="h-[400px] rounded-3xl" />
                  <Skeleton className="h-[600px] rounded-3xl lg:col-span-2" />
              </div>
          </div>
      </div>
    );
  if (!user?.roles?.some((r) => r.name === "teacher"))
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        هذه الصفحة للمعلمين فقط.
      </div>
    );

  // الحصول على تاريخ اليوم كحد أدنى للإدخال
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-4 md:p-8">
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        <PageHeader
          title="إدارة جدول المواعيد"
          subtitle="أضف أوقات فراغك ليتمكن الطلاب من حجز حصصهم معك بسهولة."
          backHref="/dashboard"
          backLabel="العودة للوحة التحكم"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* عمود إضافة المواعيد */}
          <Card className="lg:col-span-1 bg-white/90 backdrop-blur-md rounded-[2rem] border-white/50 animate-fade-in-up-delay p-8 h-fit">
            <h3 className="font-bold text-xl text-indigo-900 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Plus className="w-5 h-5" />
              </span>
              إضافة موعد جديد
            </h3>



            <form onSubmit={handleAddSlot} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                  تاريخ اليوم:
                </label>
                <Input
                  type="date"
                  required
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                    يبدأ من:
                  </label>
                  <Input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    onBlur={(e) => setStartTime(roundToSlot(e.target.value))}
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">
                    ينتهي في:
                  </label>
                  <Input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    onBlur={(e) => setEndTime(roundToSlot(e.target.value))}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={addSlotMutation.isPending}
                className="w-full h-14 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-lg rounded-taj-xl"
              >
                {addSlotMutation.isPending ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        جاري الإضافة...
                    </>
                ) : (
                    <>
                        <span>إضافة الموعد للجدول</span>
                        <Plus className="w-5 h-5 mr-3" />
                    </>
                )}
              </Button>
            </form>
          </Card>

          {/* عمود عرض الجدول الحالي */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[2.5rem] border-white/50 h-fit animate-fade-in-up-delay-2 p-8">
            <h3 className="font-bold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
               <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <CalendarRange className="w-5 h-5" />
               </span>
              جدول أوقاتي المتاحة والمحجوزة
            </h3>

            {Object.keys(slots).length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 font-bold flex flex-col items-center gap-4">
                <CalendarX2 className="w-16 h-16 text-gray-300" />
                <span>ليس لديك أي مواعيد مضافة في المستقبل.</span>
                <p className="text-xs font-bold">ابدأ بإضافة أوقات فراغك ليتمكن الطلاب من الحجز معك.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(slots).map(
                  ([dayDate, daySlots]: [string, TeacherSlot[]]) => (
                    <div
                      key={dayDate}
                      className="relative bg-white/40 p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm"
                    >
                      <h4 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-2xl text-sm shadow-sm inline-flex items-center gap-2 mr-1">
                             <CalendarDays className="w-4 h-4" /> {formatDate(dayDate, "long")}
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`group relative overflow-hidden backdrop-blur-sm p-4.5 rounded-[1.5rem] border-2 flex flex-col gap-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                              slot.status === "available"
                                ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/50"
                                : slot.status === "booked"
                                  ? "border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/50"
                                  : "border-rose-200 bg-rose-50/60 hover:bg-rose-100/50"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                    <div
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                                        slot.status === "available"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : slot.status === "booked"
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "bg-rose-100 text-rose-700"
                                        }`}
                                    >
                                        {slot.status === "available"
                                        ? <>متاح للطلاب <LockOpen className="w-3 h-3" /></>
                                        : slot.status === "booked"
                                            ? <>محجوز <Lock className="w-3 h-3" /></>
                                            : <>مغلق <LockKeyhole className="w-3 h-3" /></>}
                                    </div>
                                </div>

                                {slot.status === "available" && (
                                <button
                                    onClick={() => setDeleteConfirm({ isOpen: true, slotId: slot.id })}
                                    className="opacity-0 group-hover:opacity-100 w-9 h-9 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm group-hover:rotate-12"
                                    title="حذف الموعد"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                )}
                            </div>
                            
                            {/* Simple visual indicator at bottom of card */}
                            <div className={`mt-1 h-1.5 w-full rounded-full opacity-30 ${
                                slot.status === "available" ? "bg-emerald-400" : slot.status === "booked" ? "bg-indigo-400" : "bg-rose-400"
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="حذف الموعد"
        message="هل أنت متأكد من حذف هذا الموعد؟ لن يمكن التراجع عن هذا الإجراء."
        confirmText="حذف الموعد"
        variant="danger"
        onConfirm={handleDeleteSlot}
        onCancel={() => setDeleteConfirm({ isOpen: false, slotId: 0 })}
      />
    </div>
  );
}
