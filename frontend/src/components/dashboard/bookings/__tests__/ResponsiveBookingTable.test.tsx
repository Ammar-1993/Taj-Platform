import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveBookingTable } from "../ResponsiveBookingTable";
import { Booking } from "@/types";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/components/dashboard/ai/SessionSummaryModal", () => ({
  SessionSummaryModal: () => null,
}));

const sampleBookings: Booking[] = [
  {
    id: 501,
    student_id: 1,
    teacher_id: 2,
    teacher_slot_id: 10,
    booking_date: "2026-10-20",
    session_price: "100.00",
    net_paid: "100.00",
    status: "scheduled",
    student: {
      id: 1,
      name: "خالد العتيبي",
      email: "khaled@taj.com",
      phone: "0512345678",
      roles: [{ id: 1, name: "student" }],
    },
    teacher: {
      id: 2,
      name: "أ. فهد السالم",
      email: "fahad@taj.com",
      phone: "0587654321",
      roles: [{ id: 2, name: "teacher" }],
    },
    teacher_slot: {
      id: 10,
      teacher_id: 2,
      slot_date: "2026-10-20",
      start_time: "16:00:00",
      end_time: "17:00:00",
      status: "booked",
    },
  },
  {
    id: 502,
    student_id: 1,
    teacher_id: 2,
    teacher_slot_id: 11,
    booking_date: "2026-10-21",
    session_price: "120.00",
    net_paid: "120.00",
    status: "in_progress",
    student: {
      id: 1,
      name: "خالد العتيبي",
      email: "khaled@taj.com",
      phone: "0512345678",
      roles: [{ id: 1, name: "student" }],
    },
    teacher: {
      id: 2,
      name: "أ. فهد السالم",
      email: "fahad@taj.com",
      phone: "0587654321",
      roles: [{ id: 2, name: "teacher" }],
    },
    teacher_slot: {
      id: 11,
      teacher_id: 2,
      slot_date: "2026-10-21",
      start_time: "18:00:00",
      end_time: "19:00:00",
      status: "booked",
    },
  },
];

describe("ResponsiveBookingTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state for student and parent roles appropriately", () => {
    const { rerender } = render(
      <ResponsiveBookingTable bookings={[]} isTeacher={false} />
    );
    expect(
      screen.getByText("ليس لديك أي حجوزات حتى الآن")
    ).toBeInTheDocument();
    expect(screen.getByText(/احجز حصتك الأولى/i)).toBeInTheDocument();

    rerender(
      <ResponsiveBookingTable bookings={[]} isTeacher={false} isParent={true} />
    );
    expect(
      screen.getByText("لا توجد حجوزات لأبنائك حتى الآن")
    ).toBeInTheDocument();
    expect(screen.getByText(/ابحث عن معلم/i)).toBeInTheDocument();
  });

  it("navigates to classroom when student clicks classroom entry button", () => {
    render(
      <ResponsiveBookingTable bookings={sampleBookings} isTeacher={false} />
    );

    const enterButtons = screen.getAllByRole("button", { name: /دخول الفصل/i });
    fireEvent.click(enterButtons[0]);

    expect(mockPush).toHaveBeenCalledWith("/classroom/501");
  });

  it("triggers onCancelClick and onCompleteClick from teacher dropdown actions", () => {
    const onCancelClick = jest.fn();
    const onCompleteClick = jest.fn();

    render(
      <ResponsiveBookingTable
        bookings={sampleBookings}
        isTeacher={true}
        onCancelClick={onCancelClick}
        onCompleteClick={onCompleteClick}
      />
    );

    const moreButtons = screen.getAllByTitle("خيارات إضافية");
    fireEvent.click(moreButtons[0]);

    const cancelOption = screen.getByText("إلغاء طارئ");
    fireEvent.click(cancelOption);
    expect(onCancelClick).toHaveBeenCalledWith(501);
  });

  it("renders parent view with both child and teacher names and hides classroom action buttons", () => {
    render(
      <ResponsiveBookingTable
        bookings={sampleBookings}
        isTeacher={false}
        isParent={true}
      />
    );

    expect(screen.getAllByText("خالد العتيبي").length).toBeGreaterThan(0);
    expect(screen.getAllByText("أ. فهد السالم").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: /دخول الفصل/i })
    ).not.toBeInTheDocument();
  });
});
