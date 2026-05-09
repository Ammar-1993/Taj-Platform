"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { teacherService, discoveryService } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { showApiError } from '@/hooks/useApiError';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, Clock, Info, User, FileText, GraduationCap, Rocket, Loader2, Edit3, ShieldCheck, UploadCloud } from "lucide-react";

export default function TeacherProfilePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Fetch subjects
    const { data: subjectsData } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => discoveryService.getSubjects(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    const subjects = subjectsData?.data || [];

    // Fetch profile
    const { data: profileData, isLoading: loading } = useQuery({
        queryKey: ['teacher-profile', user?.id],
        queryFn: () => teacherService.getProfile(),
        enabled: !!user,
    });

    const profile = profileData?.data || null;
    
    // حالات الفورم
    const [subjectId, setSubjectId] = useState('');
    const [bio, setBio] = useState('');
    const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
    const [degreeFile, setDegreeFile] = useState<File | null>(null);

    // Sync form with profile data
    useEffect(() => {
        if (profile) {
            setSubjectId(profile.subject_id?.toString() || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    const isDirty = profile ? (
        subjectId !== (profile.subject_id?.toString() || '') ||
        bio !== (profile.bio || '') ||
        nationalIdFile !== null ||
        degreeFile !== null
    ) : true;

    // Mutation for updating profile
    const updateProfileMutation = useMutation({
        mutationFn: (formData: FormData) => teacherService.updateProfile(formData),
        onSuccess: (data) => {
            toast.success(data.message || 'تم حفظ الملف الشخصي بنجاح.');
            setNationalIdFile(null);
            setDegreeFile(null);
            queryClient.invalidateQueries({ queryKey: ['teacher-profile', user?.id] });
        },
        onError: (error: unknown) => {
            showApiError(error, 'حدث خطأ أثناء الرفع');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('subject_id', subjectId);
        formData.append('bio', bio);
        if (nationalIdFile) formData.append('national_id', nationalIdFile);
        if (degreeFile) formData.append('degree', degreeFile);

        updateProfileMutation.mutate(formData);
    };

    if (loading) return (
        <div className="p-8 min-h-screen">
             <div className="max-w-7xl mx-auto space-y-8">
                 <Skeleton className="h-10 w-1/3" />
                 <Skeleton className="h-24 rounded-3xl" />
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Skeleton className="h-[500px] rounded-[2.5rem]" />
                    <Skeleton className="h-[500px] rounded-[2.5rem]" />
                 </div>
             </div>
        </div>
    );

    if (!user?.roles?.some((r) => r.name === 'teacher')) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة للمعلمين فقط.</div>;

    return (
        <div className="p-4 md:p-8">
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight" dir="rtl">
                
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
                            <div className="bg-emerald-50/80 backdrop-blur-sm text-emerald-800 p-6 rounded-[2.5rem] font-bold flex items-center gap-4 border border-emerald-100 shadow-lg shadow-emerald-500/5">
                                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><CheckCircle2 className="w-7 h-7" /></div>
                                <div>
                                    <h4 className="text-xl">حسابك موثق ونشط!</h4>
                                    <p className="text-emerald-600/80 text-sm font-medium mt-0.5 font-bold">أنت تظهر الآن في نتائج بحث الطلاب ويمكنك استقبال الحجوزات.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50/80 backdrop-blur-sm text-amber-800 p-6 rounded-[2.5rem] font-bold flex items-center gap-4 border border-amber-100 shadow-lg shadow-amber-500/5">
                                <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse"><Clock className="w-7 h-7" /></div>
                                <div>
                                    <h4 className="text-xl">حسابك قيد المراجعة الإدارية</h4>
                                    <p className="text-amber-600/80 text-sm font-medium mt-0.5 font-bold">سيتم تنشيط ملفك فور التحقق من مستنداتك المرفوعة.</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="bg-indigo-50/80 backdrop-blur-sm text-indigo-800 p-6 rounded-[2.5rem] font-bold flex items-center gap-4 border border-indigo-100 shadow-lg shadow-indigo-500/5">
                            <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Info className="w-7 h-7" /></div>
                            <div>
                                <h4 className="text-xl font-bold">مرحباً بك في فريق تاج!</h4>
                                <p className="text-indigo-600/80 text-sm font-medium mt-0.5 font-bold">يرجى إكمال بياناتك ورفع المستندات المطلوبة أدناه لتقديم طلب الانضمام.</p>
                            </div>
                        </div>
                    )}
                </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                            
                            {/* ═══════════════════════════════════════════════
                                Card 1 — المعلومات الأساسية
                            ═══════════════════════════════════════════════ */}
                            <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-2 p-10 shadow-sm h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                        <User className="w-6 h-6" />
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        المعلومات الأساسية
                                    </h3>
                                </div>
                                
                                <div className="space-y-8 flex-1">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3 mr-1">المادة التي تدرسها *</label>
                                        <Select 
                                            required 
                                            value={subjectId} 
                                            onChange={(e) => setSubjectId(e.target.value)} 
                                            icon={<Edit3 className="w-4 h-4" />}
                                            className="bg-gray-50/50 rounded-2xl border-gray-100"
                                        >
                                            <option value="">-- اختر المادة --</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </Select>
                                    </div>

                                    <Textarea
                                        label="نبذة تعريفية (Bio) *"
                                        required 
                                        minLength={10}
                                        value={bio} 
                                        onChange={(e) => setBio(e.target.value)} 
                                        placeholder="اكتب نبذة عن خبراتك وطريقتك في التدريس لجذب الطلاب..."
                                        className="h-64 resize-none bg-gray-50/50 rounded-2xl border-gray-100 focus:bg-white transition-all"
                                    />
                                </div>
                            </Card>

                            {/* ═══════════════════════════════════════════════
                                Card 2 — المستندات المهنية
                            ═══════════════════════════════════════════════ */}
                            <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-3 p-10 shadow-sm h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                                        <FileText className="w-6 h-6" />
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        المستندات المهنية
                                    </h3>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="group bg-indigo-50/50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-100 hover:border-indigo-400 hover:bg-white transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
                                        <label className="text-sm font-bold text-indigo-900 mb-4 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-indigo-600" /> 
                                                صورة الهوية الوطنية
                                            </span>
                                            {profile?.national_id_path && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold shadow-sm">مرفوعة مسبقاً</span>}
                                        </label>
                                        
                                        <div className="flex flex-col gap-3">
                                            <input 
                                                id="national_id"
                                                type="file" 
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                required={!profile?.national_id_path}
                                                onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                                                className="hidden" 
                                            />
                                            <label 
                                                htmlFor="national_id"
                                                className="w-full h-14 bg-white border-2 border-indigo-100 rounded-xl flex items-center px-6 gap-3 cursor-pointer hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-sm font-bold text-gray-700 overflow-hidden"
                                            >
                                                <UploadCloud className="w-5 h-5 text-indigo-500 shrink-0" />
                                                <span className="truncate">
                                                    {nationalIdFile ? nationalIdFile.name : "اختر ملف الهوية الوطنية"}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="group bg-purple-50/50 p-6 rounded-[2rem] border-2 border-dashed border-purple-100 hover:border-purple-400 hover:bg-white transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
                                        <label className="text-sm font-bold text-purple-900 mb-4 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <GraduationCap className="w-5 h-5 text-purple-600" /> 
                                                الشهادة الجامعية
                                            </span>
                                            {profile?.degree_path && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold shadow-sm">مرفوعة مسبقاً</span>}
                                        </label>
                                        
                                        <div className="flex flex-col gap-3">
                                            <input 
                                                id="degree"
                                                type="file" 
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                required={!profile?.degree_path}
                                                onChange={(e) => setDegreeFile(e.target.files?.[0] || null)}
                                                className="hidden" 
                                            />
                                            <label 
                                                htmlFor="degree"
                                                className="w-full h-14 bg-white border-2 border-purple-100 rounded-xl flex items-center px-6 gap-3 cursor-pointer hover:border-purple-600 hover:bg-purple-50/50 transition-all text-sm font-bold text-gray-700 overflow-hidden"
                                            >
                                                <UploadCloud className="w-5 h-5 text-purple-500 shrink-0" />
                                                <span className="truncate">
                                                    {degreeFile ? degreeFile.name : "اختر ملف الشهادة الجامعية"}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                                            <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                                                يرجى التأكد من أن جميع الملفات واضحة وقابلة للقراءة. 
                                                الصيغ المقبولة: <span className="text-indigo-600">JPG, PNG, PDF</span> بحد أقصى <span className="text-indigo-600">5 ميجابايت</span> للملف الواحد.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="flex flex-col items-end pt-4 gap-3">
                            {profile?.is_verified && isDirty && (
                                <div className="bg-amber-50/80 backdrop-blur-sm text-amber-700 px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 border border-amber-200 animate-fade-in-up">
                                    <Info className="w-5 h-5" />
                                    تنبيه: حفظ التعديلات سيؤدي إلى إعادة حسابك لحالة &quot;قيد المراجعة&quot;.
                                </div>
                            )}
                            <Button 
                                type="submit" 
                                disabled={updateProfileMutation.isPending || !isDirty} 
                                className="h-16 px-12 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-xl rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {updateProfileMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin ml-3" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <span>{profile ? (profile.is_verified ? "حفظ التعديلات" : "تحديث الطلب") : "إرسال طلب الانضمام والتوثيق"}</span>
                                        {(!profile || !profile.is_verified) && <Rocket className="w-6 h-6 mr-4 animate-bounce" />}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
            </div>
        </div>
    );
}
