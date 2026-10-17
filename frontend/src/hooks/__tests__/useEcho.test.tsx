import React from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEcho, WalletUpdatedPayload, BookingCreatedPayload } from "../useEcho";
import { useAuth } from "@/context/AuthContext";
import { getEcho } from "@/lib/echo";
import { queryKeys } from "@/lib/queryKeys";
import toast from "react-hot-toast";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/lib/echo", () => ({
  getEcho: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("useEcho", () => {
  let queryClient: QueryClient;
  let listeners: Record<string, Record<string, (data: unknown) => void>>;
  let mockStopListening: jest.Mock;
  let mockLeave: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.spyOn(queryClient, "invalidateQueries");

    listeners = {};
    mockStopListening = jest.fn();
    mockLeave = jest.fn();

    (getEcho as jest.Mock).mockReturnValue({
      private: jest.fn((channelName: string) => {
        listeners[channelName] = listeners[channelName] || {};
        return {
          listen: jest.fn((event: string, cb: (data: unknown) => void) => {
            listeners[channelName][event] = cb;
          }),
          stopListening: mockStopListening,
        };
      }),
      leave: mockLeave,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("invalidates wallet, dashboard, and parentDashboard caches on .WalletUpdated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 15, roles: [{ id: 1, name: "parent" }] },
    });

    renderHook(() => useEcho(), { wrapper });

    const payload: WalletUpdatedPayload = {
      user_id: 15,
      balance: 250.5,
      transaction: {
        id: 1,
        amount: 100,
        type: "deposit",
        description: "شحن رصيد",
      },
    };

    act(() => {
      listeners["App.Models.User.15"][".WalletUpdated"](payload);
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.wallet.all,
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.all,
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.parentDashboard.all,
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("subscribes to teacher channel for teacher users and cleans up listeners on unmount", () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 9, roles: [{ id: 2, name: "teacher" }] },
    });

    const { unmount } = renderHook(() => useEcho(), { wrapper });

    const bookingPayload: BookingCreatedPayload = {
      booking_id: 77,
      student_name: "أحمد",
    };

    act(() => {
      listeners["teacher.9"][".BookingCreated"](bookingPayload);
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.bookings.all,
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.dashboard.all,
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.teacherSlots.all,
    });

    unmount();

    expect(mockStopListening).toHaveBeenCalledWith(".WalletUpdated");
    expect(mockStopListening).toHaveBeenCalledWith(".BookingCreated");
    expect(mockLeave).toHaveBeenCalledWith("App.Models.User.9");
    expect(mockLeave).toHaveBeenCalledWith("teacher.9");
  });
});
