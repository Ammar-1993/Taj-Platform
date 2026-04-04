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
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <PageHeader
                    title="مركز المساعدة والدعم 🛟"
                    subtitle="نحن هنا لمساعدتك. ارفع تذكرة وسنقوم بحل مشكلتك في أسرع وقت."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: نموذج فتح تذكرة جديدة */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                📝 فتح تذكرة جديدة
                            </h3>
                            
                            {message.text && (
                                <div className={`p-3 mb-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">موضوع المشكلة:</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="مثال: المعلم لم يحضر الحصة"
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none transition" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">مرتبطة بحجز؟ (اختياري):</label>
                                    <select
                                        value={bookingId}
                                        onChange={(e) => setBookingId(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-blue-500 outline-none bg-white transition text-sm"
                                    >
                                        <option value="">-- شكوى عامة --</option>
                                        {bookings.map((b: any) => (
                                            <option key={b.id} value={b.id}>
                                                حجز #{b.id} مع {b.teacher?.name} ({new Date(b.booking_date).toLocaleDateString('ar-SA')})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">تفاصيل المشكلة:</label>
                                    <textarea 
                                        required 
                                        rows={4}
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="اشرح المشكلة بالتفصيل لنتمكن من مساعدتك..."
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none transition resize-none" 
                                    ></textarea>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !subject || !description}
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-2"
                                >
                                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال التذكرة 🚀'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* القسم الثاني: سجل التذاكر وردود الإدارة */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">تذاكري السابقة 📂</h3>
                        
                        {tickets.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-medium">
                                لم تقم بفتح أي تذكرة دعم فني حتى الآن.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="border-2 border-gray-100 rounded-xl p-5 hover:border-blue-100 transition bg-gray-50/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{ticket.subject}</h4>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    رقم التذكرة: #{ticket.id} | التحديث: {new Date(ticket.updated_at).toLocaleDateString('ar-SA')} 
                                                    {ticket.booking_id && <span className="text-blue-600 font-bold mr-2"> | 📌 مرتبطة بحجز #{ticket.booking_id}</span>}
                                                </p>
                                            </div>
                                            <div>{renderStatusBadge(ticket.status)}</div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                                            {ticket.description}
                                        </p>

                                        {/* 🟢 عرض رد الإدارة إن وجد */}
                                        {ticket.admin_reply && (
                                            <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-lg relative">
                                                <div className="absolute top-0 right-4 -mt-3 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                                    رد فريق الدعم 🎧
                                                </div>
                                                <p className="text-sm text-blue-900 mt-2 font-medium whitespace-pre-wrap">
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