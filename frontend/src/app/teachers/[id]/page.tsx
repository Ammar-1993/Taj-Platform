"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

export default function TeacherProfile({ params }: { params: { id: string } }) {
    const [teacherName, setTeacherName] = useState('');
    const [slots, setSlots] = useState<any>({});
    const [promoCode, setPromoCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const router = useRouter();
    const { user } = useAuth(); // جلب بيانات الطالب من الـ Context

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            const res = await api.get(`/discovery/teachers/${params.id}/slots`);
            setTeacherName(res.data.teacher_name);
            setSlots(res.data.data); // الأوقات مجمعة حسب التاريخ من الـ Backend
        } catch (error) {
            console.error("خطأ في جلب المواعيد", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (slotId: number) => {
        // التحقق من تسجيل الدخول أولاً
        if (!user) {
            alert('يجب عليك تسجيل الدخول أولاً لإتمام الحجز.');
            router.push('/login');
            return;
        }

        if (!confirm('هل أنت متأكد من حجز هذا الموعد؟ سيتم خصم المبلغ من محفظتك.')) return;

        setBookingLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/bookings', {
                teacher_slot_id: slotId,
                promo_code: promoCode || null
            });
            
            setMessage({ type: 'success', text: res.data.message });
            
            // تحديث الأوقات لإخفاء الموعد المحجوز
            fetchSlots();
            
            // إعادة التوجيه للوحة التحكم بعد 3 ثوانٍ
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);

        } catch (error: any) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'حدث خطأ غير متوقع' 
            });
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="text-center py-20 animate-pulse font-bold text-xl">جاري تحميل المواعيد...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="border-b pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">حجز موعد مع {teacherName}</h1>
                    <p className="text-gray-500 mt-2">اختر الوقت المناسب لك من القائمة أدناه.</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 text-white font-bold text-center ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {message.text}
                    </div>
                )}

                {/* كود الخصم */}
                <div className="mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4">
                    <span className="text-blue-800 font-semibold">هل لديك كود خصم؟</span>
                    <input 
                        type="text" 
                        placeholder="أدخل الكود هنا" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                        dir="ltr"
                    />
                </div>

                {/* عرض الأوقات المجمعة حسب اليوم */}
                {Object.keys(slots).length === 0 ? (
                    <div className="text-center py-10 text-gray-500 font-semibold bg-gray-50 rounded-lg">عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم.</div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(slots).map(([date, daySlots]: [string, any]) => (
                            <div key={date}>
                                <h3 className="text-xl font-bold mb-4 bg-gray-100 p-2 rounded-lg px-4 border-r-4 border-blue-600">
                                    🗓️ {date}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {daySlots.map((slot: any) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleBooking(slot.id)}
                                            disabled={bookingLoading}
                                            className="border-2 border-blue-100 hover:border-blue-600 bg-white hover:bg-blue-50 text-blue-900 font-semibold py-3 px-4 rounded-xl transition flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <span>{slot.start_time.substring(0, 5)}</span>
                                            <span className="text-xs text-gray-500">إلى {slot.end_time.substring(0, 5)}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}