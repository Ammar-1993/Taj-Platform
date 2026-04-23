import React from "react";
import { AppNotification } from "@/types";
import { Bell, Check } from "lucide-react";

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
  if (!isTeacher || notifications.length === 0) return null;

  return (
    <div className="bg-gradient-to-l from-amber-50 to-yellow-50 border border-amber-200/60 p-5 rounded-2xl mb-6">
      <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
        <span className="w-7 h-7 bg-amber-200 rounded-lg flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-700" />
        </span>
        إشعارات جديدة ({notifications.length})
      </h3>
      <div className="space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-white/90 p-3 rounded-xl shadow-sm border border-amber-100 flex justify-between items-center hover:shadow-md transition-all duration-200"
          >
            <p className="text-sm text-gray-800 font-bold">
              {notif.data.message} -{" "}
              <span className="text-indigo-600">
                {notif.data.booking_date} الساعة {notif.data.time}
              </span>
            </p>
            <button
              onClick={() => markNotificationAsRead(notif.id)}
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
