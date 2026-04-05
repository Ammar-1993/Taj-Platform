import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardHeader } from "../DashboardHeader";
import { User } from "@/types";

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

const mockUser: User = {
  id: 1,
  name: "Test User",
  email: "test@taj.com",
  roles: [{ id: 1, name: "student" }],
  wallet: {
    id: 1,
    user_id: 1,
    balance: "100.00",
  },
};

const mockLogout = jest.fn();

describe("DashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders welcome message for student", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={false}
        isParent={false}
        logout={mockLogout}
      />,
    );

    expect(screen.getByText("مرحباً، Test User")).toBeInTheDocument();
    expect(
      screen.getByText("بوابة الطالب لإدارة الحجوزات والمحفظة"),
    ).toBeInTheDocument();
  });

  it("renders welcome message for teacher", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={true}
        isParent={false}
        logout={mockLogout}
      />,
    );

    expect(
      screen.getByText("بوابة المعلم لإدارة الحصص والأرباح"),
    ).toBeInTheDocument();
  });

  it("renders welcome message for parent", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={false}
        isParent={true}
        logout={mockLogout}
      />,
    );

    expect(
      screen.getByText("لوحة المراقبة الشاملة لحجوزات ونفقات الأبناء"),
    ).toBeInTheDocument();
  });

  it("shows teacher-specific links when user is teacher", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={true}
        isParent={false}
        logout={mockLogout}
      />,
    );

    expect(screen.getByText("إكمال الملف الشخصي ✏️")).toBeInTheDocument();
  });

  it("shows parent-specific links when user is parent", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={false}
        isParent={true}
        logout={mockLogout}
      />,
    );

    expect(screen.getByText("إدارة الأبناء 👨‍👩‍👧‍👦")).toBeInTheDocument();
  });

  it("calls logout function when logout button is clicked", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={false}
        isParent={false}
        logout={mockLogout}
      />,
    );

    const logoutButton = screen.getByText("تسجيل الخروج");
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders support link for all user types", () => {
    render(
      <DashboardHeader
        user={mockUser}
        isTeacher={false}
        isParent={false}
        logout={mockLogout}
      />,
    );

    expect(screen.getByText("الدعم الفني 🛟")).toBeInTheDocument();
  });
});
