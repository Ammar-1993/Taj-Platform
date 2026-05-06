import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { parentService, walletService, bookingService, notificationService } from "@/services/api";
import { User, Booking, AppNotification } from "@/types";

export const useDashboardData = (user: User | null, isParent: boolean, isTeacher: boolean) => {
  const queryClient = useQueryClient();
  const [pendingReview, setPendingReview] = useState<Booking | null>(null);
  const [dismissedReviewBookingIds, setDismissedReviewBookingIds] = useState<number[]>([]);
  const [bookingPage, setBookingPage] = useState(1);

  useEffect(() => {
    setBookingPage(1);
  }, [isParent, isTeacher, user?.id]);

  // Fetch parent data
  const [parentBookingPage, setParentBookingPage] = useState(1);

  useEffect(() => {
    if (isParent) {
      setParentBookingPage(1);
    }
  }, [isParent, user?.id]);

  const { data: parentData, isLoading: parentLoading } = useQuery({
    queryKey: ['parentDashboard', user?.id, parentBookingPage],
    queryFn: () => parentService.getDashboardData(parentBookingPage).then(res => res.data),
    enabled: !!user && isParent,
  });

  // Fetch generic dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, refetch: fetchDashboardData } = useQuery({
    queryKey: ['dashboard', user?.id, bookingPage],
    queryFn: async () => {
      // For parents, we mainly want the wallet/notifications from this generic call
      const [walletRes, bookingsRes, notifRes] = await Promise.all([
        walletService.getWallet(),
        !isParent ? bookingService.getAll({ page: bookingPage }) : Promise.resolve({ data: { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 } }),
        notificationService.getAll(),
      ]);
      return {
        wallet: walletRes.data,
        bookings: bookingsRes.data.data,
        bookingsMeta: {
          current_page: bookingsRes.data.current_page,
          last_page: bookingsRes.data.last_page,
          per_page: bookingsRes.data.per_page,
          total: bookingsRes.data.total,
        },
        notifications: notifRes.data || [],
      };
    },
    enabled: !!user,
  });

  // Handle pending review seeding
  useEffect(() => {
    if (dashboardData?.bookings && !isTeacher && !isParent) {
      const unreviewedBooking = dashboardData.bookings.find(
        (b) => b.status === "completed" && !b.review && !dismissedReviewBookingIds.includes(b.id),
      );
      if (unreviewedBooking && !pendingReview) {
        setPendingReview(unreviewedBooking);
      }
    }
  }, [dashboardData?.bookings, isTeacher, isParent, pendingReview, dismissedReviewBookingIds]);

  const dismissPendingReview = () => {
    if (pendingReview) {
      setDismissedReviewBookingIds((prev) => [...prev, pendingReview.id]);
    }
    setPendingReview(null);
  };

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
    bookingPage,
    setBookingPage,
    bookingLastPage: dashboardData?.bookingsMeta?.last_page || 1,
    parentData: parentData || null,
    parentBookingPage,
    setParentBookingPage,
    parentBookingLastPage: parentData?.bookings?.last_page || 1,
    notifications: dashboardData?.notifications || [],
    pendingReview,
    dataLoading: !!user && (parentLoading || dashboardLoading),
    fetchDashboardData,
    setPendingReview,
    dismissPendingReview,
    markNotificationAsRead: (id: string) => markNotificationAsReadMutation.mutate(id),
  };
};
