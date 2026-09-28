"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import BrandEmblem from "@/components/ui/BrandEmblem";
import { Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
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
      setError("بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50/80">
      
      {/* خلفية جمالية محيطية وشبكة نقطية */}
      <DecorativeBackground />

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        
        {/* الترويسة والشعار الملكي */}
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandEmblem size="lg" className="mb-4" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50/90 text-indigo-700 border border-indigo-100 shadow-sm mb-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>بوابة الدخول الموحدة</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            مرحباً بعودتك!
          </h1>
          <p className="mt-1.5 text-slate-500 text-sm font-medium">
            سجل دخولك لمتابعة رحلتك التعليمية في منصة تاج
          </p>
        </div>

        {/* بطاقة تسجيل الدخول الفاخرة (Glassmorphism Card) */}
        <Card variant="glass" className="border border-white/80 shadow-2xl shadow-indigo-500/10 rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/85 ring-1 ring-slate-900/5">
          {/* خط التدرج الملكي في أعلى البطاقة */}
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600" />
          
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

              {/* زر تسجيل الدخول الملكي */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-base font-bold shadow-indigo-500/25 hover:shadow-indigo-500/40 rounded-2xl group"
                >
                  {!isLoading ? (
                    <span className="flex items-center gap-2">
                      تسجيل الدخول
                      <ArrowLeft className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:-translate-x-1 transition-transform" />
                    </span>
                  ) : (
                    <span>جاري تسجيل الدخول...</span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* كبسولة رابط إنشاء حساب جديد */}
        <div className="mt-6 text-center bg-white/75 backdrop-blur-md py-3.5 px-6 rounded-2xl border border-white/80 shadow-sm transition-all hover:bg-white/90">
          <p className="text-slate-600 text-sm font-medium">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline-offset-4 hover:underline mr-1"
            >
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>

        {/* شارة الأمان وتشفير البيانات */}
        <div className="mt-8 flex flex-col items-center gap-2 text-center select-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-slate-200/70 shadow-sm text-xs font-semibold text-slate-500 backdrop-blur-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال مشفر وآمن بتشفير 256-bit SSL</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} منصة تاج التعليمية
          </p>
        </div>
        
      </div>
    </div>
  );
}