import toast from "react-hot-toast";

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
    return axiosError.response?.data?.message || fallback;
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
