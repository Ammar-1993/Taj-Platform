"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';

export default function ChildrenManagementPage() {
    const { user } = useAuth();
    const [children, setChildren] = useState<any[]>([]);
    const [gradeLevels, setGradeLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // حالة الفورم (الإضافة)
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', grade_level_id: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [childrenRes, gradesRes] = await Promise.all([
                api.get('/parent/children'),
                api.get('/discovery/grade-levels')
            ]);
            setChildren(childrenRes.data.data);
            setGradeLevels(gradesRes.data.data);
        } catch (error) {
            console.error("حدث خطأ أثناء جلب البيانات", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post('/parent/children', formData);
            setMessage({ type: 'success', text: 'تم إضافة الابن بنجاح!' });
            setFormData({ name: '', email: '', password: '', grade_level_id: '' });
            setShowForm(false);
            fetchData(); // تحديث القائمة
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'حدث خطأ أثناء الإضافة' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePermission = async (childId: number, currentStatus: boolean) => {
        try {
            // تحديث الواجهة فوراً (Optimistic UI) لإعطاء سرعة استجابة للمستخدم
            setChildren(children.map(c => c.id === childId ? {
                ...c, 
                student_profile: { ...c.student_profile, can_book_independently: !currentStatus }
            } : c));

            // إرسال الطلب للسيرفر
            await api.patch(`/parent/children/${childId}/toggle-permission`);
        } catch (error: any) {
            alert('حدث خطأ أثناء تغيير الصلاحية');
            fetchData(); // إعادة جلب البيانات الصحيحة في حال فشل الطلب
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-center">جاري التحميل...</div>;

    // التأكد من أن المستخدم ولي أمر
    const isParent = user?.roles?.some((r: any) => r.name === 'parent');
    if (!isParent) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة مخصصة لأولياء الأمور فقط.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">إدارة الأبناء 👨‍👩‍👧‍👦</h1>
                        <p className="text-gray-500 text-sm mt-1">أضف حسابات أبنائك لتتمكن من حجز الحصص لهم ومتابعتهم.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">العودة للوحة</Link>
                        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                            {showForm ? 'إلغاء الإضافة' : '+ إضافة ابن جديد'}
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                {/* فورم الإضافة */}
                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                        <h3 className="font-bold text-lg mb-4 text-blue-800">بيانات الابن الجديد</h3>
                        <form onSubmit={handleAddChild} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm mb-1 text-gray-700">اسم الابن</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-2 rounded-lg" placeholder="مثال: أحمد" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-700">البريد الإلكتروني (للدخول)</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border p-2 rounded-lg" dir="ltr" placeholder="ahmed@taj.com" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-700">كلمة المرور</label>
                                <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border p-2 rounded-lg" dir="ltr" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-700">المرحلة الدراسية</label>
                                <select required value={formData.grade_level_id} onChange={e => setFormData({...formData, grade_level_id: e.target.value})} className="w-full border p-2 rounded-lg bg-white">
                                    <option value="">-- اختر المرحلة --</option>
                                    {gradeLevels.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2 mt-2">
                                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات الابن'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* قائمة الأبناء */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {children.length === 0 ? (
                        <div className="col-span-full bg-white p-10 rounded-2xl border text-center text-gray-500">
                            لا يوجد أبناء مضافين حالياً. ابدأ بإضافة حساب لابنك.
                        </div>
                    ) : (
                        children.map(child => (
                            <div key={child.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <div className="flex items-center gap-4 mb-4 border-b pb-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                                        {child.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{child.name}</h3>
                                        <p className="text-xs text-gray-500">{child.email}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium">
                                        {child.student_profile?.grade_level?.name || 'غير محدد'}
                                    </span>
                                    <button className="text-blue-600 text-sm hover:underline" onClick={() => alert('ميزة التعديل ستفتح قريباً')}>تعديل</button>
                                </div>

                                {/* 🟢 التحديث الجديد: مفتاح التحكم بالصلاحية */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-sm font-semibold text-gray-700">صلاحية الحجز والدفع:</span>
                                    <button 
                                        onClick={() => handleTogglePermission(child.id, child.student_profile?.can_book_independently)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${child.student_profile?.can_book_independently ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                    >
                                        {child.student_profile?.can_book_independently ? 'مفعل ✅' : 'معطل ❌'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}