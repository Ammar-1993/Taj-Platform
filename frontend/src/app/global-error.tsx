"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="ar" dir="rtl">
      <body style={{
        display: "flex", minHeight: "100vh", alignItems: "center",
        justifyContent: "center", background: "#fef2f2",
        fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "24px"
      }}>
        <div>
          <h2 style={{ color: "#991b1b", fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
            حدث خطأ حرج في التطبيق
          </h2>
          <p style={{ color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>
            تم إبلاغ فريق الدعم تلقائياً.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#dc2626", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 20px", cursor: "pointer",
              fontSize: "14px", fontWeight: "bold"
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
