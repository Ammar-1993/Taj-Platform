"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { showApiError } from '@/hooks/useApiError';
import { ApiResponse, Booking, SupportTicket, SupportTicketCreatePayload } from '@/types';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { PenSquare, Send, FolderOpen, Inbox, Pin, Headphones, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export default function SupportPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // حالات نموذج الإرسال
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // جلب التذاكر السابقة وجلب الحجوزات (لربط الشكوى بحجز معين)
            const [ticketsRes, bookingsRes] = await Promise.all([
                api.get<ApiResponse<SupportTicket[]>>('/support-tickets'),
                api.get<ApiResponse<{ data: Booking[] }>>('/bookings') // نفترض أن هذا المسار موجود مسبقاً لجلب حجوزات الطالب
            ]);
            
            setTickets(ticketsRes.data.data || []);
            setBookings(bookingsRes.data.data?.data || []); // حسب هيكلة الـ Pagination لديك
        } catch (error) {
            console.error("خطأ في جلب بيانات الدعم", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload: SupportTicketCreatePayload = { subject, description };
            if (bookingId) payload.booking_id = bookingId;

            const res = await api.post<ApiResponse<SupportTicket>>('/support-tickets', payload);
            
            toast.success(res.data.message || 'تم إرسال التذكرة بنجاح.');
            setSubject('');
            setDescription('');
            setBookingId('');
            
            fetchData(); // تحديث قائمة التذاكر فوراً
            
            // العودة للوحة بعد 3 ثواني
            setTimeout(() => router.push('/dashboard'), 3000);
        } catch (error: unknown) {
            showApiError(error, 'حدث خطأ أثناء إرسال التذكرة.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        return <StatusBadge status={status} />;
    };

    if (loading) return (
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
    if (!user) return null;

    return (
        <div className="p-4 md:p-8">
            
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
                
                <PageHeader
                    title="مركز المساعدة والدعم"
                    subtitle="نحن هنا لمساعدتك. ارفع تذكرة وسنقوم بحل مشكلتك في أسرع وقت."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: نموذج فتح تذكرة جديدة */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-white/90 backdrop-blur-md rounded-[2rem] border-white/50 animate-fade-in-up-delay p-8">
                            <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <PenSquare className="w-5 h-5" />
                                </span>
                                فتح تذكرة جديدة
                            </h3>
                            


                            <form onSubmit={handleSubmitTicket} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">موضوع المشكلة:</label>
                                    <Input 
                                        type="text" 
                                        required 
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="مثال: المعلم لم يحضر الحصة"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">مرتبطة بحجز؟ (اختياري):</label>
                                    <div className="relative">
                                        <select
                                            value={bookingId}
                                            onChange={(e) => setBookingId(e.target.value)}
                                            className="w-full px-4 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                                        >
                                            <option value="">-- شكوى عامة --</option>
                                            {bookings.map((b: Booking) => (
                                                <option key={b.id} value={b.id}>
                                                    حجز #{b.id} مع {b.teacher?.name} ({formatDate(b.booking_date, "medium")})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">تفاصيل المشكلة:</label>
                                    <textarea 
                                        required 
                                        rows={4}
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="اشرح المشكلة بالتفصيل لنتمكن من مساعدتك..."
                                        className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 resize-none placeholder:text-gray-300 shadow-inner" 
                                    ></textarea>
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting || !subject || !description}
                                    className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] text-lg rounded-[1.5rem]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            جاري الإرسال...
                                        </>
                                    ) : (
                                        <>
                                            <span>إرسال التذكرة</span>
                                            <Send className="w-5 h-5 mr-3" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* القسم الثاني: سجل التذاكر وردود الإدارة */}
                    <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[2rem] border-white/50 h-fit animate-fade-in-up-delay p-8">
                        <h3 className="font-bold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
                             <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <FolderOpen className="w-5 h-5" />
                             </span>
                             تذاكري السابقة
                        </h3>
                        
                        {tickets.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 font-bold flex flex-col items-center gap-4">
                                <Inbox className="w-16 h-16 text-gray-300" />
                                <span>لم تقم بفتح أي تذكرة دعم فني حتى الآن.</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="group relative bg-white/50 hover:bg-white transition-all duration-300 border-2 border-gray-50 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1">
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-xl group-hover:text-indigo-600 transition-colors">{ticket.subject}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">#{ticket.id}</span>
                                                    <span className="text-xs text-gray-400 font-medium italic">آخر تحديث: {formatDate(ticket.updated_at, "medium")}</span>
                                                    {ticket.booking_id && (
                                                        <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                                            <Pin className="w-3.5 h-3.5" /> حجز #{ticket.booking_id}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">{renderStatusBadge(ticket.status)}</div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 leading-relaxed font-bold">
                                            {ticket.description}
                                        </p>

                                        {/* 🟢 عرض رد الإدارة إن وجد */}
                                        {ticket.admin_reply && (
                                            <div className="mt-6 bg-gradient-to-l from-indigo-50/50 to-blue-50/50 border border-indigo-100 p-6 rounded-2xl relative shadow-sm">
                                                <div className="absolute top-0 right-6 -mt-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                                                    <span>رد فريق الدعم</span>
                                                    <Headphones className="w-3.5 h-3.5" />
                                                </div>
                                                <p className="text-sm text-indigo-900 mt-3 font-bold whitespace-pre-wrap leading-relaxed">
                                                    {ticket.admin_reply}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    );
}