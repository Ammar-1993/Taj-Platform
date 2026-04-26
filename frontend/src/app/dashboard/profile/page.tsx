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
import { CheckCircle2, Clock, Info, User, FileText, FileBadge, GraduationCap, Rocket, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";

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
    const [successRedirect, setSuccessRedirect] = useState(false);

    // Sync form with profile data
    useEffect(() => {
        if (profile) {
            setSubjectId(profile.subject_id.toString());
            setBio(profile.bio || '');
        }
    }, [profile]);

    // Mutation for updating profile
    const updateProfileMutation = useMutation({
        mutationFn: (formData: FormData) => teacherService.updateProfile(formData),
        onSuccess: (data) => {
            toast.success(data.message || 'تم حفظ الملف الشخصي بنجاح.');
            queryClient.invalidateQueries({ queryKey: ['teacher-profile', user?.id] });
            setSuccessRedirect(true);
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
             <div className="max-w-4xl mx-auto space-y-8">
                 <Skeleton className="h-10 w-1/3" />
                 <Skeleton className="h-24 rounded-3xl" />
                 <Skeleton className="h-[600px] rounded-3xl" />
             </div>
        </div>
    );
    if (!user?.roles?.some((r) => r.name === 'teacher')) return <div className="p-8 text-center text-red-500 font-bold">هذه الصفحة للمعلمين فقط.</div>;

    return (
        <div className="p-4 md:p-8">
            
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
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><CheckCircle2 className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="text-lg">حسابك موثق ونشط!</h4>
                                    <p className="text-emerald-600/80 text-xs font-medium mt-0.5">أنت تظهر الآن في نتائج بحث الطلاب ويمكنك استقبال الحجوزات.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50/80 backdrop-blur-sm text-amber-800 p-5 rounded-[2rem] font-bold flex items-center gap-4 border border-amber-100 shadow-lg shadow-amber-500/5">
                                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse"><Clock className="w-6 h-6" /></div>
                                <div>
                                    <h4 className="text-lg">حسابك قيد المراجعة الإدارية</h4>
                                    <p className="text-amber-600/80 text-xs font-medium mt-0.5">سيتم تنشيط ملفك فور التحقق من مستنداتك المرفوعة.</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="bg-indigo-50/80 backdrop-blur-sm text-indigo-800 p-5 rounded-[2rem] font-bold flex items-center gap-4 border border-indigo-100 shadow-lg shadow-indigo-500/5">
                            <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Info className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-lg">مرحباً بك في فريق تاج!</h4>
                                <p className="text-indigo-600/80 text-xs font-medium mt-0.5">يرجى إكمال بياناتك ورفع المستندات المطلوبة أدناه لتقديم طلب الانضمام.</p>
                            </div>
                        </div>
                    )}
                </div>



                <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-2 p-8 md:p-10">
                    {successRedirect ? (
                        <RedirectCountdown 
                            href="/dashboard"
                            message="تم حفظ الملف الشخصي بنجاح! جاري تحويلك..."
                            seconds={3}
                            onCancel={() => setSuccessRedirect(false)}
                        />
                    ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-2 underline underline-offset-8 decoration-indigo-100">
                                <User className="w-6 h-6 text-indigo-600" />
                                المعلومات الأساسية
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">المادة التي تدرسها *</label>
                                    <Select 
                                        required 
                                        value={subjectId} 
                                        onChange={(e) => setSubjectId(e.target.value)} 
                                    >
                                        <option value="">-- اختر المادة --</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </Select>
                                </div>
                            </div>

                            <Textarea
                                label="نبذة تعريفية (Bio) *"
                                required 
                                minLength={10}
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                placeholder="اكتب نبذة عن خبراتك وطريقتك في التدريس لجذب الطلاب..."
                                className="h-40 resize-none"
                            />
                        </div>

                        <div className="space-y-6 pt-4 border-t border-gray-50">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-2 underline underline-offset-8 decoration-purple-100">
                                <FileText className="w-6 h-6 text-purple-600" />
                                المستندات المهنية
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group bg-indigo-50/50 p-6 rounded-3xl border-2 border-dashed border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 relative overflow-hidden">
                                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
                                     <label className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                        <FileBadge className="w-4 h-4" /> صورة الهوية الوطنية
                                        {profile?.national_id_path && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">مرفوعة مسبقاً</span>}
                                     </label>
                                     <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        required={!profile?.national_id_path}
                                        onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-indigo-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:transition-all cursor-pointer" 
                                     />
                                </div>

                                <div className="group bg-purple-50/50 p-6 rounded-3xl border-2 border-dashed border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 relative overflow-hidden">
                                     <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:blur-xl transition-all"></div>
                                     <label className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4" /> الشهادة الجامعية
                                        {profile?.degree_path && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">مرفوعة مسبقاً</span>}
                                     </label>
                                     <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        required={!profile?.degree_path}
                                        onChange={(e) => setDegreeFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-purple-400 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:transition-all cursor-pointer" 
                                     />
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-[10px] text-gray-400 font-bold bg-gray-50 inline-block px-4 py-1.5 rounded-full border border-gray-100">
                                    الصيغ المقبولة: <span className="text-indigo-500">JPG, PNG, PDF</span> • الحد الأقصى: <span className="text-indigo-500">5 ميجابايت</span>
                                </p>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending} 
                            className="w-full h-14 bg-gradient-to-r from-brand-600 via-brand-700 to-purple-600 hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] text-lg rounded-taj-xl"
                        >
                            {updateProfileMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    جاري المعالجة...
                                </>
                            ) : (
                                <>
                                    <span>إرسال طلب الانضمام والتوثيق</span>
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
