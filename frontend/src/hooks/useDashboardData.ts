import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { User, Wallet, Booking, AppNotification, ParentDashboardData } from "@/types";

export const useDashboardData = (user: User | null, isParent: boolean, isTeacher: boolean) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [parentData, setParentData] = useState<ParentDashboardData | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pendingReview, setPendingReview] = useState<Booking | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      if (isParent) {
        const res = await api.get("/parent/dashboard");
        setParentData(res.data.data);
      } else {
        const [walletRes, bookingsRes, notifRes] = await Promise.all([
          api.get("/wallet"),
          api.get("/bookings"),
          api.get("/notifications"),
        ]);
        
        setWallet(walletRes.data.data);
        const fetchedBookings: Booking[] = bookingsRes.data.data.data;
        setBookings(fetchedBookings);
        setNotifications(notifRes.data.data || []);

        if (!isTeacher && !isParent) {
          const unreviewedBooking = fetchedBookings.find(
            (b) => b.status === "completed" && !b.review,
          );
          if (unreviewedBooking) {
            setPendingReview(unreviewedBooking);
          }
        }
      }
    } catch (error) {
      console.error("خطأ في جلب بيانات اللوحة", error);
    } finally {
      setDataLoading(false);
    }
  }, [user, isParent, isTeacher]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("خطأ في قراءة الإشعار", error);
    }
  };

  return {
    wallet,
    bookings,
    parentData,
    notifications,
    pendingReview,
    dataLoading,
    fetchDashboardData,
    setPendingReview,
    markNotificationAsRead,
  };
};
