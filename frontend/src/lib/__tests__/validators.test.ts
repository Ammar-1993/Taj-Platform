import {
  validateNameField,
  validateEmailField,
  validatePhoneField,
  validatePasswordField,
  validateLoginPasswordField,
  parseRegistrationValidationErrors,
} from "../validators";

describe("Synchronous Form Validators", () => {
  describe("validateNameField", () => {
    it("returns default error when name is empty or whitespace", () => {
      expect(validateNameField("")).toBe("الاسم مطلوب");
      expect(validateNameField("   ")).toBe("الاسم مطلوب");
    });

    it("returns custom error message when provided", () => {
      expect(validateNameField("", "اسم الطالب مطلوب")).toBe("اسم الطالب مطلوب");
      expect(validateNameField("  ", "اسم المعلم مطلوب")).toBe("اسم المعلم مطلوب");
    });

    it("returns empty string for valid name", () => {
      expect(validateNameField("أحمد محمد")).toBe("");
    });
  });

  describe("validateEmailField", () => {
    it("returns error when email is empty", () => {
      expect(validateEmailField("")).toBe("البريد الإلكتروني مطلوب");
      expect(validateEmailField("   ")).toBe("البريد الإلكتروني مطلوب");
    });

    it("returns format error for invalid email addresses", () => {
      expect(validateEmailField("invalid-email")).toBe("صيغة البريد الإلكتروني غير صحيحة");
      expect(validateEmailField("user@")).toBe("صيغة البريد الإلكتروني غير صحيحة");
      expect(validateEmailField("@domain.com")).toBe("صيغة البريد الإلكتروني غير صحيحة");
    });

    it("returns empty string for valid email", () => {
      expect(validateEmailField("student@taj.com")).toBe("");
    });
  });

  describe("validatePhoneField", () => {
    it("returns error when phone is empty", () => {
      expect(validatePhoneField("")).toBe("رقم الجوال مطلوب");
    });

    it("returns incomplete error when phone has fewer than 10 digits", () => {
      expect(validatePhoneField("05123456")).toBe("رقم الجوال غير مكتمل");
    });

    it("returns empty string when phone has 10 digits", () => {
      expect(validatePhoneField("0512345678")).toBe("");
    });
  });

  describe("validatePasswordField", () => {
    it("returns error when password is empty", () => {
      expect(validatePasswordField("")).toBe("كلمة المرور مطلوبة");
    });

    it("returns min length error when shorter than 8 characters", () => {
      expect(validatePasswordField("1234567")).toBe("يجب أن لا تقل عن 8 أحرف");
    });

    it("returns empty string when password is 8+ characters", () => {
      expect(validatePasswordField("12345678")).toBe("");
    });
  });

  describe("validateLoginPasswordField", () => {
    it("returns error when password is empty", () => {
      expect(validateLoginPasswordField("")).toBe("كلمة المرور مطلوبة");
    });

    it("returns empty string for any non-empty password", () => {
      expect(validateLoginPasswordField("secret")).toBe("");
    });
  });

  describe("parseRegistrationValidationErrors", () => {
    it("returns non-validation result for non-422 errors", () => {
      const result = parseRegistrationValidationErrors({
        response: { status: 500 },
      });
      expect(result.isValidationError).toBe(false);
      expect(result.hasCustomError).toBe(false);
    });

    it("detects email_taken and phone_taken errors across Arabic and English messages", () => {
      const result = parseRegistrationValidationErrors({
        response: {
          status: 422,
          data: {
            errors: {
              email: ["The email has already been taken."],
              phone: ["رقم الجوال مسجل مسبقاً"],
            },
          },
        },
      });

      expect(result.isValidationError).toBe(true);
      expect(result.hasCustomError).toBe(true);
      expect(result.emailError).toBe("email_taken");
      expect(result.phoneError).toBe("phone_taken");
    });

    it("maps standard field errors and recaptcha_token banner errors", () => {
      const result = parseRegistrationValidationErrors({
        response: {
          status: 422,
          data: {
            errors: {
              name: ["الاسم غير صالح"],
              email: ["صيغة البريد غير صحيحة"],
              phone: ["رقم الجوال غير صالح"],
              password: ["كلمة المرور ضعيفة"],
              recaptcha_token: ["Invalid recaptcha"],
            },
          },
        },
      });

      expect(result.isValidationError).toBe(true);
      expect(result.hasCustomError).toBe(true);
      expect(result.nameError).toBe("الاسم غير صالح");
      expect(result.emailError).toBe("صيغة البريد غير صحيحة");
      expect(result.phoneError).toBe("رقم الجوال غير صالح");
      expect(result.passwordError).toBe("كلمة المرور ضعيفة");
      expect(result.bannerError).toBe(
        "فشل التحقق من الأمان (reCAPTCHA). يرجى المحاولة مرة أخرى."
      );
    });
  });
});
