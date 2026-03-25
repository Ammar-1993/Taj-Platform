"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [subjects, setSubjects] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
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
                api.get('/discovery/subjects'),
                api.get('/profile/teacher')
            ]);
            
            setSubjects(subjectsRes.data.data);
            
            if (profileRes.data.data) {
                const p = profileRes.data.data;
                setProfile(p);
                setSubjectId(p.subject_id?.toString() || '');
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
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'حدث خطأ أثناء الرفع' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold">جاري تحميل الملف الشخصي...</div>;
    if (!user?.roles?.some((r: any) => r.name === 'teacher')) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة للمعلمين فقط.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي والتوثيق 📁</h1>
                        <p className="text-gray-500 text-sm mt-1">أكمل بياناتك وارفع مستنداتك للبدء في استقبال الطلاب.</p>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">العودة للوحة</Link>
                </div>

                {/* شريط حالة التوثيق */}
                {profile ? (
                    profile.is_verified ? (
                        <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold flex items-center gap-2">
                            ✅ حسابك موثق ونشط. أنت تظهر الآن في نتائج بحث الطلاب.
                        </div>
                    ) : (
                        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl font-bold flex items-center gap-2">
                            ⏳ حسابك قيد المراجعة الإدارية. سيتم تنشيطه فور التحقق من مستنداتك.
                        </div>
                    )
                ) : (
                    <div className="bg-blue-100 text-blue-800 p-4 rounded-xl font-bold flex items-center gap-2">
                        ℹ️ يرجى إكمال بياناتك ورفع المستندات أدناه لتقديم طلب الانضمام.
                    </div>
                )}

                {message.text && (
                    <div className={`p-4 rounded-lg font-bold text-center ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">المادة التي تدرسها *</label>
                            <select 
                                required 
                                value={subjectId} 
                                onChange={(e) => setSubjectId(e.target.value)} 
                                className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">-- اختر المادة --</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">نبذة تعريفية (Bio) *</label>
                            <textarea 
                                required 
                                minLength={10}
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                placeholder="اكتب نبذة عن خبراتك وطريقتك في التدريس لجذب الطلاب..."
                                className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-blue-500 outline-none h-32 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 border-dashed">
                                <label className="block text-sm font-bold text-gray-700 mb-2">📄 صورة الهوية الوطنية {profile?.national_id_path ? '(مرفوعة مسبقاً)' : '*'}</label>
                                <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    required={!profile?.national_id_path}
                                    onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 border-dashed">
                                <label className="block text-sm font-bold text-gray-700 mb-2">🎓 الشهادة الجامعية / الأكاديمية {profile?.degree_path ? '(مرفوعة مسبقاً)' : '*'}</label>
                                <input 
                                    type="file" 
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    required={!profile?.degree_path}
                                    onChange={(e) => setDegreeFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 text-center">صيغ الملفات المقبولة: JPG, PNG, PDF. الحد الأقصى للحجم: 5 ميجابايت.</p>

                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري رفع المستندات...' : 'إرسال طلب الانضمام والتوثيق'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}