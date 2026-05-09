import React, { useState } from "react";
import { AppNotification } from "@/types";
import { Bell, Check } from "lucide-react";

// Robust formatting utility for notification timestamps
const getNotificationTimestamp = (notif: AppNotification): string => {
  try {
    // 1. Try to format booking specific date/time if it's a booking notification
    if (notif.data?.booking_date && notif.data?.time && typeof notif.data.time === 'string') {
      const bDate = new Date(notif.data.booking_date);
      const parts = notif.data.time.split(':');
      
      if (parts.length >= 2) {
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        
        if (!isNaN(bDate.getTime()) && !isNaN(h) && !isNaN(m)) {
          const dateStr = bDate.toLocaleDateString('ar-SA-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
          const tDate = new Date();
          tDate.setHours(h, m, 0, 0);
          const timeStr = tDate.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
          return `- ${dateStr} الساعة ${timeStr}`;
        }
      }
    }

    // 2. Fallback to the notification's created_at timestamp
    if (notif.created_at) {
      const cDate = new Date(notif.created_at);
      if (!isNaN(cDate.getTime())) {
        const timeStr = cDate.toLocaleTimeString('ar-SA-u-nu-latn', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `- الساعة ${timeStr}`;
      }
    }
  } catch (error) {
    console.error("Notification time formatting error:", error);
  }

  // 3. Safe fallback if date is strictly invalid, null, or undefined
  return ""; // Hide entirely instead of showing 'Invalid Date'
};

interface TeacherNotificationsProps {
  isTeacher: boolean;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
}

export const TeacherNotifications: React.FC<TeacherNotificationsProps> = ({
  isTeacher,
  notifications,
  markNotificationAsRead,
}) => {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  if (!isTeacher || notifications.length === 0) return null;

  const visibleNotifications = notifications.filter(n => !hiddenIds.has(n.id));

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="bg-gradient-to-l from-amber-50 to-yellow-50 border border-amber-200/60 p-5 rounded-2xl mb-6">
      <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
        <span className="w-7 h-7 bg-amber-200 rounded-lg flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-700" />
        </span>
        إشعارات جديدة ({visibleNotifications.length})
      </h3>
      <div className="space-y-2">
        {visibleNotifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-white/90 p-3 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center hover:shadow-md transition-all duration-200"
          >
            <p className="text-sm text-gray-800 font-bold">
              {notif.data.message} <span className="text-indigo-600">
                {getNotificationTimestamp(notif)}
              </span>
            </p>
            <button
              onClick={() => {
                setHiddenIds(prev => new Set(prev).add(notif.id));
                markNotificationAsRead(notif.id);
              }}
              className="text-xs bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-amber-700 flex items-center gap-1 transition-all duration-200 font-bold"
            >
              تحديد كمقروء <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
