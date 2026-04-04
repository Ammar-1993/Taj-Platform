"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          direction: "rtl",
          fontFamily: "Tajawal, sans-serif",
          fontWeight: "700",
          borderRadius: "16px",
          padding: "14px 20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        },
        success: {
          style: {
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #a7f3d0",
          },
          iconTheme: { primary: "#10b981", secondary: "#ecfdf5" },
        },
        error: {
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
          },
          iconTheme: { primary: "#ef4444", secondary: "#fef2f2" },
        },
      }}
    />
  );
}
