"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { Lock, Mail } from "lucide-react";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { authService } from "@/services/api";
import { getApiErrorMessage } from "@/hooks/useApiError";

interface ResetPasswordPageProps {
  searchParams: {
    token?: string;
    email?: string;
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [email, setEmail] = useState(searchParams.email || "");
  const [token, setToken] = useState(searchParams.token || "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEmail(searchParams.email || "");
    setToken(searchParams.token || "");
  }, [searchParams.email, searchParams.token]);

  const validatePassword = () => {
    if (!password) {
      setPasswordError("كلمة المرور مطلوبة");
      return false;
    }

    if (password.length < 8) {
      setPasswordError("يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const validateConfirmation = () => {
    if (!passwordConfirmation) {
      setConfirmationError("يرجى تأكيد كلمة المرور");
      return false;
    }

    if (password !== passwordConfirmation) {
      setConfirmationError("كلمتا المرور غير متطابقتين");
      return false;
    }

    setConfirmationError("");
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !token) {
      setError("رابط إعادة التعيين غير صالح. يرجى المحاولة من جديد.");
      return;
    }

    const isPasswordValid = validatePassword();
    const isConfirmationValid = validateConfirmation();

    if (!isPasswordValid || !isConfirmationValid) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      // Inline card message is sufficient — no toast duplicate
      setSuccess("تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err: unknown) {
      // getApiErrorMessage() translates "passwords.token" → Arabic automatically
      setError(
        getApiErrorMessage(err, "حدث خطأ أثناء إعادة تعيين كلمة المرور. تأكد من صحة البيانات وحاول لاحقاً.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
        <DecorativeBackground />

        <div className="w-full max-w-md animate-fade-in-up relative z-10">
          <Card variant="glass">
            <CardContent className="p-6 sm:p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">رابط غير صالح</h2>
              <p className="text-gray-500 text-sm mb-6">
                لم يتم العثور على الرمز أو البريد الإلكتروني اللازم لإعادة التعيين. يرجى طلب رابط جديد.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/forgot-password">
                  <Button className="w-full">طلب رابط جديد</Button>
                </Link>
                <Link href="/login" className="text-indigo-700 hover:text-indigo-900 font-bold">
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            إعادة تعيين كلمة المرور
          </h2>
          <p className="mt-1.5 text-gray-500 text-sm font-medium">
            أدخل كلمة مرور جديدة لتفعيل حسابك مرة أخرى.
          </p>
        </div>

        <Card variant="glass">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@taj.com"
                  dir="ltr"
                  icon={<Mail className="w-4 h-4" />}
                  disabled
                />
                <Input
                  label="كلمة المرور الجديدة"
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
                <Input
                  label="تأكيد كلمة المرور"
                  type="password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => {
                    setPasswordConfirmation(e.target.value);
                    if (confirmationError) setConfirmationError("");
                  }}
                  onBlur={validateConfirmation}
                  error={confirmationError}
                  placeholder="••••••••"
                  dir="ltr"
                  icon={<Lock className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full group">
                  إعادة تعيين كلمة المرور
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center bg-white/40 backdrop-blur-sm py-3 rounded-xl border border-white/50 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">
            تذكرت كلمة المرور؟{" "}
            <Link href="/login" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors ml-1">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
