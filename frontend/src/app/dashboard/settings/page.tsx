"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { authService, discoveryService, profileService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  User as UserIcon,
  Lock as LockIcon,
  Mail,
  Phone,
  Edit3,
  Loader2,
  Save,
  GraduationCap,
  Lightbulb,
  Shield,
  Fingerprint,
  Camera,
  Upload,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Select } from "@/components/ui/Select";
import { GradeLevel } from "@/types";

interface ProfileFormData {
  name: string;
  current_password: string;
  password: string;
  password_confirmation: string;
  grade_level_id: string;
}

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Holds the confirmed remote URL after a successful upload, preventing race conditions
  // between clearing avatarPreview and the async AuthContext update.
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      grade_level_id: user?.student_profile?.grade_level_id?.toString() || "",
    },
  });

  // Sync form defaults if user changes (e.g. after update)
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        grade_level_id: user.student_profile?.grade_level_id?.toString() || "",
      });
    }
  }, [user, reset]);

  // Reset imageError when avatar URL or preview changes
  useEffect(() => {
    setImageError(false);
  }, [user?.avatar_url, avatarPreview]);

  // Fetch grade levels for student role
  const { data: gradesData } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => discoveryService.getGradeLevels(),
    enabled: !!user?.roles?.some(role => role.name === 'student'),
    staleTime: 5 * 60 * 1000,
  });

  const gradeLevels: GradeLevel[] = gradesData?.data || [];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن لا يتجاوز 2 ميجابايت");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const formData = new FormData();
      let hasUserUpdates = false;

      if (data.name !== user?.name) {
        formData.append('name', data.name);
        hasUserUpdates = true;
      }

      if (data.password) {
        formData.append('current_password', data.current_password);
        formData.append('password', data.password);
        formData.append('password_confirmation', data.password_confirmation);
        hasUserUpdates = true;
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
        hasUserUpdates = true;
      }

      const isStudent = user?.roles?.some(role => role.name === 'student');

      if (hasUserUpdates) {
        const response = await authService.updateUser(formData);
        setUser(response.data);

        // If an avatar was uploaded, grab the confirmed URL from the response
        // and store it in local state BEFORE clearing the preview.
        // This eliminates the race condition between async context propagation
        // and local state clearing.
        if (avatarFile && response.data.avatar_url) {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
          const fullUrl = response.data.avatar_url.startsWith('http')
            ? response.data.avatar_url
            : `${baseUrl}${response.data.avatar_url.startsWith('/') ? '' : '/'}${response.data.avatar_url}`;
          setSavedAvatarUrl(fullUrl);
        }
      }

      // Handle Student Grade Level Update
      if (isStudent && data.grade_level_id && data.grade_level_id !== user?.student_profile?.grade_level_id?.toString()) {
        await profileService.updateStudentProfile({ 
          grade_level_id: parseInt(data.grade_level_id) 
        });
        
        // Refresh user data to get updated student_profile
        const updatedUser = await authService.getMe();
        setUser(updatedUser.data);
      }

      if (hasUserUpdates || (isStudent && data.grade_level_id !== user?.student_profile?.grade_level_id?.toString())) {
        toast.success("تم تحديث البيانات بنجاح.");
        setAvatarFile(null);
        setAvatarPreview(null); // Safe to clear now — savedAvatarUrl will be used instead
      } else {
        toast("لم يتم إجراء أي تغييرات.");
      }
    } catch (error: unknown) {
      const responseError = error as { response?: { data?: { message?: string } } };
      setError(
        responseError.response?.data?.message ||
          "حدث خطأ أثناء تحديث البيانات."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const isStudent = user?.roles?.some(role => role.name === 'student');

  // Helper to get correct avatar URL — priority: live preview > saved local > remote from context
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;        // Actively selecting a new file
    if (savedAvatarUrl) return savedAvatarUrl;       // Just uploaded, confirmed URL
    if (user.avatar_url) {                           // Loaded fresh from the server
      if (user.avatar_url.startsWith('http')) return user.avatar_url;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      return `${baseUrl}${user.avatar_url.startsWith('/') ? '' : '/'}${user.avatar_url}`;
    }
    return null;
  };

  const finalAvatarUrl = getAvatarUrl();
  const nameInitial = user.name ? user.name.charAt(0) : "؟";

  return (
    <div className="p-4 md:p-8">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8" dir="rtl">
        {/* ── Page Header ── */}
        <PageHeader
          title="إعدادات الحساب"
          subtitle="إدارة معلومات حسابك الشخصية وتفضيلات الخصوصية."
          backHref="/dashboard"
          backLabel="العودة للوحة التحكم"
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ═══════════════════════════════════════════════
              Card 1 — المعلومات الشخصية
          ═══════════════════════════════════════════════ */}
          <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay overflow-hidden shadow-sm h-full">
            {/* Card Header */}
            <div className="flex items-center gap-3 px-10 pt-10 pb-4">
              <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <UserIcon className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                المعلومات الشخصية
              </h2>
            </div>

            <div className="px-10 pb-10 pt-4 space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex items-center gap-6 p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/20">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center transition-transform active:scale-95">
                    {finalAvatarUrl && !imageError ? (
                      <div className="relative w-full h-full">
                        <Image 
                          src={finalAvatarUrl} 
                          alt="Avatar" 
                          fill
                          className="object-cover" 
                          unoptimized={finalAvatarUrl.startsWith('data:')}
                          onError={() => setImageError(true)}
                        />
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-white">{nameInitial}</span>
                    )}
                    
                    <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <Camera className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  
                  {/* Floating Upload Icon */}
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border-2 border-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform z-20">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />

                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    الصورة الشخصية
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                    انقر لتغيير صورتك. الصيغ المدعومة: JPG, PNG. الحد الأقصى 2 ميجابايت.
                  </p>
                  {avatarFile && (
                    <button 
                      type="button"
                      onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                      className="mt-2 text-[10px] font-bold text-red-500 hover:text-red-600 underline underline-offset-2"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>
              </div>

              {/* Full Name */}
              <Input
                label="الاسم الكامل"
                {...register("name", { required: "الاسم مطلوب" })}
                error={errors.name?.message}
                icon={<Edit3 className="w-4 h-4" />}
                className="bg-gray-50/50 rounded-xl border-gray-100"
              />

              {/* Email — Read-only */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative group">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    dir="ltr"
                    className="flex w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-400 text-left pl-10 cursor-not-allowed opacity-70"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-green-600 font-bold text-left">
                  حساب موثق
                </p>
              </div>

              {/* Phone — Read-only */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1.5">
                  رقم الجوال
                </label>
                <div className="relative group">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={user.phone || "غير محدد"}
                    disabled
                    dir="ltr"
                    className="flex w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-400 text-left pl-10 cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              {/* Account Role — Read-only */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1.5">
                  نوع الحساب
                </label>
                <div className="relative group">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={
                      user.roles?.map(r => 
                        r.name === 'parent' ? 'ولي أمر' : 
                        r.name === 'teacher' ? 'معلم' : 
                        r.name === 'student' ? 'طالب' : r.name
                      ).join(' / ') || "عضو"
                    }
                    disabled
                    className="flex w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 py-2.5 text-sm font-bold text-indigo-600/70 text-left pl-10 cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              {/* Member ID — Read-only */}
              <div>
                <label className="block text-sm font-bold text-text-primary mb-1.5">
                  رقم العضوية (ID)
                </label>
                <div className="relative group">
                  <div className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={`TAJ-${user.id?.toString().padStart(6, '0')}`}
                    disabled
                    dir="ltr"
                    className="flex w-full rounded-xl border-2 border-transparent bg-gray-50 px-4 py-2.5 text-sm font-bold text-gray-500 text-left pl-10 cursor-not-allowed opacity-70"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-8 h-full flex flex-col">
            {/* ═══════════════════════════════════════════════
                Card 2 — تغيير كلمة المرور
            ═══════════════════════════════════════════════ */}
            <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-2 overflow-hidden shadow-sm flex-1">
              {/* Card Header */}
              <div className="flex items-center gap-3 px-10 pt-10 pb-4">
                <span className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <LockIcon className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  تغيير كلمة المرور
                </h2>
              </div>

              <div className="px-10 pb-10 pt-4 space-y-6">
                <Input
                  label="كلمة المرور الحالية"
                  type="password"
                  dir="ltr"
                  {...register("current_password")}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="bg-gray-50/50 rounded-xl border-gray-100"
                />

                <Input
                  label="كلمة المرور الجديدة"
                  type="password"
                  dir="ltr"
                  {...register("password", {
                    minLength: { value: 8, message: "يجب أن تكون كلمة المرور 8 أحرف على الأقل" }
                  })}
                  error={errors.password?.message}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="bg-gray-50/50 rounded-xl border-gray-100"
                />

                <Input
                  label="تأكيد كلمة المرور الجديدة"
                  type="password"
                  dir="ltr"
                  {...register("password_confirmation", {
                    validate: (value, formValues) =>
                      value === formValues.password || "كلمتا المرور غير متطابقتين"
                  })}
                  error={errors.password_confirmation?.message}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  className="bg-gray-50/50 rounded-xl border-gray-100"
                />
              </div>
            </Card>

            {/* ═══════════════════════════════════════════════
                Card 3 — Role-specific section (Student)
            ═══════════════════════════════════════════════ */}
            {isStudent && (
              <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-3 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-10 pt-10 pb-4">
                  <span className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    معلومات الطالب
                  </h2>
                </div>
                
                <div className="px-10 pb-10 pt-4 space-y-6">
                  <div className="space-y-4">
                    <Select 
                      label="المرحلة الدراسية الحالية *"
                      {...register("grade_level_id", { required: isStudent })}
                      error={errors.grade_level_id?.message}
                      className="bg-gray-50/50 rounded-xl"
                    >
                      <option value="" disabled>-- اختر مرحلتك الدراسية --</option>
                      {gradeLevels.map((grade: GradeLevel) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.name} (سعر الحصة: {grade.session_price} ريال)
                        </option>
                      ))}
                    </Select>
                    
                    <div className="mt-4 flex items-start gap-3 text-xs bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 text-indigo-700 font-bold leading-relaxed">
                      <Lightbulb className="w-5 h-5 shrink-0" />
                      <p>تغيير المرحلة الدراسية سيضمن لك الحصول على التسعيرة الموحدة لحصصك.</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            Save Button
        ═══════════════════════════════════════════════ */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 px-12 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] text-lg rounded-[1.5rem] shadow-md hover:shadow-lg transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <span>حفظ التعديلات</span>
                <Save className="w-5 h-5 mr-3" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </div>
  );
}
