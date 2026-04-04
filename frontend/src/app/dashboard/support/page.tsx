"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { showApiError } from '@/hooks/useApiError';

export default function SupportPage() {
    const { user } = useAuth();
    
    // حالات جلب البيانات
    const [tickets, setTickets] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // حالات نموذج الإرسال
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // جلب التذاكر السابقة وجلب الحجوزات (لربط الشكوى بحجز معين)
            const [ticketsRes, bookingsRes] = await Promise.all([
                api.get('/support-tickets'),
                api.get('/bookings') // نفترض أن هذا المسار موجود مسبقاً لجلب حجوزات الطالب
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
        setMessage({ type: '', text: '' });

        try {
            const payload: any = { subject, description };
            if (bookingId) payload.booking_id = bookingId;

            const res = await api.post('/support-tickets', payload);
            
            setMessage({ type: 'success', text: res.data.message });
            setSubject('');
            setDescription('');
            setBookingId('');
            
            fetchData(); // تحديث قائمة التذاكر فوراً
        } catch (error: unknown) {
            showApiError(error, 'حدث خطأ أثناء إرسال التذكرة.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        return <StatusBadge status={status} />;
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold text-gray-500">جاري تحميل مركز المساعدة...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-20">
                <div className="absolute top-[10%] -left-20 w-96 h-96 rounded-full bg-indigo-300 blur-[120px]"></div>
                <div className="absolute bottom-[20%] -right-20 w-[500px] h-[500px] rounded-full bg-purple-200 blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
                
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                            <span className="text-4xl animate-subtle-pulse">🛟</span>
                            مركز المساعدة والدعم
                        </h1>
                        <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">نحن هنا لمساعدتك. ارفع تذكرة وسنقوم بحل مشكلتك في أسرع وقت.</p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="px-5 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5"
                    >
                        <span>العودة للوحة التحكم</span>
                        <span>🏠</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: نموذج فتح تذكرة جديدة */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/50 animate-fade-in-up-delay">
                            <h3 className="font-black text-xl text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-lg shadow-inner">
                                    📝
                                </span>
                                فتح تذكرة جديدة
                            </h3>
                            
                            {message.text && (
                                <div className={`p-4 mb-6 rounded-2xl text-sm font-bold shadow-sm animate-bounce-subtle ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmitTicket} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">موضوع المشكلة:</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="مثال: المعلم لم يحضر الحصة"
                                        className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-gray-300" 
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
                                            {bookings.map((b: any) => (
                                                <option key={b.id} value={b.id}>
                                                    حجز #{b.id} مع {b.teacher?.name} ({new Date(b.booking_date).toLocaleDateString('ar-SA')})
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
                                
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !subject || !description}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black py-4 rounded-2xl hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all duration-300 disabled:opacity-50 mt-4 hover:-translate-y-1 active:scale-95"
                                >
                                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال التذكرة 🚀'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* القسم الثاني: سجل التذاكر وردود الإدارة */}
                    <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/50 h-fit animate-fade-in-up-delay">
                        <h3 className="font-extrabold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
                             <span className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-lg shadow-inner">
                                    📂
                             </span>
                             تذاكري السابقة
                        </h3>
                        
                        {tickets.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 font-bold flex flex-col items-center gap-4">
                                <div className="text-6xl opacity-20">📭</div>
                                <span>لم تقم بفتح أي تذكرة دعم فني حتى الآن.</span>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="group relative bg-white/50 hover:bg-white transition-all duration-300 border-2 border-gray-50 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1">
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-5 gap-3">
                                            <div>
                                                <h4 className="font-black text-gray-900 text-xl group-hover:text-indigo-600 transition-colors">{ticket.subject}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">#{ticket.id}</span>
                                                    <span className="text-xs text-gray-400 font-medium italic">آخر تحديث: {new Date(ticket.updated_at).toLocaleDateString('ar-SA')}</span>
                                                    {ticket.booking_id && (
                                                        <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                                            📌 حجز #{ticket.booking_id}
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
                                                <div className="absolute top-0 right-6 -mt-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                                                    <span>رد فريق الدعم</span>
                                                    <span>🎧</span>
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
                    </div>

                </div>
            </div>
        </div>
    );
}