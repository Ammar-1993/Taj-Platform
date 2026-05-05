"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { authService } from "@/services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    if (!email) setEmailError("البريد الإلكتروني مطلوب");
    else if (!/^\S+@\S+\.\S+$/.test(email)) setEmailError("صيغة البريد الإلكتروني غير صحيحة");
    else setEmailError("");
  };

  const validatePassword = () => {
    if (!password) setPasswordError("كلمة المرور مطلوبة");
    else setPasswordError("");
  };

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    validateEmail();
    validatePassword();
    
    if (!email || !password || emailError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      const { token, user } = response.data;
      
      await login(token, user);
      router.push("/dashboard");
    } catch {
      // Single error channel: inline banner only — no toast duplicate
      setError("بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
      
      <DecorativeBackground />

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        
        {/* الهيدر */}
        <div className="text-center mb-6">
          {/* الشعار قابل للنقر ويوجه للصفحة الرئيسية */}
          <Link
            href="/"
            className="inline-block mb-3 text-5xl hover:scale-110 transition-transform duration-300 drop-shadow-xl cursor-pointer"
            title="العودة للصفحة الرئيسية"
          >
            👑
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            مرحباً بعودتك!
          </h2>
          <p className="mt-1.5 text-gray-500 text-sm font-medium">
            سجل دخولك لمتابعة رحلتك التعليمية في منصة تاج
          </p>
        </div>

        {/* صندوق تسجيل الدخول (Glassmorphism) */}
        <Card variant="glass">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            
            {error && <ErrorBanner message={error} />}

            <div className="space-y-4">
              
              {/* حقل البريد الإلكتروني */}
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

              {/* حقل كلمة المرور */}
              <Input
                label="كلمة المرور"
                labelAction={
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                }
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
            </div>

            {/* زر الإرسال */}
            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full group"
              >
                {!isLoading ? (
                  <span className="flex items-center gap-2">
                    تسجيل الدخول
                    <ArrowLeft className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                ) : (
                  <span>جاري الدخول...</span>
                )}
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>

        {/* رابط إنشاء حساب جديد */}
        <div className="mt-6 text-center bg-white/40 backdrop-blur-sm py-3 rounded-xl border border-white/50 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors ml-1"
            >
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}