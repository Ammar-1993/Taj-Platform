"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import DecorativeBackground from '@/components/ui/DecorativeBackground';
import { showApiError } from '@/hooks/useApiError';
import { ApiResponse, Subject, TeacherProfile } from '@/types';

export default function TeacherProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [loading, setLoading] = useState(true);
    
    // حالات الفورم
    const [subjectId, setSubjectId] = useState('');
    const [bio, setBio] = useState('');
    const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
    const [degreeFile, setDegreeFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [subjectsRes, profileRes] = await Promise.all([
                api.get<ApiResponse<Subject[]>>('/discovery/subjects'),
                api.get<ApiResponse<TeacherProfile>>('/profile/teacher')
            ]);
            
            setSubjects(subjectsRes.data.data || []);
            
            if (profileRes.data?.data) {
                const p = profileRes.data.data;
                setProfile(p);
                setSubjectId(p.subject_id.toString());
                setBio(p.bio || '');
            }
        } catch (error) {
            console.error("خطأ في جلب البيانات", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        // استخدمنا FormData لأننا نرسل ملفات (Files)
        const formData = new FormData();
        formData.append('subject_id', subjectId);
        formData.append('bio', bio);
        
        if (nationalIdFile) formData.append('national_id', nationalIdFile);
        if (degreeFile) formData.append('degree', degreeFile);

        try {
            const res = await api.post('/profile/teacher', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: res.data.message });
            setProfile(res.data.data); // تحديث الحالة
            
            // العودة للوحة بعد 3 ثواني
            setTimeout(() => router.push('/dashboard'), 3000);
        } catch (error: unknown) {
            showApiError(error, 'حدث خطأ أثناء الرفع');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold">جاري تحميل الملف الشخصي...</div>;
    if (!user?.roles?.some((r) => r.name === 'teacher')) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة للمعلمين فقط.</div>;

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8">
            <DecorativeBackground />

            <div className="relative z-10 max-w-4xl mx-auto space-y-8 tracking-tight">
                
                <PageHeader
                    title="الملف الشخصي والتوثيق"
                    subtitle="أكمل بياناتك وارفع مستنداتك للبدء في استقبال الطلاب والتدريس."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                />

                {/* شريط حالة التوثيق */}
                <div className="animate-fade-in-up-delay">
                    {profile ? (
                        profile.is_verified ? (
                            <div className="bg-emerald-50/80 backdrop-blur-sm text-emerald-800 p-5 rounded-[2rem] font-bold flex items-center gap-4 border border-emerald-100 shadow-lg shadow-emerald-500/5">
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">✅</div>
                                <div>
                                    <h4 className="text-lg">حسابك موثق ونشط!</h4>
                                    <p className="text-emerald-600/80 text-xs font-medium mt-0.5">أنت تظهر الآن في نتائج بحث الطلاب ويمكنك استقبال الحجوزات.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50/80 backdrop-blur-sm text-amber-800 p-5 rounded-[2rem] font-bold flex items-center gap-4 border border-amber-100 shadow-lg shadow-amber-500/5">
                                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg animate-pulse">⏳</div>
                                <div>
                                    <h4 className="text-lg">حسابك قيد المراجعة الإدارية</h4>
                                    <p className="text-amber-600/80 text-xs font-medium mt-0.5">سيتم تنشيط ملفك فور التحقق من مستنداتك المرفوعة.</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="bg-indigo-50/80 backdrop-blur-sm text-indigo-800 p-5 rounded-[2rem] font-bold flex items-center gap-4 border border-indigo-100 shadow-lg shadow-indigo-500/5">
                            <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg">ℹ️</div>
                            <div>
                                <h4 className="text-lg">مرحباً بك في فريق تاج!</h4>
                                <p className="text-indigo-600/80 text-xs font-medium mt-0.5">يرجى إكمال بياناتك ورفع المستندات المطلوبة أدناه لتقديم طلب الانضمام.</p>
                            </div>
                        </div>
                    )}
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg font-bold text-center ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-white/50 animate-fade-in-up-delay-2">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-2 underline underline-offset-8 decoration-indigo-100">
                                <span className="text-2xl">👤</span>
                                المعلومات الأساسية
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">المادة التي تدرسها *</label>
                                    <div className="relative">
                                        <select 
                                            required 
                                            value={subjectId} 
                                            onChange={(e) => setSubjectId(e.target.value)} 
                                            className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all duration-200 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                                        >
                                            <option value="">-- اختر المادة --</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">نبذة تعريفية (Bio) *</label>
                                <textarea 
                                    required 
                                    minLength={10}
                                    value={bio} 
                                    onChange={(e) => setBio(e.target.value)} 
                                    placeholder="اكتب نبذة عن خبراتك وطريقتك في التدريس لجذب الطلاب..."
                                    className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none h-40 resize-none transition-all duration-200 font-medium placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-gray-50">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 mb-2 underline underline-offset-8 decoration-purple-100">
                                <span className="text-2xl">📑</span>
                                المستندات المهنية
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group bg-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 relative overflow-hidden">
                                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
                                     <label className="block text-sm font-black text-indigo-900 mb-3 flex items-center gap-2">
                                        📄 صورة الهوية الوطنية
                                        {profile?.national_id_path && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">مرفوعة مسبقاً</span>}
                                     </label>
                                     <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        required={!profile?.national_id_path}
                                        onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-indigo-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:transition-all cursor-pointer" 
                                     />
                                </div>

                                <div className="group bg-purple-50/50 p-6 rounded-3xl border-2 border-dashed border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 relative overflow-hidden">
                                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
                                     <label className="block text-sm font-black text-purple-900 mb-3 flex items-center gap-2">
                                        🎓 الشهادة الجامعية
                                        {profile?.degree_path && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">مرفوعة مسبقاً</span>}
                                     </label>
                                     <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        required={!profile?.degree_path}
                                        onChange={(e) => setDegreeFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-purple-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:transition-all cursor-pointer" 
                                     />
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-[10px] text-gray-400 font-bold bg-gray-50 inline-block px-4 py-1.5 rounded-full border border-gray-100">
                                    الصيغ المقبولة: <span className="text-indigo-500">JPG, PNG, PDF</span> • الحد الأقصى: <span className="text-indigo-500">5 ميجابايت</span>
                                </p>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-black py-4.5 rounded-[1.5rem] hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] transition-all duration-300 disabled:opacity-50 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 text-lg shadow-xl"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    جاري المعالجة...
                                </>
                            ) : (
                                <>
                                    <span>إرسال طلب الانضمام والتوثيق</span>
                                    <span>🚀</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}