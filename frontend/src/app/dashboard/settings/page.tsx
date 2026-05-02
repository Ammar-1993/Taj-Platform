"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/api";
import toast from "react-hot-toast";
import { User, Lock, Mail, Phone, BookOpen, Edit3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Image from "next/image";

interface ProfileFormData {
  name: string;
  current_password: string;
  password: string;
  password_confirmation: string;
  bio: string;
}

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      bio: user?.teacher_profile?.bio || "",
    },
  });

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

      if (data.bio && user?.roles?.some(role => role.name === 'teacher')) {
        updateData.bio = data.bio;
      }

      if (Object.keys(updateData).length > 0) {
        const response = await authService.updateUser(updateData);
        setUser(response.data);
        toast.success("تم تحديث البيانات بنجاح.");
        reset({
          name: response.data.name,
          bio: response.data.teacher_profile?.bio || "",
        });
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

  const isTeacher = user?.roles?.some(role => role.name === 'teacher');
  const isStudent = user?.roles?.some(role => role.name === 'student');

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff&size=128&font-size=0.6`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">إعدادات الحساب</h1>
        <p className="text-gray-600 mt-2">إدارة معلومات حسابك الشخصية</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        {/* معلومات عامة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* الصورة الرمزية */}
            <div className="flex items-center gap-4">
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full border-2 border-gray-200"
              />
              <div>
                <p className="text-sm text-gray-500">الصورة الرمزية</p>
                <p className="text-xs text-gray-400">تُولد تلقائياً من الحرف الأول للاسم</p>
              </div>
            </div>

            {/* الاسم */}
            <Input
              label="الاسم الكامل"
              {...register("name", { required: "الاسم مطلوب" })}
              error={errors.name?.message}
              icon={<Edit3 className="w-4 h-4" />}
            />

            {/* البريد الإلكتروني */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">البريد الإلكتروني (غير قابل للتعديل)</p>
              </div>
            </div>

            {/* رقم الهاتف */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                <p className="text-xs text-gray-500">رقم الهاتف (غير قابل للتعديل)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تغيير كلمة المرور */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="كلمة المرور الحالية"
              type="password"
              dir="ltr"
              {...register("current_password")}
              placeholder="أدخل كلمة المرور الحالية"
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
            />
          </CardContent>
        </Card>

        {/* معلومات الدور */}
        {isTeacher && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                معلومات المعلم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                label="السيرة الذاتية"
                {...register("bio")}
                placeholder="اكتب سيرتك الذاتية..."
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {isStudent && user.student_profile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                معلومات الطالب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.student_profile.grade_level?.name || "غير محدد"}
                  </p>
                  <p className="text-xs text-gray-500">المرحلة الدراسية</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                لتغيير المرحلة الدراسية، اذهب إلى{" "}
                <a href="/dashboard/student-profile" className="text-blue-600 hover:underline">
                  ملف الطالب
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={isLoading}>
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
}
