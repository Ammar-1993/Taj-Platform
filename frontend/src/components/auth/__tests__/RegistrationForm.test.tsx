import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm, RegistrationFormProps } from "../RegistrationForm";
import { authService } from "@/services/api";

const mockPush = jest.fn();
const mockLogin = jest.fn().mockResolvedValue(undefined);
const mockExecuteRecaptcha = jest.fn().mockResolvedValue("mock-recaptcha-token");

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("next/script", () => {
  return function MockScript() {
    return null;
  };
});

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

jest.mock("@/hooks/useRecaptcha", () => ({
  useRecaptcha: () => ({
    executeRecaptcha: mockExecuteRecaptcha,
  }),
}));

jest.mock("@/services/api", () => ({
  authService: {
    register: jest.fn(),
  },
}));

const studentProps: RegistrationFormProps = {
  role: "student",
  emoji: "🎓",
  title: "إنشاء حساب طالب",
  subtitle: "انضم الآن وابدأ رحلة التفوق مع نخبة المعلمين في منصة تاج",
  nameLabel: "اسم الطالب *",
  nameRequiredMessage: "اسم الطالب مطلوب",
  emailPlaceholder: "student@taj.com",
  submitLabel: "إنشاء حساب طالب",
  redirectPath: "/dashboard/settings",
  redirectSubtitle: "جاري توجيهك لإكمال بيانات حسابك...",
  headerBgClass: "bg-indigo-500/10 border-b border-indigo-500/10",
  topBlobClass: "bg-indigo-500/20",
  bottomBlobClass: "bg-blue-500/20",
  backLinkHoverClass: "hover:text-indigo-700",
};

describe("RegistrationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blocks form submission synchronously when submitted with empty fields without prior blur", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm {...studentProps} />);

    const submitBtn = screen.getByRole("button", { name: /إنشاء حساب طالب/i });
    await user.click(submitBtn);

    expect(authService.register).not.toHaveBeenCalled();
    expect(screen.getByText("اسم الطالب مطلوب")).toBeInTheDocument();
    expect(screen.getByText("البريد الإلكتروني مطلوب")).toBeInTheDocument();
    expect(screen.getByText("رقم الجوال مطلوب")).toBeInTheDocument();
    expect(screen.getByText("كلمة المرور مطلوبة")).toBeInTheDocument();
  });

  it("submits valid registration data with role and recaptcha_token and logs the user in", async () => {
    const user = userEvent.setup();
    (authService.register as jest.Mock).mockResolvedValue({
      data: {
        token: "jwt-token-123",
        user: { id: 10, name: "طالب جديد", email: "student@taj.com" },
      },
    });

    render(<RegistrationForm {...studentProps} />);

    await user.type(
      screen.getByPlaceholderText("الاسم الثنائي أو الثلاثي"),
      "محمد بن عبدالله"
    );
    await user.type(
      screen.getByPlaceholderText("student@taj.com"),
      "student@taj.com"
    );
    await user.type(screen.getByPlaceholderText("05XXXXXXXX"), "0512345678");
    await user.type(screen.getByPlaceholderText("••••••••"), "Password123!");

    await user.click(screen.getByRole("button", { name: /إنشاء حساب طالب/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: "محمد بن عبدالله",
        email: "student@taj.com",
        phone: "0512345678",
        password: "Password123!",
        role: "student",
        recaptcha_token: "mock-recaptcha-token",
      });
    });

    expect(mockLogin).toHaveBeenCalledWith("jwt-token-123", {
      id: 10,
      name: "طالب جديد",
      email: "student@taj.com",
    });
    expect(screen.getByText("تم إنشاء حسابك بنجاح!")).toBeInTheDocument();
  });

  it("renders inline login links when 422 response indicates email or phone is already taken", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (authService.register as jest.Mock).mockRejectedValue({
      response: {
        status: 422,
        data: {
          errors: {
            email: ["البريد الإلكتروني مسجل مسبقاً"],
            phone: ["رقم الجوال مسجل مسبقاً"],
          },
        },
      },
    });

    render(<RegistrationForm {...studentProps} />);

    await user.type(
      screen.getByPlaceholderText("الاسم الثنائي أو الثلاثي"),
      "محمد بن عبدالله"
    );
    await user.type(
      screen.getByPlaceholderText("student@taj.com"),
      "taken@taj.com"
    );
    await user.type(screen.getByPlaceholderText("05XXXXXXXX"), "0512345678");
    await user.type(screen.getByPlaceholderText("••••••••"), "Password123!");

    await user.click(screen.getByRole("button", { name: /إنشاء حساب طالب/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/هذا البريد الإلكتروني مسجل مسبقاً/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/رقم الجوال هذا مسجل مسبقاً/i)
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
