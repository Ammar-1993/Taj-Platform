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
 *
 * Added in Step-1 refactor:
 *   - formatDatetime() → handles raw DB strings like "00:00:00 2026-05-20"
 *   - roundToSlot()    → snaps HH:mm to nearest 30-min interval
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

/**
 * Normalises a raw database datetime string that may arrive in the
 * non-standard format "HH:mm:ss YYYY-MM-DD" (time before date),
 * then formats it as a human-readable Arabic date.
 *
 * Falls back gracefully to formatDate() for already-valid ISO strings.
 *
 * @example
 *   formatDatetime("00:00:00 2026-05-20", "long")  // "الأربعاء، 20 مايو 2026"
 *   formatDatetime("2026-05-20T00:00:00", "medium") // "20 مايو 2026"
 */
export function formatDatetime(
  raw: string | undefined | null,
  format: "short" | "medium" | "long" = "medium"
): string {
  if (!raw) return "";
  // Detect the quirky "HH:mm:ss YYYY-MM-DD" pattern and reorder to ISO
  const dbPattern = /^(\d{2}:\d{2}:\d{2})\s+(\d{4}-\d{2}-\d{2})$/;
  const match = raw.match(dbPattern);
  const normalised = match ? `${match[2]}T${match[1]}` : raw;
  return formatDate(normalised, format);
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

/**
 * Formats a 24-hour time string (HH:mm) to a 12-hour Arabic formatted string:
 * "14:30" -> "02:30 م"
 * "08:00" -> "08:00 ص"
 */
export function formatToArabic12Hour(time24: string | undefined | null): string {
  if (!time24) return "";
  try {
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr.substring(0, 2); // Ensure we only get HH:mm even if HH:mm:ss is passed
    const ampm = h >= 12 ? "م" : "ص";
    h = h % 12;
    h = h ? h : 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  } catch {
    return time24 ?? "";
  }
}

/**
 * Snaps a HH:mm time string to the nearest 30-minute slot boundary.
 * Prevents teachers from inadvertently creating slots at odd times
 * like "07:18" — the result will be "07:30" instead.
 *
 * @example
 *   roundToSlot("07:18") // "07:30"
 *   roundToSlot("07:02") // "07:00"
 *   roundToSlot("13:45") // "14:00"
 */
export function roundToSlot(timeStr: string): string {
  if (!timeStr) return timeStr;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const totalMinutes = h * 60 + m;
  const rounded = Math.round(totalMinutes / 30) * 30;
  const rh = Math.floor(rounded / 60) % 24;
  const rm = rounded % 60;
  return `${String(rh).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
}

// ─── Currency ─────────────────────────────────────────────────

type CurrencyStyle = "label" | "code" | "number";

/**
 * Formats a number or API string as Saudi Riyal currency.
 * Always uses Latin numerals. Always 2 decimal places.
 *
 * @param amount  number or string from API (e.g. "1500.50" or 35)
 * @param style   'label' → "1,500.50 ر.س"  (dashboard, cards)
 *                'code'  → "1,500.50 SAR"   (payout, financial docs)
 *
 * @example
 *   formatCurrency("1500.5")          // "1,500.50 ر.س"
 *   formatCurrency(35, "code")        // "35.00 SAR"
 *   formatCurrency(0)                 // "0.00 ر.س"
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  style: CurrencyStyle = "label"
): string {
  const num = parseFloat(String(amount ?? 0));
  if (isNaN(num)) {
    if (style === "code") return "0.00 SAR";
    if (style === "number") return "0.00";
    return "0.00 ر.س";
  }

  const formatted = num.toLocaleString(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (style === "number") return formatted;
  return style === "code" ? `${formatted} SAR` : `${formatted} ر.س`;
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
