import React from "react";

export const getStatusBadge = (status: string) => {
  const base = "inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full font-bold";
  
  switch (status) {
    case "scheduled":
      return (
        <span className={`${base} bg-blue-100 text-blue-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          مجدول
        </span>
      );
    case "in_progress":
      return (
        <span className={`${base} bg-amber-100 text-amber-700 animate-pulse`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          جارية الآن
        </span>
      );
    case "completed":
      return (
        <span className={`${base} bg-emerald-100 text-emerald-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          مكتمل
        </span>
      );
    case "cancelled":
      return (
        <span className={`${base} bg-red-100 text-red-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          ملغي
        </span>
      );
    case "refunded":
      return (
        <span className={`${base} bg-purple-100 text-purple-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          مسترجع
        </span>
      );
    default:
      return (
        <span className={`${base} bg-gray-100 text-gray-700`}>
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
          {status}
        </span>
      );
  }
};
