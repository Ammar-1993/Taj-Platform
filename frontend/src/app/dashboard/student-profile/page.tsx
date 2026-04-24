"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { GradeLevel } from '@/types';
import { showApiError } from '@/hooks/useApiError';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { GraduationCap, AlertCircle, Lightbulb, Rocket, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";

export default function StudentProfilePage() {
    const { user, loading: authLoading } = useAuth();
    
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [gradeLevelId, setGradeLevelId] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successRedirect, setSuccessRedirect] = useState(false);

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

        try {
            const res = await api.post('/profile/student', {
                grade_level_id: gradeLevelId
            });
            
            toast.success(res.data.message || 'تم حفظ المرحلة بنجاح!');
            
            // 🟢 بعد الحفظ، نوجه الطالب للوحة التحكم الرئيسية أو صفحة البحث عن معلمين
            setSuccessRedirect(true);
            
        } catch (error: unknown) {
            showApiError(error, 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gray-50/50 flex justify-center items-center">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                    <div className="absolute top-[10%] -left-20 w-96 h-96 rounded-full bg-indigo-300 blur-[120px]"></div>
                    <div className="absolute bottom-[20%] -right-20 w-[600px] h-[600px] rounded-full bg-purple-200 blur-[150px]"></div>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-md">
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                    <p className="font-bold text-gray-400 animate-pulse">جاري تجهيز إعداداتك...</p>
                </div>
            </div>
        );
    }

    // حماية الصفحة: التأكد أن من يزورها هو طالب فقط
    if (!user?.roles?.some((r) => r.name === 'student')) {
        return (
            <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 flex flex-col justify-center items-center text-center">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                    <div className="absolute top-[10%] -left-20 w-96 h-96 rounded-full bg-indigo-300 blur-[120px]"></div>
                </div>
                <Card className="relative z-10 bg-white/80 backdrop-blur-md rounded-[2.5rem] border-white/50 max-w-md w-full p-10">
                    <div className="flex justify-center mb-6">
                        <AlertCircle className="w-16 h-16 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-rose-600 mb-2">عذراً، هذه الصفحة للطلاب فقط.</h2>
                    <p className="text-gray-500 font-bold mb-8">ليس لديك الصلاحيات الكافية للوصول لهذه الإعدادات.</p>
                    <Link href="/dashboard" className="inline-flex justify-center items-center px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
                        العودة للوحة التحكم
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8 flex justify-center items-center">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-20">
                <div className="absolute top-[10%] -left-20 w-96 h-96 rounded-full bg-indigo-300 blur-[120px]"></div>
                <div className="absolute bottom-[20%] -right-20 w-[600px] h-[600px] rounded-full bg-purple-200 blur-[150px]"></div>
            </div>

            <div className="relative z-10 max-w-2xl w-full space-y-8 tracking-tight">
                
                {/* بطاقة الترحيب */}
                <Card className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border-white/50 text-center animate-fade-in-up p-8 md:p-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner animate-subtle-pulse">
                        <GraduationCap className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                        مرحباً بك يا {user?.name.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-500 text-base font-medium leading-relaxed max-w-md mx-auto font-bold">
                        خطوة واحدة تفصلك عن بدء التعلم. يرجى تحديد مرحلتك الدراسية ليتمكن النظام من تخصيص تجربتك وعرض الأسعار المناسبة لك.
                    </p>
                </Card>

                {/* نموذج الإعدادات */}
                <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay p-8 md:p-10">
                    
                    {successRedirect ? (
                        <RedirectCountdown 
                            href="/dashboard"
                            message="تم حفظ الإعدادات بنجاح! جاري تحويلك..."
                            seconds={2}
                            onCancel={() => setSuccessRedirect(false)}
                        />
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">اختر مرحلتك الدراسية الحالية *</label>
                            <Select 
                                required 
                                value={gradeLevelId} 
                                onChange={(e) => setGradeLevelId(e.target.value)} 
                            >
                                <option value="" disabled>-- اضغط هنا لاختيار المرحلة --</option>
                                {gradeLevels.map(grade => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.name} (سعر الحصة: {grade.session_price} ريال)
                                    </option>
                                ))}
                            </Select>
                            <div className="mt-4 flex items-start gap-3 text-xs bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-indigo-700 font-bold leading-relaxed">
                                <Lightbulb className="w-5 h-5 shrink-0" />
                                <p>هذا الاختيار سيضمن لك الحصول على التسعيرة الموحدة لحصصك مع جميع المعلمين في المنصة حسب المرحلة المختارة.</p>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSubmitting || !gradeLevelId} 
                            className="w-full h-14 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-lg rounded-[1.5rem]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <span>حفظ الإعدادات وبدء التعلم</span>
                                    <Rocket className="w-5 h-5 mr-3" />
                                </>
                            )}
                        </Button>
                    </form>
                    )}
                </Card>
                
            </div>
        </div>
    );
}