"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import DecorativeBackground from "@/components/ui/DecorativeBackground";
import { showApiError } from "@/hooks/useApiError";
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function StudentRegisterPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form Data States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // إرسال الطلب للبوابة الموحدة مع تحديد دور "الطالب"
      const res = await api.post("/auth/register", {
        name,
        email,
        phone,
        password,
        role: "student",
      });

      setSuccessMsg("تم إنشاء حسابك بنجاح!");

      // تسجيل الدخول تلقائياً
      login(res.data.data.token, res.data.data.user);

      // التوجيه الذكي لصفحة إعداد الملف لاختيار "المرحلة الدراسية"
      setTimeout(() => {
        router.push("/dashboard/student-profile");
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
      
      {/* خلفية تجميلية - تم إصلاح الاستدعاء */}
      <DecorativeBackground />

      <Card className="max-w-xl w-full bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border-white relative z-10 animate-fade-in-up">
        <CardContent className="p-6 sm:p-8">
        <div className="text-center mb-6">
          {/* الشعار قابل للنقر ويوجه لتسجيل الدخول */}
          <Link
            href="/login"
            className="inline-block text-5xl mb-3 hover:scale-110 transition-transform duration-300 drop-shadow-xl cursor-pointer"
            title="الذهاب لصفحة تسجيل الدخول"
          >
            🎓
          </Link>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1.5">
            إنشاء حساب طالب
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            انضم الآن وابدأ رحلة التفوق مع نخبة المعلمين في منصة تاج.
          </p>
        </div>

        {successMsg ? (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] text-center animate-fade-in-up shadow-sm">
            <CheckCircle className="w-14 h-14 text-indigo-500 mx-auto mb-3 animate-subtle-pulse" />
            <h3 className="text-xl font-black text-indigo-800 mb-2">
              {successMsg}
            </h3>
            <p className="text-indigo-600 text-sm font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري توجيهك لاختيار مرحلتك الدراسية...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-bold animate-fade-in-up">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* استخدام Grid لوضع الحقول بجانب بعضها في الشاشات المتوسطة والكبيرة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* حقل الاسم (يأخذ العرض كاملاً) */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  اسم الطالب *
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الثنائي أو الثلاثي"
                  icon={<UserIcon className="w-4 h-4" />}
                />
              </div>

              {/* حقل البريد الإلكتروني (يأخذ نصف العرض) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  البريد الإلكتروني *
                </label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@taj.com"
                  dir="ltr"
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              {/* حقل رقم الجوال (يأخذ نصف العرض) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  رقم الجوال *
                </label>
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  icon={<Phone className="w-4 h-4" />}
                />
              </div>

              {/* حقل كلمة المرور (يأخذ العرض كاملاً) */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  كلمة المرور *
                </label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl outline-none transition-all duration-300 text-left tracking-widest font-medium placeholder:tracking-normal placeholder:text-gray-400 text-sm"
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

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري إنشاء الحساب...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    يلا نبدأ
                    <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                  </span>
                )}
              </Button>
            </div>

            <div className="text-center mt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-700 font-bold transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                العودة لاختيار نوع الحساب
              </Link>
            </div>
          </form>
        )}
        </CardContent>
      </Card>
    </div>
  );
}