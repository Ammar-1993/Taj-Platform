import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** Primary heading */
  title: string;
  /** Optional descriptive sub-text */
  subtitle?: string;
  /** Optional call-to-action button or link */
  action?: EmptyStateAction;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * EmptyState
 * ──────────────────────────────────────────────────────────────
 * A unified empty-state component that replaces 8+ inline blocks
 * scattered across the dashboard.
 *
 * Usage (P2-08 — Sprint 3):
 *   <EmptyState
 *     icon={Inbox}
 *     title="لا توجد حجوزات"
 *     subtitle="ستظهر حجوزاتك هنا بمجرد إتمامها."
 *   />
 */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 ${className}`}
    >
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-5 border border-gray-100">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>

      <h4 className="text-base font-bold text-gray-700 mb-1">{title}</h4>

      {subtitle && (
        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs">
          {subtitle}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
