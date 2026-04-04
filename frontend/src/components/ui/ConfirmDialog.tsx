"use client";

import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: {
    icon: "🔴",
    confirmBtn:
      "bg-gradient-to-l from-red-600 to-rose-600 hover:shadow-red-200",
  },
  warning: {
    icon: "⚠️",
    confirmBtn:
      "bg-gradient-to-l from-amber-600 to-yellow-600 hover:shadow-amber-200",
  },
  info: {
    icon: "ℹ️",
    confirmBtn:
      "bg-gradient-to-l from-indigo-600 to-purple-600 hover:shadow-indigo-200",
  },
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "warning",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-in-up border border-gray-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            {styles.icon}
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all duration-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 text-white rounded-xl font-extrabold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {isLoading ? "جاري التنفيذ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
