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
    <div className="mt-6 bg-brand-50/50 border border-brand-100 rounded-taj-lg p-5 space-y-4 animate-fade-up shadow-sm">
      {/* Message + cancel button */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-brand-700 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 shrink-0" />
          {message}
        </p>
        <button
          type="button"
          onClick={cancel}
          title={cancelLabel}
          className="text-brand-400 hover:text-brand-700 transition-colors rounded-full p-1.5 hover:bg-brand-100"
          aria-label={cancelLabel}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated progress bar */}
      <div className="h-2 w-full bg-brand-100/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(var(--color-brand-600),0.3)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Countdown + go-now link */}
      <div className="flex items-center justify-between text-[10px] text-brand-500 font-bold">
        <span>{remaining} ثانية متبقية...</span>
        <button
          type="button"
          onClick={navigate}
          className="underline underline-offset-4 hover:text-brand-700 transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
