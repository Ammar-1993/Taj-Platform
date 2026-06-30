"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 rounded-2xl p-8 max-w-sm w-full shadow-lg border border-red-100">
        <h2 className="text-xl font-bold text-red-700 mb-2">حدث خطأ غير متوقع</h2>
        <p className="text-slate-500 text-sm mb-6">
          تم إبلاغ فريق الدعم تلقائياً. يمكنك المحاولة مجدداً.
        </p>
        <button
          onClick={() => reset()}
          className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl
                     font-bold hover:bg-red-700 transition-colors"
        >
          حاول مجدداً
        </button>
      </div>
    </div>
  );
}
