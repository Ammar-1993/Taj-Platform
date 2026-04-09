"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import DecorativeBackground from "@/components/ui/DecorativeBackground";
import { showApiError } from "@/hooks/useApiError";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50">
      
      {/* 🟢 تم إصلاح الاستدعاء هنا بإزالة الخصائص غير المدعومة في واجهة المكون */}
      <DecorativeBackground />

      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        
        {/* الهيدر */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-block mb-4 text-6xl hover:scale-110 transition-transform duration-300 drop-shadow-xl"
          >
            👑
          </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            مرحباً بعودتك!
          </h2>
          <p className="mt-3 text-gray-500 font-medium">
            سجل دخولك لمتابعة رحلتك التعليمية في منصة تاج
          </p>
        </div>

        {/* صندوق تسجيل الدخول (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-white relative">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold animate-fade-in-up">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              
              {/* حقل البريد الإلكتروني */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-2xl outline-none transition-all duration-300 text-left font-medium placeholder:text-gray-400"
                    placeholder="name@taj.com"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div>
                <div className="flex items-center justify-between mb-2">
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-2xl outline-none transition-all duration-300 text-left tracking-widest font-medium placeholder:tracking-normal placeholder:text-gray-400"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* زر الإرسال */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-4 px-4 text-sm font-black rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:shadow-[0_10px_30px_rgba(99,102,241,0.3)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    تسجيل الدخول
                    <Lock className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* رابط إنشاء حساب جديد */}
        <div className="mt-8 text-center bg-white/40 backdrop-blur-sm py-4 rounded-2xl border border-white/50 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="font-black text-indigo-700 hover:text-indigo-900 transition-colors ml-1"
            >
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}