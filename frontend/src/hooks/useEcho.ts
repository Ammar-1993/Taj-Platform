"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { getEcho } from "@/lib/echo";

export interface BookingCreatedPayload {
  booking_id: number;
  student_name: string;
  message?: string;
}

export interface WalletUpdatedPayload {
  user_id: number;
  balance: number;
  transaction?: {
    id: number;
    amount: number;
    type: string;
    description: string;
    created_at?: string;
  } | null;
}

/**
 * Custom React hook that sets up real-time WebSocket event listeners via Laravel Reverb.
 * Automatically invalidates relevant React Query caches and displays localized toast notifications.
 */
export const useEcho = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const echo = getEcho();
    if (!echo) {
      return;
    }

    // 1. Subscribe to User Private Channel
    const userChannel = echo.private(`App.Models.User.${user.id}`);

    // Listen for Real-Time Wallet Balance Updates
    userChannel.listen(".WalletUpdated", (data: WalletUpdatedPayload) => {
      // Invalidate relevant caches to trigger immediate re-render
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["parent_dashboard"] });

      const amountText = data.transaction ? ` (${data.transaction.description})` : "";
      toast.success(`💳 تم تحديث رصيد المحفظة: ${data.balance.toFixed(2)} ر.س${amountText}`, {
        duration: 4000,
        position: "top-center",
      });
    });

    // Listen for Booking Confirmations (for Student / Parent)
    userChannel.listen(".BookingCreated", (data: BookingCreatedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      if (data.message) {
        toast.success(data.message, {
          duration: 4000,
          position: "top-center",
        });
      }
    });

    // 2. Subscribe to Teacher Private Channel (if role is teacher)
    let teacherChannel: ReturnType<typeof echo.private> | null = null;
    const isTeacher = user.roles?.some((r) => r.name === "teacher") || false;

    if (isTeacher) {
      teacherChannel = echo.private(`teacher.${user.id}`);
      teacherChannel.listen(".BookingCreated", (data: BookingCreatedPayload) => {
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });

        toast.success(`🎉 حجز جديد: قام الطالب ${data.student_name} بحجز حصة جديدة معك!`, {
          duration: 5000,
          position: "top-center",
        });
      });
    }

    return () => {
      try {
        echo.leave(`App.Models.User.${user.id}`);
        if (teacherChannel) {
          echo.leave(`teacher.${user.id}`);
        }
      } catch {
        // Ignored during cleanup
      }
    };
  }, [user?.id, user?.roles, queryClient]);
};
