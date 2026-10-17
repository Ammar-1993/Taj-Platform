export interface ApiValidationErrorShape {
  response?: {
    status: number;
    data?: {
      errors?: Record<string, string[]>;
    };
  };
}

export interface ParsedRegistrationErrors {
  nameError?: string;
  emailError?: string;
  phoneError?: string;
  passwordError?: string;
  bannerError?: string;
  hasCustomError: boolean;
  isValidationError: boolean;
}

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const TAKEN_PATTERNS = ["taken", "مسجل", "مستخدم", "موجود", "مكرر", "unique"];

/**
 * Synchronously validates a required name field.
 * Returns an empty string when valid, or the localized Arabic error message.
 */
export function validateNameField(
  name: string,
  requiredMessage = "الاسم مطلوب"
): string {
  if (!name.trim()) {
    return requiredMessage;
  }
  return "";
}

/**
 * Synchronously validates an email address.
 * Returns an empty string when valid, or the localized Arabic error message.
 */
export function validateEmailField(email: string): string {
  if (!email.trim()) {
    return "البريد الإلكتروني مطلوب";
  }
  if (!EMAIL_REGEX.test(email)) {
    return "صيغة البريد الإلكتروني غير صحيحة";
  }
  return "";
}

/**
 * Synchronously validates a 10-digit mobile phone number.
 * Returns an empty string when valid, or the localized Arabic error message.
 */
export function validatePhoneField(phone: string): string {
  if (!phone) {
    return "رقم الجوال مطلوب";
  }
  if (phone.length < 10) {
    return "رقم الجوال غير مكتمل";
  }
  return "";
}

/**
 * Synchronously validates a registration password (minimum length check).
 * Returns an empty string when valid, or the localized Arabic error message.
 */
export function validatePasswordField(password: string, minLength = 8): string {
  if (!password) {
    return "كلمة المرور مطلوبة";
  }
  if (password.length < minLength) {
    return `يجب أن لا تقل عن ${minLength} أحرف`;
  }
  return "";
}

/**
 * Synchronously validates a login password (presence check).
 */
export function validateLoginPasswordField(password: string): string {
  if (!password) {
    return "كلمة المرور مطلوبة";
  }
  return "";
}

function isFieldTaken(messages: string[] | undefined): boolean {
  return (
    Array.isArray(messages) &&
    messages.some(
      (msg) =>
        typeof msg === "string" &&
        TAKEN_PATTERNS.some((pattern) => msg.toLowerCase().includes(pattern))
    )
  );
}

/**
 * Parses a 422 Laravel validation error response from registration endpoints
 * into structured field-level and banner-level errors.
 */
export function parseRegistrationValidationErrors(
  err: unknown
): ParsedRegistrationErrors {
  const apiError = err as ApiValidationErrorShape;
  if (apiError?.response?.status !== 422 || !apiError.response.data?.errors) {
    return {
      hasCustomError: false,
      isValidationError: false,
    };
  }

  const validationErrors = apiError.response.data.errors;
  const result: ParsedRegistrationErrors = {
    hasCustomError: false,
    isValidationError: true,
  };

  if (validationErrors.email && isFieldTaken(validationErrors.email)) {
    result.emailError = "email_taken";
    result.hasCustomError = true;
  } else if (Array.isArray(validationErrors.email) && validationErrors.email[0]) {
    result.emailError = validationErrors.email[0];
  }

  if (validationErrors.phone && isFieldTaken(validationErrors.phone)) {
    result.phoneError = "phone_taken";
    result.hasCustomError = true;
  } else if (Array.isArray(validationErrors.phone) && validationErrors.phone[0]) {
    result.phoneError = validationErrors.phone[0];
  }

  if (Array.isArray(validationErrors.name) && validationErrors.name[0]) {
    result.nameError = validationErrors.name[0];
  }

  if (Array.isArray(validationErrors.password) && validationErrors.password[0]) {
    result.passwordError = validationErrors.password[0];
  }

  if (validationErrors.recaptcha_token) {
    result.bannerError = "فشل التحقق من الأمان (reCAPTCHA). يرجى المحاولة مرة أخرى.";
    result.hasCustomError = true;
  }

  return result;
}
