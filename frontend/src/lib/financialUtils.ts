import { WalletTransaction } from "@/types";

const TRANSACTION_TYPE_MAP: Record<string, string> = {
  deposit: "wallet_topup",
  payout: "withdrawal",
  earnings: "class_earnings",
  class_earnings: "class_earnings",
  wallet_topup: "wallet_topup",
  withdrawal: "withdrawal",
  refund: "refund",
};

const TECHNICAL_ID_REGEX =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32,}|pay_[a-zA-Z0-9]+)/i;

const UUID_GLOBAL_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Determines whether a wallet transaction represents a debit/outflow.
 */
export function isNegativeTransaction(
  tx: Pick<WalletTransaction, "type" | "amount">
): boolean {
  return (
    tx.type === "withdrawal" ||
    tx.type === "payout" ||
    parseFloat(String(tx.amount)) < 0
  );
}

/**
 * Normalizes backend transaction type strings into StatusBadge keys.
 */
export function normalizeTransactionStatusType(type: string): string {
  return TRANSACTION_TYPE_MAP[type] || type;
}

/**
 * Splits a transaction description if it contains a UUID or gateway reference ID.
 */
export function parseTransactionDescription(desc: string): {
  main: string;
  sub?: string;
} {
  if (!desc) {
    return { main: "عملية مالية" };
  }

  const match = desc.match(TECHNICAL_ID_REGEX);
  if (match) {
    const main =
      desc
        .replace(match[0], "")
        .replace(/:\s*$/, "")
        .trim() || "عملية مالية";
    return { main, sub: match[0] };
  }

  return { main: desc };
}

/**
 * Translates technical wallet transaction descriptions into user-friendly Arabic text.
 */
export function getFriendlyTransactionDescription(
  desc: string,
  isNegative = false,
  roleContext: "student_teacher" | "parent" = "student_teacher"
): string {
  if (!desc) {
    if (roleContext === "parent") return "عملية مالية";
    return isNegative ? "خصم مالي" : "إيداع مالي";
  }

  const lower = desc.toLowerCase();

  if (
    lower.includes("top-up") ||
    lower.includes("deposit") ||
    desc.includes("شحن")
  ) {
    return "شحن المحفظة الإلكترونية";
  }

  if (
    lower.includes("payout") ||
    lower.includes("withdrawal") ||
    desc.includes("سحب")
  ) {
    return "سحب أرباح المحفظة";
  }

  if (
    lower.includes("earning") ||
    desc.includes("أرباح") ||
    desc.includes("تحصيل")
  ) {
    return "أرباح إكمال حصة تعليمية";
  }

  if (
    lower.includes("refund") ||
    desc.includes("استرجاع") ||
    desc.includes("استرداد")
  ) {
    return "استرداد مبلغ الحجز";
  }

  if (
    lower.includes("booking") ||
    lower.includes("deduction") ||
    desc.includes("خصم")
  ) {
    if (roleContext === "parent") {
      const childMatch =
        desc.match(/\(([^)]+)\)/) || desc.match(/:\s*([^\s]+)/);
      if (childMatch) {
        return `خصم حجز موعد (${childMatch[1]})`;
      }
      return "خصم لحجز موعد حصة";
    }
    return "خصم لحجز حصة تعليمية";
  }

  const cleaned = desc
    .replace(UUID_GLOBAL_REGEX, "")
    .replace(/:\s*$/, "")
    .trim();

  if (cleaned) {
    return cleaned;
  }

  if (roleContext === "parent") {
    return "عملية مالية";
  }

  return isNegative ? "خصم حجز / سحب" : "إيداع / أرباح";
}
