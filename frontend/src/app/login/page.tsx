"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import DecorativeBackground from "@/components/ui/DecorativeBackground";
import { showApiError } from "@/hooks/useApiError";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data.data;
      
      await login(token, user);
      router.push("/dashboard");
    } catch (error: unknown) {
      showApiError(error, "حدث خطأ غير متوقع أثناء تسجيل الدخول.");
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
        <Card className="bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border-white relative">
          <CardContent className="p-6 sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
            
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-bold animate-fade-in-up">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              
              {/* حقل البريد الإلكتروني */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@taj.com"
                  dir="ltr"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-gray-700">
                    كلمة المرور
                  </label>
                  <Link
                    href="#"
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl outline-none transition-all duration-300 text-left tracking-widest font-medium placeholder:tracking-normal placeholder:text-gray-400 text-sm"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                    title={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* زر الإرسال */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    تسجيل الدخول
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                  </span>
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