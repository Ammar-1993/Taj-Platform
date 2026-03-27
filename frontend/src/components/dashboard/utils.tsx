import React from "react";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
      return <span className="px-2 py-1 text-xs rounded-md bg-blue-100 text-blue-800 font-bold">مجدول</span>;
    case "in_progress":
      return <span className="px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 font-bold animate-pulse">جارية الآن 🔴</span>;
    case "completed":
      return <span className="px-2 py-1 text-xs rounded-md bg-green-100 text-green-800 font-bold">مكتمل</span>;
    case "cancelled":
      return <span className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-800 font-bold">ملغي</span>;
    case "refunded":
      return <span className="px-2 py-1 text-xs rounded-md bg-purple-100 text-purple-800 font-bold">مسترجع</span>;
    default:
      return <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-800 font-bold">{status}</span>;
  }
};
