/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

export const useDashboardData = (user: any, isParent: boolean, isTeacher: boolean) => {
  const [wallet, setWallet] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [parentData, setParentData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingReview, setPendingReview] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

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
        const fetchedBookings = bookingsRes.data.data.data;
        setBookings(fetchedBookings);
        setNotifications(notifRes.data.data || []);

        if (!isTeacher && !isParent) {
          const unreviewedBooking = fetchedBookings.find(
            (b: any) => b.status === "completed" && !b.review,
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
