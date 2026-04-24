"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  /** The error message to display */
  message: string;
  /** Optional dismiss callback — shows an × button when provided */
  onDismiss?: () => void;
}

/**
 * ErrorBanner
 * ──────────────────────────────────────────────────────────────
 * A unified inline error banner that replaces the repeated
 * `bg-red-50 border border-red-100 text-red-600` pattern found
 * in 4 registration and login pages.
 *
 * Usage (P2-09 — Sprint 3):
 *   {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
 */
export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 p-3.5 rounded-xl text-sm font-bold animate-fade-in-up"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
      <span className="flex-1 leading-snug">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="إغلاق رسالة الخطأ"
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
