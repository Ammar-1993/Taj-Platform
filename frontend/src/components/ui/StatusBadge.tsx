import React from "react";
import { Check, CheckCircle2 } from "lucide-react";

// ======================================================
// جميع حالات النظام موحدة في مكان واحد
// ======================================================

interface BadgeConfig {
  label: string;
  bg: string;
  text: string;
  dot: string;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const statusMap: Record<string, BadgeConfig> = {
  // حالات الحجوزات (Bookings)
  scheduled: {
    label: "مجدول",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "جارية الآن",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    pulse: true,
  },
  completed: {
    label: "مكتمل",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: <Check className="w-3 h-3" />,
  },
  cancelled: {
    label: "ملغي",
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  refunded: {
    label: "مسترجع",
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },

  // حالات طلبات السحب (Payouts)
  pending: {
    label: "قيد المراجعة",
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    dot: "bg-yellow-500",
    pulse: true,
  },
  approved: {
    label: "معتمد",
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  transferred: {
    label: "تم التحويل 🏦",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  rejected: {
    label: "مرفوض ❌",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
  },

  // حالات التذاكر (Support Tickets)
  open: {
    label: "مفتوحة ⏳",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
  },
  // in_progress already defined above (shared between bookings & tickets)
  resolved: {
    label: "تم الحل",
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
    icon: <Check className="w-3 h-3" />,
  },
  closed: {
    label: "مغلقة",
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
    icon: <Check className="w-3 h-3" />,
  },
};

interface StatusBadgeProps {
  status: string;
  /** Override the label if you need a different text for the same status key */
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusMap[status];

  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-bold bg-gray-100 text-gray-700">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
        {label || status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-bold ${config.bg} ${config.text} ${config.pulse ? "animate-subtle-pulse" : ""}`}
    >
      {config.icon ? (
        config.icon
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      )}
      {label || config.label}
    </span>
  );
}
