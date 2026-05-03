"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { authService, discoveryService, profileService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  User as UserIcon,
  Lock as LockIcon,
  Mail,
  Phone,
  BookOpen,
  Edit3,
  Users,
  Loader2,
  Save,
  GraduationCap,
  Lightbulb,
  Shield,
  Fingerprint,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Select } from "@/components/ui/Select";
import Link from "next/link";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      grade_level_id: user?.student_profile?.grade_level_id?.toString() || "",
    },
  });

  // Fetch grade levels for student role
  const { data: gradesData } = useQuery({
    queryKey: ['grade-levels'],
    queryFn: () => discoveryService.getGradeLevels(),
    enabled: !!user?.roles?.some(role => role.name === 'student'),
    staleTime: 5 * 60 * 1000,
  });

  const gradeLevels = gradesData?.data || [];

  const onSubmit = async (data: ProfileFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const updateData: Record<string, unknown> = {};

      if (data.name !== user?.name) {
        updateData.name = data.name;
      }

      if (data.password) {
        updateData.current_password = data.current_password;
        updateData.password = data.password;
        updateData.password_confirmation = data.password_confirmation;
      }

      const isStudent = user?.roles?.some(role => role.name === 'student');

      if (Object.keys(updateData).length > 0) {
        const response = await authService.updateUser(updateData);
        setUser(response.data);
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

      if (Object.keys(updateData).length > 0 || (isStudent && data.grade_level_id !== user?.student_profile?.grade_level_id?.toString())) {
        toast.success("تم تحديث البيانات بنجاح.");
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

  // Extract initials for the avatar
  const nameInitial = user.name ? user.name.charAt(0) : "؟";

  return (
    <div className="p-4 md:p-8">
      <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight" dir="rtl">
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
              {/* Avatar Row */}
              <div className="flex items-center gap-4 p-4 bg-indigo-50/30 rounded-3xl border border-indigo-100/20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0 select-none border-4 border-white">
                  {nameInitial}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    الصورة الرمزية
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    تُولد تلقائياً من الحرف الأول للاسم
                  </p>
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
                <p className="mt-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-left">
                  Verified Account
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
                      {gradeLevels.map((grade: any) => (
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
