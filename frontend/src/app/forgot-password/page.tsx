"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { Mail } from "lucide-react";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { authService } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setEmailError("البريد الإلكتروني مطلوب");
      return false;
    }

    const pattern = /^\S+@\S+\.\S+$/;
    if (!pattern.test(email)) {
      setEmailError("صيغة البريد الإلكتروني غير صحيحة");
      return false;
    }

    setEmailError("");
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تحقق من صندوق الرسائل الواردة.");
      toast.success("تم إرسال الرابط بنجاح.");
    } catch (error: unknown) {
      const responseError = error as { response?: { data?: { message?: unknown } } };
      const errorMessage =
        typeof responseError.response?.data?.message === "string"
          ? responseError.response.data.message
          : "حدث خطأ أثناء إرسال رابط إعادة التعيين. حاول مرة أخرى لاحقاً.";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
      <DecorativeBackground />

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-block mb-3 text-5xl hover:scale-110 transition-transform duration-300 drop-shadow-xl cursor-pointer"
            title="العودة للصفحة الرئيسية"
          >
            👑
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            استعادة كلمة المرور
          </h2>
          <p className="mt-1.5 text-gray-500 text-sm font-medium">
            أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة التعيين إلى صندوق الوارد.
          </p>
        </div>

        <Card variant="glass">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}
              {success && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm font-semibold animate-fade-in-up">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={validateEmail}
                  error={emailError}
                  placeholder="name@taj.com"
                  dir="ltr"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full group">
                  إرسال رمز إعادة التعيين
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center bg-white/40 backdrop-blur-sm py-3 rounded-xl border border-white/50 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">
            تذكرت كلمة المرور؟{" "}
            <Link
              href="/login"
              className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors ml-1"
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
