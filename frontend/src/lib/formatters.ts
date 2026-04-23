/**
 * lib/formatters.ts
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for ALL user-facing formatting on the
 * Taj platform. Every date, time, currency, and rating value
 * shown to a user MUST pass through one of these functions.
 *
 * Design rule: always use the 'ar-SA-u-nu-latn' locale tag.
 *   - 'ar-SA'   → Arabic (Saudi Arabia) text & calendar
 *   - 'u-nu-latn' → Override numeral system to Latin (1,2,3)
 *                   instead of Arabic-Indic (١,٢,٣)
 * ─────────────────────────────────────────────────────────────
 */

const LOCALE = "ar-SA-u-nu-latn";

// ─── Date ─────────────────────────────────────────────────────

type DateFormat = "short" | "medium" | "long";

const DATE_OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  // "25/04/2025"
  short: { day: "2-digit", month: "2-digit", year: "numeric" },
  // "25 أبريل 2025"
  medium: { day: "numeric", month: "long", year: "numeric" },
  // "الجمعة، 25 أبريل 2025"
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
};

/**
 * Formats an ISO date string or Date object for display.
 * Always uses Latin numerals regardless of browser locale.
 *
 * @example
 *   formatDate("2025-04-25")          // "25 أبريل 2025"
 *   formatDate("2025-04-25", "short") // "25/04/2025"
 *   formatDate("2025-04-25", "long")  // "الجمعة، 25 أبريل 2025"
 */
export function formatDate(
  dateStr: string | Date | undefined | null,
  format: DateFormat = "medium"
): string {
  if (!dateStr) return "";
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString(LOCALE, DATE_OPTIONS[format]);
  } catch {
    return String(dateStr);
  }
}

// ─── Time ─────────────────────────────────────────────────────

/**
 * Formats a 24-hour time string (HH:mm or HH:mm:ss) to a
 * 12-hour Arabic display with AM/PM — using Latin numerals.
 * Replaces the manual formatTimeTo12h() in lib/utils.ts.
 *
 * @example
 *   formatTime("14:30") // "02:30 مساءً"
 *   formatTime("09:00") // "09:00 صباحاً"
 */
export function formatTime(timeStr: string | undefined | null): string {
  if (!timeStr) return "";
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date.toLocaleTimeString(LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeStr ?? "";
  }
}

// ─── Currency ─────────────────────────────────────────────────

type CurrencyStyle = "label" | "code";

/**
 * Formats a number or API string as Saudi Riyal currency.
 * Always uses Latin numerals. Always 2 decimal places.
 *
 * @param amount  number or string from API (e.g. "1500.50" or 35)
 * @param style   'label' → "1,500.50 ريال"  (dashboard, cards)
 *                'code'  → "1,500.50 SAR"   (payout, financial docs)
 *
 * @example
 *   formatCurrency("1500.5")          // "1,500.50 ريال"
 *   formatCurrency(35, "code")        // "35.00 SAR"
 *   formatCurrency(0)                 // "0.00 ريال"
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  style: CurrencyStyle = "label"
): string {
  const num = parseFloat(String(amount ?? 0));
  if (isNaN(num)) return style === "code" ? "0.00 SAR" : "0.00 ريال";

  const formatted = num.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return style === "code" ? `${formatted} SAR` : `${formatted} ريال`;
}

// ─── Rating ───────────────────────────────────────────────────

/**
 * Formats a teacher rating to one decimal place using Latin numerals.
 *
 * @example
 *   formatRating(4.7)     // "4.7"
 *   formatRating("4.00")  // "4.0"
 *   formatRating(undefined) // "0.0"
 */
export function formatRating(
  rating: number | string | undefined | null
): string {
  const num = parseFloat(String(rating ?? 0));
  if (isNaN(num)) return "0.0";
  return num.toLocaleString(LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
