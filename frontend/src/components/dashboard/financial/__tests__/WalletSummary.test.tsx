import { render, screen } from "@testing-library/react";
import { WalletSummary } from "../WalletSummary";
import { useUserRole } from "@/hooks";

// Mock the hook
jest.mock("@/hooks", () => ({
  useUserRole: jest.fn(),
}));

describe("WalletSummary Component", () => {
  it("renders balance correctly", () => {
    (useUserRole as jest.Mock).mockReturnValue({ isTeacher: true });
    render(<WalletSummary balance="150.50" />);
    
    // Check if balance is displayed (CurrencyDisplay usually adds currency symbol)
    expect(screen.getByText(/150.50/)).toBeInTheDocument();
  });

  it("shows 'سحب الأرباح' button for teachers", () => {
    (useUserRole as jest.Mock).mockReturnValue({ isTeacher: true, isParent: false, isStudent: false });
    render(<WalletSummary balance="100" />);
    
    expect(screen.getByText("سحب الأرباح")).toBeInTheDocument();
    expect(screen.queryByText("شحن المحفظة")).not.toBeInTheDocument();
  });

  it("shows 'شحن المحفظة' button for parents", () => {
    (useUserRole as jest.Mock).mockReturnValue({ isTeacher: false, isParent: true, isStudent: false });
    render(<WalletSummary balance="100" />);
    
    expect(screen.getByText("شحن المحفظة")).toBeInTheDocument();
    expect(screen.queryByText("سحب الأرباح")).not.toBeInTheDocument();
  });

  it("shows both if user has multiple roles (though rare)", () => {
    (useUserRole as jest.Mock).mockReturnValue({ isTeacher: true, isParent: true, isStudent: false });
    render(<WalletSummary balance="100" />);
    
    expect(screen.getByText("سحب الأرباح")).toBeInTheDocument();
    expect(screen.getByText("شحن المحفظة")).toBeInTheDocument();
  });
});
