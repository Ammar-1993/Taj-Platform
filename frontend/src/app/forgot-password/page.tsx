"use client";

import { useState } from "react";
import Link from "next/link";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { Mail, CheckCircle2 } from "lucide-react";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { authService } from "@/services/api";
import { getApiErrorMessage } from "@/hooks/useApiError";

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
      // Show success only inside the card — no redundant toast
      setSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تحقق من صندوق الرسائل الواردة.");
    } catch (err: unknown) {
      // getApiErrorMessage() automatically translates keys like "passwords.user"
      setError(
        getApiErrorMessage(err, "حدث خطأ أثناء إرسال رابط إعادة التعيين. حاول مرة أخرى لاحقاً.")
      );
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
            {/* Success state: replaces the form content entirely */}
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center animate-fade-in-up">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-bold text-emerald-800 text-base leading-snug">
                  {success}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  لم يصلك الرابط؟{" "}
                  <button
                    type="button"
                    onClick={() => setSuccess("")}
                    className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors"
                  >
                    أرسل مرة أخرى
                  </button>
                </p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                {error && <ErrorBanner message={error} onDismiss={() => setError("")} />}

                <div className="space-y-4">
                  <Input
                    label="البريد الإلكتروني"
                    type="email"
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
            )}
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
