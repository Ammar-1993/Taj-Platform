"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';

export default function TeacherSchedulePage() {
    const { user } = useAuth();
    const [slots, setSlots] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // حالة الفورم
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) fetchSlots();
    }, [user]);

    const fetchSlots = async () => {
        try {
            const res = await api.get('/teacher/slots');
            setSlots(res.data.data);
        } catch (error) {
            console.error("خطأ في جلب الجدول", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('/teacher/slots', {
                slot_date: date,
                start_time: startTime,
                end_time: endTime
            });
            
            setMessage({ type: 'success', text: 'تم إضافة الموعد بنجاح! ✅' });
            setStartTime(''); // تصفير الوقت لتسهيل الإضافة التالية
            setEndTime('');
            fetchSlots(); // تحديث الجدول فوراً
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'حدث خطأ غير متوقع' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSlot = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا الموعد؟')) return;
        
        try {
            await api.delete(`/teacher/slots/${id}`);
            fetchSlots();
        } catch (error: any) {
            alert(error.response?.data?.message || 'لا يمكن حذف الموعد.');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold">جاري تحميل الجدول...</div>;
    if (!user?.roles?.some((r: any) => r.name === 'teacher')) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة للمعلمين فقط.</div>;

    // الحصول على تاريخ اليوم كحد أدنى للإدخال
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">إدارة جدول المواعيد 📅</h1>
                        <p className="text-gray-500 text-sm mt-1">أضف أوقات فراغك ليتمكن الطلاب من الحجز معك.</p>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">العودة للوحة</Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* عمود إضافة المواعيد */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-blue-100 h-fit">
                        <h3 className="font-bold text-lg text-blue-900 mb-4">إضافة موعد متاح جديد</h3>
                        
                        {message.text && (
                            <div className={`p-3 mb-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleAddSlot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ اليوم:</label>
                                <input 
                                    type="date" 
                                    required 
                                    min={today}
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none" 
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1/2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">يبدأ من:</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={startTime} 
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none" 
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ينتهي في:</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={endTime} 
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none" 
                                    />
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-2"
                            >
                                {isSubmitting ? 'جاري الإضافة...' : '+ إضافة الموعد للجدول'}
                            </button>
                        </form>
                    </div>

                    {/* عمود عرض الجدول الحالي */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">جدول أوقاتك المتاحة والمحجوزة 🗓️</h3>
                        
                        {Object.keys(slots).length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500">
                                ليس لديك أي مواعيد مضافة في المستقبل. ابدأ بإضافة أوقات فراغك.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(slots).map(([dayDate, daySlots]: [string, any]) => (
                                    <div key={dayDate} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">📅 {dayDate}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {daySlots.map((slot: any) => (
                                                <div 
                                                    key={slot.id} 
                                                    className={`p-3 rounded-lg border-2 flex justify-between items-center ${
                                                        slot.status === 'available' ? 'border-green-200 bg-green-50' : 
                                                        slot.status === 'booked' ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-800 text-sm">
                                                            {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                                        </div>
                                                        <div className={`text-xs font-semibold mt-1 ${
                                                            slot.status === 'available' ? 'text-green-600' : 
                                                            slot.status === 'booked' ? 'text-blue-600' : 'text-red-600'
                                                        }`}>
                                                            {slot.status === 'available' ? 'متاح للطلاب' : 
                                                             slot.status === 'booked' ? 'محجوز 🔒' : 'مغلق'}
                                                        </div>
                                                    </div>
                                                    
                                                    {slot.status === 'available' && (
                                                        <button 
                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                            className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-md transition"
                                                            title="حذف الموعد"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
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