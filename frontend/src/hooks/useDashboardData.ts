import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { User, Wallet, Booking, AppNotification, ParentDashboardData } from "@/types";

export const useDashboardData = (user: User | null, isParent: boolean, isTeacher: boolean) => {
  const queryClient = useQueryClient();
  const [pendingReview, setPendingReview] = useState<Booking | null>(null);

  // Fetch parent data
  const { data: parentData, isLoading: parentLoading } = useQuery({
    queryKey: ['parentDashboard', user?.id],
    queryFn: async () => {
      const res = await api.get("/parent/dashboard");
      return res.data.data as ParentDashboardData;
    },
    enabled: !!user && isParent,
  });

  // Fetch generic dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: fetchDashboardData } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      const [walletRes, bookingsRes, notifRes] = await Promise.all([
        api.get("/wallet"),
        api.get("/bookings"),
        api.get("/notifications"),
      ]);
      return {
        wallet: walletRes.data.data as Wallet,
        bookings: bookingsRes.data.data.data as Booking[],
        notifications: (notifRes.data.data || []) as AppNotification[],
      };
    },
    enabled: !!user && !isParent,
  });

  // Handle pending review seeding
  useEffect(() => {
    if (dashboardData?.bookings && !isTeacher && !isParent) {
      const unreviewedBooking = dashboardData.bookings.find(
        (b) => b.status === "completed" && !b.review,
      );
      if (unreviewedBooking && !pendingReview) {
        setPendingReview(unreviewedBooking);
      }
    }
  }, [dashboardData?.bookings, isTeacher, isParent, pendingReview]);

  // Mutation for notifications
  const markNotificationAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`);
      return id;
    },
    onSuccess: (id) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['dashboard', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.filter((n: AppNotification) => n.id !== id),
        };
      });
    },
    onError: (error) => {
      console.error("خطأ في قراءة الإشعار", error);
    }
  });

  return {
    wallet: dashboardData?.wallet || null,
    bookings: dashboardData?.bookings || [],
    parentData: parentData || null,
    notifications: dashboardData?.notifications || [],
    pendingReview,
    dataLoading: !!user && (parentLoading || dashboardLoading),
    fetchDashboardData,
    setPendingReview,
    markNotificationAsRead: (id: string) => markNotificationAsReadMutation.mutate(id),
  };
};
