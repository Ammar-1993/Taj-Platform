import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parentService, walletService, bookingService, notificationService } from "@/services/api";
import { User, Booking, AppNotification } from "@/types";

export const useDashboardData = (user: User | null, isParent: boolean, isTeacher: boolean) => {
  const queryClient = useQueryClient();
  const [pendingReview, setPendingReview] = useState<Booking | null>(null);

  // Fetch parent data
  const { data: parentData, isLoading: parentLoading } = useQuery({
    queryKey: ['parentDashboard', user?.id],
    queryFn: () => parentService.getDashboardData().then(res => res.data),
    enabled: !!user && isParent,
  });

  // Fetch generic dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: fetchDashboardData } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: async () => {
      const [walletRes, bookingsRes, notifRes] = await Promise.all([
        walletService.getWallet(),
        bookingService.getAll(),
        notificationService.getAll(),
      ]);
      return {
        wallet: walletRes.data,
        bookings: bookingsRes.data.data, // Since getAll returns ApiResponse<{ data: Booking[] }>
        notifications: notifRes.data || [],
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
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: (res, id) => {
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
