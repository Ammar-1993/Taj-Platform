"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

interface RedirectCountdownProps {
  /** Target route to navigate to after the countdown */
  href: string;
  /** Countdown duration in seconds. Default: 4 */
  seconds?: number;
  /** Message shown above the countdown bar */
  message?: string;
  /** Label for the "go now" action */
  actionLabel?: string;
  /** Label for the cancel action */
  cancelLabel?: string;
  /** Called when the user cancels the redirect */
  onCancel?: () => void;
}

/**
 * RedirectCountdown
 * ─────────────────────────────────────────────────────────────
 * Displays an animated progress bar that counts down before
 * navigating to `href`. The user can:
 *   • Click "go now" to navigate immediately
 *   • Click "cancel" (× button) to abort the redirect entirely
 *
 * Usage (P1-08 — Sprint 2):
 *   Replace every `setTimeout(() => router.push('/dashboard'), 3000)`
 *   with a controlled, cancellable redirect.
 *
 * @example
 *   <RedirectCountdown
 *     href="/dashboard"
 *     message="تم الإرسال بنجاح!"
 *     seconds={4}
 *   />
 */
export default function RedirectCountdown({
  href,
  seconds = 4,
  message = "تم بنجاح! جاري التحويل...",
  actionLabel = "الذهاب الآن",
  cancelLabel = "إلغاء التحويل",
  onCancel,
}: RedirectCountdownProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);
  const [cancelled, setCancelled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const navigate = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push(href);
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCancelled(true);
    onCancel?.();
  };

  useEffect(() => {
    if (cancelled) return;

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          router.push(href);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [href, router, cancelled]);

  if (cancelled) return null;

  // Progress 0→100 as remaining decreases seconds→0
  const progress = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3 animate-fade-in-up">
      {/* Message + cancel button */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-indigo-700 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 shrink-0" />
          {message}
        </p>
        <button
          type="button"
          onClick={cancel}
          title={cancelLabel}
          className="text-indigo-400 hover:text-indigo-700 transition-colors rounded-full p-1 hover:bg-indigo-100"
          aria-label={cancelLabel}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated progress bar */}
      <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Countdown + go-now link */}
      <div className="flex items-center justify-between text-xs text-indigo-500 font-bold">
        <span>{remaining} ثانية...</span>
        <button
          type="button"
          onClick={navigate}
          className="underline underline-offset-2 hover:text-indigo-700 transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
