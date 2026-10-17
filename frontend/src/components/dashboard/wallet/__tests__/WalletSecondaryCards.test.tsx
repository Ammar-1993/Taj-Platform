import React from "react";
import { render, screen } from "@testing-library/react";
import { WalletSecondaryCards } from "../WalletSecondaryCards";
import { WalletTransaction } from "@/types";

const sampleTransactions: WalletTransaction[] = [
  {
    id: 1,
    wallet_id: 10,
    amount: "200.00",
    type: "deposit",
    description: "Wallet top-up: pay_12345",
    created_at: "2026-10-15T10:00:00Z",
  },
  {
    id: 2,
    wallet_id: 10,
    amount: "-85.00",
    type: "withdrawal",
    description: "خصم حجز (ريان)",
    created_at: "2026-10-16T14:30:00Z",
  },
];

describe("WalletSecondaryCards", () => {
  it("renders empty state when transactions list is empty", () => {
    render(<WalletSecondaryCards transactions={[]} isCollapsed={false} />);
    expect(screen.getByText("لا توجد عمليات سابقة")).toBeInTheDocument();
    expect(screen.getByText("مركز المساعدة")).toBeInTheDocument();
    expect(screen.getByText("فتح تذكرة دعم فني")).toBeInTheDocument();
  });

  it("renders formatted transactions for parent roleContext", () => {
    render(
      <WalletSecondaryCards
        transactions={sampleTransactions}
        isCollapsed={true}
        roleContext="parent"
      />
    );

    expect(screen.getByText("شحن المحفظة الإلكترونية")).toBeInTheDocument();
    expect(screen.getByText("خصم حجز موعد (ريان)")).toBeInTheDocument();
    expect(screen.getByText("+200.00")).toBeInTheDocument();
    expect(screen.getByText("-85.00")).toBeInTheDocument();
  });
});
