"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import { AlertTriangle, Info, Trash2 } from "lucide-react";

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
    icon: <Trash2 className="w-7 h-7 text-red-600" />,
    iconBg: "bg-red-100",
    confirmBtn: "bg-gradient-to-l from-red-600 to-rose-600 hover:shadow-red-200",
  },
  warning: {
    icon: <AlertTriangle className="w-7 h-7 text-amber-600" />,
    iconBg: "bg-amber-100",
    confirmBtn: "bg-gradient-to-l from-amber-600 to-yellow-600 hover:shadow-amber-200",
  },
  info: {
    icon: <Info className="w-7 h-7 text-indigo-600" />,
    iconBg: "bg-indigo-100",
    confirmBtn: "bg-gradient-to-l from-indigo-600 to-purple-600 hover:shadow-indigo-200",
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
  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm" hideCloseButton>
      <div className="text-center space-y-4">
        <div
          className={`w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center mx-auto`}
        >
          {styles.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
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
          className={`flex-1 py-3 text-white rounded-xl font-bold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 ${styles.confirmBtn}`}
        >
          {isLoading ? "جاري التنفيذ..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
