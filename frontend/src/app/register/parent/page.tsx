"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DecorativeBackground from "@/components/ui/DecorativeBackground";
import { showApiError } from "@/hooks/useApiError";

export default function ParentRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // إرسال الطلب للبوابة الموحدة مع تحديد دور "ولي أمر"
      const res = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
        role: "parent",
      });

      setSuccessMsg("تم إنشاء حسابك بنجاح! 🎉");

      // تسجيل الدخول التلقائي
      login(res.data.data.token, res.data.data.user);

      // 🟢 التعديل الاستراتيجي: التوجيه مباشرة إلى لوحة التحكم (Dashboard)
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: unknown) {
      showApiError(
        error,
        "تأكد من صحة البيانات. قد يكون الإيميل أو الجوال مسجلاً مسبقاً.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center relative overflow-hidden">
      <DecorativeBackground
        colorFrom="purple"
        colorTo="violet"
        opacity="opacity-20"
      />
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-sm p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100/80 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4 drop-shadow-lg">👨‍👩‍👦</div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            إنشاء حساب ولي أمر
          </h1>
          <p className="text-gray-500">
            أدِر حسابات أبنائك، تابع مستواهم، واحجز لهم أفضل المعلمين بحرية
            تامة.
          </p>
        </div>

        {successMsg ? (
          <div className="bg-purple-50 border-2 border-purple-500 p-6 rounded-2xl text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-purple-800 mb-2">
              {successMsg}
            </h3>
            <p className="text-purple-700">
              جاري توجيهك إلى لوحة التحكم الخاصة بك...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 font-bold p-4 rounded-xl border border-red-200 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                اسم ولي الأمر *
              </label>
              <div className="relative group">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  👤
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الثنائي أو الثلاثي"
                  className="w-full border-2 border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 bg-gray-50/80 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                البريد الإلكتروني *
              </label>
              <div className="relative group">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  📧
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@taj.com"
                  className="w-full border-2 border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 bg-gray-50/80 focus:bg-white"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                رقم الجوال *
              </label>
              <div className="relative group">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  📱
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full border-2 border-gray-200 rounded-xl py-3 pr-10 pl-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 bg-gray-50/80 focus:bg-white"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                كلمة المرور *
              </label>
              <div className="relative group">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-2 border-gray-200 rounded-xl py-3 pr-10 pl-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 bg-gray-50/80 focus:bg-white text-left font-bold tracking-widest"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                  title={showPassword ? "إخفاء" : "عرض"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-l from-purple-600 to-violet-600 text-white font-extrabold py-4 rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:-translate-y-0.5"
              >
                {loading ? "جاري إنشاء الحساب..." : "تأكيد التسجيل والدخول 🚀"}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/register"
                className="text-sm text-gray-500 hover:text-gray-900 font-medium"
              >
                ← العودة لاختيار نوع الحساب
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
