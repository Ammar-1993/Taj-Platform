"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { showApiError } from "@/hooks/useApiError";
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Loader2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { authService } from "@/services/api";

export default function StudentRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form Data States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateName = () => {
    if (!name) setNameError("اسم الطالب مطلوب");
    else setNameError("");
  };

  const validateEmail = () => {
    if (!email) setEmailError("البريد الإلكتروني مطلوب");
    else if (!/^\S+@\S+\.\S+$/.test(email)) setEmailError("صيغة البريد الإلكتروني غير صحيحة");
    else setEmailError("");
  };

  const validatePhone = () => {
    if (!phone) setPhoneError("رقم الجوال مطلوب");
    else if (phone.length < 10) setPhoneError("رقم الجوال غير مكتمل");
    else setPhoneError("");
  };

  const validatePassword = () => {
    if (!password) setPasswordError("كلمة المرور مطلوبة");
    else if (password.length < 8) setPasswordError("يجب أن لا تقل عن 8 أحرف");
    else setPasswordError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    validateName();
    validateEmail();
    validatePhone();
    validatePassword();

    if (!name || !email || !phone || !password || nameError || emailError || phoneError || passwordError) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // إرسال الطلب للبوابة الموحدة مع تحديد دور "الطالب"
      const res = await authService.register({
        name,
        email,
        phone,
        password,
        role: "student",
      });

      setSuccessMsg("تم إنشاء حسابك بنجاح!");

      // تسجيل الدخول تلقائياً
      const { token, user } = res.data;
      login(token, user);

      // التوجيه الذكي لصفحة إعداد الملف لاختيار "المرحلة الدراسية"
      setTimeout(() => {
        router.push("/dashboard/settings");
      }, 2000);
    } catch (error: unknown) {
      showApiError(
        error,
        "تأكد من صحة البيانات. قد يكون الإيميل أو الجوال مسجلاً مسبقاً."
      );
      setError("تأكد من صحة البيانات أو أن الحساب غير مسجل مسبقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-center relative overflow-hidden bg-slate-50">
      <DecorativeBackground />

      <div className="w-full max-w-2xl animate-fade-in-up relative z-10">
        <Card variant="glass" className="overflow-hidden">
          <div className="bg-indigo-500/10 border-b border-indigo-500/10 p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Decorative blobs for header */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-white/50 mb-4 relative z-10">
              <span className="text-3xl">🎓</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 relative z-10">
              إنشاء حساب طالب
            </h2>
            <p className="text-gray-600 font-medium relative z-10 text-sm sm:text-base">
              انضم الآن وابدأ رحلة التفوق مع نخبة المعلمين في منصة تاج
            </p>
          </div>

          <CardContent className="p-6 sm:p-8">
            {successMsg ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center animate-fade-in-up shadow-sm">
                <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3 animate-subtle-pulse" />
                <h3 className="text-xl font-bold text-emerald-800 mb-2">
                  {successMsg}
                </h3>
                <p className="text-emerald-600 text-sm font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري توجيهك لإكمال بيانات حسابك...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && <ErrorBanner message={error} />}

            {/* استخدام Grid لوضع الحقول بجانب بعضها في الشاشات المتوسطة والكبيرة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* حقل الاسم (يأخذ العرض كاملاً) */}
              <div className="sm:col-span-2">
                <Input
                  label="اسم الطالب *"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  onBlur={validateName}
                  error={nameError}
                  placeholder="الاسم الثنائي أو الثلاثي"
                  icon={<UserIcon className="w-4 h-4" />}
                />
              </div>

              {/* حقل البريد الإلكتروني (يأخذ نصف العرض) */}
              <Input
                label="البريد الإلكتروني *"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onBlur={validateEmail}
                error={emailError}
                placeholder="student@taj.com"
                dir="ltr"
                icon={<Mail className="w-4 h-4" />}
              />

              {/* حقل رقم الجوال (يأخذ نصف العرض) */}
              <Input
                label="رقم الجوال *"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(val);
                  if (phoneError) setPhoneError("");
                }}
                onBlur={validatePhone}
                error={phoneError}
                placeholder="05XXXXXXXX"
                dir="ltr"
                icon={<Phone className="w-4 h-4" />}
              />

              {/* حقل كلمة المرور (يأخذ العرض كاملاً) */}
              <div className="sm:col-span-2">
                <Input
                  label="كلمة المرور *"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  onBlur={validatePassword}
                  error={passwordError}
                  placeholder="••••••••"
                  dir="ltr"
                  icon={<Lock className="w-4 h-4" />}
                />
                <PasswordStrength password={password} />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={loading}
                className="w-full group"
              >
                {!loading ? (
                  <span className="flex items-center gap-2">
                    إنشاء حساب طالب
                    <ArrowLeft className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                ) : (
                  <span>جاري إنشاء الحساب...</span>
                )}
              </Button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-700 font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                العودة لاختيار نوع الحساب
              </Link>
            </div>
          </form>
        )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}