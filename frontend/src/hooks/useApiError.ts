import toast from "react-hot-toast";

/**
 * Maps raw backend/Laravel error keys to human-readable Arabic messages.
 * Called automatically by getApiErrorMessage() — no page needs to call this directly.
 *
 * Covers:
 *  - Laravel Password Broker keys (passwords.*)
 *  - Laravel Validation keys (validation.*)
 *  - Known API message strings that may leak through
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // ─── Password Broker (from __($status) in forgotPassword / resetPassword) ───
  "passwords.user":      "هذا البريد الإلكتروني غير مسجّل لدينا",
  "passwords.token":     "رابط إعادة التعيين غير صالح أو منتهي الصلاحية، يرجى طلب رابط جديد",
  "passwords.throttled": "تجاوزت عدد المحاولات، يرجى الانتظار قبل المحاولة مجدداً",
  "passwords.reset":     "تم إعادة تعيين كلمة المرور بنجاح",
  "passwords.sent":      "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",

  // ─── Laravel Validation keys ────────────────────────────────────────────────
  "validation.unique":   "هذا البريد الإلكتروني أو رقم الجوال مسجّل مسبقاً",
  "validation.exists":   "هذا البريد الإلكتروني غير مسجّل لدينا",
  "validation.required": "يرجى تعبئة جميع الحقول المطلوبة",
  "validation.email":    "صيغة البريد الإلكتروني غير صحيحة",
  "validation.min.string": "كلمة المرور قصيرة جداً، يجب أن تكون 8 أحرف على الأقل",
};

/**
 * Translates a raw error message from the API/backend to human-readable Arabic.
 * Pass-through for messages that are already in Arabic or don't need translation.
 */
function translateApiError(message: string): string {
  return ERROR_MESSAGE_MAP[message] ?? message;
}

/**
 * يستخرج رسالة الخطأ من استجابة الـ API
 * يُغني عن تكرار (err as { response?: ... }) في كل مكان
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: { data?: { message?: string } };
    };
    const raw = axiosError.response?.data?.message;
    if (raw) return translateApiError(raw);
  }
  return fallback;
}

/**
 * يعرض رسالة الخطأ مباشرة كـ Toast
 */
export function showApiError(
  error: unknown,
  fallback?: string
): void {
  toast.error(getApiErrorMessage(error, fallback));
}
