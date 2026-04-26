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
    icon: <Trash2 className="w-7 h-7 text-error-text" />,
    iconBg: "bg-error-bg",
    confirmBtn: "bg-gradient-to-l from-red-600 to-rose-600 hover:shadow-red-200",
  },
  warning: {
    icon: <AlertTriangle className="w-7 h-7 text-warning-text" />,
    iconBg: "bg-warning-bg",
    confirmBtn: "bg-gradient-to-l from-amber-600 to-yellow-600 hover:shadow-amber-200",
  },
  info: {
    icon: <Info className="w-7 h-7 text-brand-600" />,
    iconBg: "bg-brand-50",
    confirmBtn: "bg-brand-600 hover:bg-brand-700 hover:shadow-brand-200",
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
          className={`w-16 h-16 ${styles.iconBg} rounded-taj-lg flex items-center justify-center mx-auto`}
        >
          {styles.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 bg-surface-subtle hover:bg-surface-muted text-text-secondary rounded-taj-md font-bold transition-all duration-200 disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-3 text-white rounded-taj-md font-bold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 ${styles.confirmBtn}`}
        >
          {isLoading ? "جاري التنفيذ..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
