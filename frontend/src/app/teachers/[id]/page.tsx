"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { User, TeacherSlot } from '@/types';

export default function TeacherProfile({ params }: { params: { id: string } }) {
    const [teacherName, setTeacherName] = useState('');
    const [slots, setSlots] = useState<{ [date: string]: TeacherSlot[] }>({});
    const [promoCode, setPromoCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 🟢 حالات (States) جديدة خاصة بولي الأمر
    const [children, setChildren] = useState<User[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');

    const router = useRouter();
    const { user } = useAuth(); // جلب بيانات المستخدم من الـ Context

    // 🟢 التحقق مما إذا كان المستخدم ولي أمر
    const isParent = user?.roles?.some((r) => r.name === 'parent');

    useEffect(() => {
        fetchSlots();
    }, []);

    // 🟢 جلب أبناء ولي الأمر إذا كان المستخدم أباً
    useEffect(() => {
        if (isParent) {
            api.get('/parent/children')
               .then(res => setChildren(res.data.data))
               .catch(err => console.error("حدث خطأ في استدعاء بيانات الأبناء", err));
        }
    }, [isParent]);

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

        // 🟢 تحقق أمني: إذا كان أباً ولم يختر ابناً
        if (isParent && !selectedChildId) {
            setMessage({ type: 'error', text: 'الرجاء اختيار الابن الذي سيحضر الحصة أولاً من القائمة أعلاه.' });
            window.scrollTo({ top: 0, behavior: 'smooth' }); // رفع الشاشة للأعلى ليرى الخطأ
            return;
        }

        if (!confirm('هل أنت متأكد من حجز هذا الموعد؟ سيتم خصم المبلغ من محفظتك.')) return;

        setBookingLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/bookings', {
                teacher_slot_id: slotId,
                promo_code: promoCode || null,
                child_id: isParent ? selectedChildId : undefined // 🟢 إرسال رقم الابن للسيرفر
            });
            
            setMessage({ type: 'success', text: res.data.message });
            
            // تحديث الأوقات لإخفاء الموعد المحجوز
            fetchSlots();
            
            // إعادة التوجيه للوحة التحكم بعد 3 ثوانٍ
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);

        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
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

                {/* 🟢 القائمة المنسدلة لاختيار الابن (تظهر لولي الأمر فقط) */}
                {isParent && (
                    <div className="mb-6 bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                        <label className="block text-sm font-bold text-indigo-900 mb-2">
                            👨‍👦 اختر الابن الذي سيحضر الحصة (إلزامي):
                        </label>
                        <select 
                            value={selectedChildId}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                            className="w-full border p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">-- اضغط لاختيار الابن --</option>
                            {children.map(child => (
                                <option key={child.id} value={child.id}>
                                    {child.name} ({child.student_profile?.grade_level?.name || 'بدون مرحلة'})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* كود الخصم */}
                <div className="mb-8 bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center gap-4">
                    <span className="text-blue-800 font-semibold whitespace-nowrap">هل لديك كود خصم؟</span>
                    <input 
                        type="text" 
                        placeholder="أدخل الكود هنا" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        dir="ltr"
                    />
                </div>

                {/* عرض الأوقات المجمعة حسب اليوم */}
                {Object.keys(slots).length === 0 ? (
                    <div className="text-center py-10 text-gray-500 font-semibold bg-gray-50 rounded-lg">عفواً، لا توجد مواعيد متاحة حالياً لهذا المعلم.</div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(slots).map(([date, daySlots]) => (
                            <div key={date}>
                                <h3 className="text-xl font-bold mb-4 bg-gray-100 p-2 rounded-lg px-4 border-r-4 border-blue-600">
                                    🗓️ {date}
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {daySlots.map((slot: TeacherSlot) => (
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