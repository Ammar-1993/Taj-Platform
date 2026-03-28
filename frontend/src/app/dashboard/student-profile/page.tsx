"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GradeLevel } from '@/types';

export default function StudentProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 1. جلب المراحل الدراسية عند فتح الصفحة
    useEffect(() => {
        const fetchGradeLevels = async () => {
            try {
                const res = await api.get('/discovery/grade-levels');
                setGradeLevels(res.data.data);
                
                // إذا كان الطالب قد حدد مرحلته مسبقاً، نقوم بتحديدها في القائمة
                if (user?.student_profile?.grade_level_id) {
                    setGradeLevelId(user.student_profile.grade_level_id.toString());
                }
            } catch (error) {
                console.error("خطأ في جلب المراحل الدراسية", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchGradeLevels();
        }
    }, [user, authLoading]);

    // 2. دالة حفظ المرحلة الدراسية
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/profile/student', {
                grade_level_id: gradeLevelId
            });
            
            setMessage({ type: 'success', text: res.data.message || 'تم حفظ المرحلة بنجاح!' });
            
            // 🟢 بعد الحفظ، نوجه الطالب للوحة التحكم الرئيسية أو صفحة البحث عن معلمين
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
            
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex justify-center items-center font-bold text-gray-500 animate-pulse">جاري تجهيز إعداداتك... ⚙️</div>;
    }

    // حماية الصفحة: التأكد أن من يزورها هو طالب فقط
    if (!user?.roles?.some((r) => r.name === 'student')) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-6 text-center">
                <div className="text-6xl mb-4">🛑</div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">عذراً، هذه الصفحة مخصصة للطلاب فقط.</h2>
                <Link href="/dashboard" className="text-blue-600 font-bold hover:underline mt-4">العودة للوحة التحكم</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
            <div className="max-w-2xl w-full space-y-6">
                
                {/* بطاقة الترحيب */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                        🎓
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                        مرحباً بك يا {user?.name.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-500 text-sm">
                        خطوة واحدة تفصلك عن بدء التعلم. يرجى تحديد مرحلتك الدراسية ليتمكن النظام من عرض المعلمين والأسعار المناسبة لك.
                    </p>
                </div>

                {/* نموذج الإعدادات */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    
                    {message.text && (
                        <div className={`p-4 rounded-xl font-bold text-center mb-6 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">اختر مرحلتك الدراسية الحالية *</label>
                            <select 
                                required 
                                value={gradeLevelId} 
                                onChange={(e) => setGradeLevelId(e.target.value)} 
                                className="w-full border-2 border-gray-200 p-4 rounded-xl focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition text-gray-800 font-medium cursor-pointer"
                            >
                                <option value="" disabled>-- اضغط هنا لاختيار المرحلة --</option>
                                {gradeLevels.map(grade => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name} (سعر الحصة: {grade.session_price} ريال)
                                    </option>
                                ))}
                            </select>
                            <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                                <span>💡</span>
                                <p>هذا الاختيار سيضمن لك الحصول على التسعيرة الموحدة لحصصك مع جميع المعلمين في المنصة.</p>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !gradeLevelId} 
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-lg mt-4"
                        >
                            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات وبدء التعلم 🚀'}
                        </button>
                    </form>
                </div>
                
            </div>
        </div>
    );
}