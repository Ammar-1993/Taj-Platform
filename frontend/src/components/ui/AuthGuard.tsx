"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard: يحمي أي مسار مُغلق (مثل /dashboard).
 * - إذا كان التحميل جاريًا، يعرض شاشة انتظار.
 * - إذا انتهى التحميل ولا يوجد مستخدم، يعيد التوجيه لصفحة تسجيل الدخول.
 * - إذا كان المستخدم مسجلاً، يعرض المحتوى بشكل طبيعي.
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-bold text-sm animate-pulse">
            جاري التحقق من الهوية...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // المستخدم غير مسجل — لا نعرض أي محتوى أثناء انتظار التوجيه
    return null;
  }

  return <>{children}</>;
}
