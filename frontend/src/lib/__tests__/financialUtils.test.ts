import {
  isNegativeTransaction,
  normalizeTransactionStatusType,
  parseTransactionDescription,
  getFriendlyTransactionDescription,
} from "../financialUtils";

describe("financialUtils", () => {
  describe("isNegativeTransaction", () => {
    it("identifies withdrawals and payouts as negative", () => {
      expect(isNegativeTransaction({ type: "withdrawal", amount: "100.00" })).toBe(true);
      expect(isNegativeTransaction({ type: "payout", amount: "100.00" })).toBe(true);
    });

    it("identifies negative numeric amounts as negative regardless of type", () => {
      expect(isNegativeTransaction({ type: "deposit", amount: "-50.00" })).toBe(true);
    });

    it("identifies positive deposits and earnings as non-negative", () => {
      expect(isNegativeTransaction({ type: "deposit", amount: "100.00" })).toBe(false);
      expect(isNegativeTransaction({ type: "class_earnings", amount: "80.00" })).toBe(false);
    });
  });

  describe("normalizeTransactionStatusType", () => {
    it("maps backend types to StatusBadge keys", () => {
      expect(normalizeTransactionStatusType("deposit")).toBe("wallet_topup");
      expect(normalizeTransactionStatusType("payout")).toBe("withdrawal");
      expect(normalizeTransactionStatusType("earnings")).toBe("class_earnings");
      expect(normalizeTransactionStatusType("refund")).toBe("refund");
    });

    it("passes through unknown types unchanged", () => {
      expect(normalizeTransactionStatusType("custom_type")).toBe("custom_type");
    });
  });

  describe("parseTransactionDescription", () => {
    it("returns default label when description is empty", () => {
      expect(parseTransactionDescription("")).toEqual({ main: "عملية مالية" });
    });

    it("extracts UUIDs and Moyasar payment references into sub", () => {
      const uuidDesc = "شحن المحفظة: 123e4567-e89b-12d3-a456-426614174000";
      expect(parseTransactionDescription(uuidDesc)).toEqual({
        main: "شحن المحفظة",
        sub: "123e4567-e89b-12d3-a456-426614174000",
      });

      const moyasarDesc = "Top-up: pay_abc123XYZ";
      expect(parseTransactionDescription(moyasarDesc)).toEqual({
        main: "Top-up",
        sub: "pay_abc123XYZ",
      });
    });

    it("returns main description unchanged when no technical ID exists", () => {
      expect(parseTransactionDescription("أرباح إكمال حصة")).toEqual({
        main: "أرباح إكمال حصة",
      });
    });
  });

  describe("getFriendlyTransactionDescription", () => {
    it("translates common transaction descriptions for student/teacher", () => {
      expect(getFriendlyTransactionDescription("Wallet top-up")).toBe(
        "شحن المحفظة الإلكترونية"
      );
      expect(getFriendlyTransactionDescription("Payout withdrawal")).toBe(
        "سحب أرباح المحفظة"
      );
      expect(getFriendlyTransactionDescription("Class earning")).toBe(
        "أرباح إكمال حصة تعليمية"
      );
      expect(getFriendlyTransactionDescription("Booking deduction")).toBe(
        "خصم لحجز حصة تعليمية"
      );
      expect(getFriendlyTransactionDescription("Refund for cancelled booking")).toBe(
        "استرداد مبلغ الحجز"
      );
    });

    it("extracts child name in parent roleContext for booking deductions", () => {
      expect(
        getFriendlyTransactionDescription(
          "خصم حجز (سارة)",
          true,
          "parent"
        )
      ).toBe("خصم حجز موعد (سارة)");
    });
  });
});
