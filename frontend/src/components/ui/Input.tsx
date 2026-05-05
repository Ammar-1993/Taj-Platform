import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  labelAction?: React.ReactNode;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, dir, label, labelAction, error, hint, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = React.useId();
    const finalId = id || inputId;
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    // Auto-enforce LTR for inputs where typing direction must be left-to-right
    // (email addresses, phone numbers, passwords) even in an RTL page layout.
    // An explicitly passed `dir` prop always takes priority.
    const ltrTypes = new Set(["email", "tel", "password"]);
    const resolvedDir: React.HTMLAttributes<HTMLInputElement>["dir"] =
      dir ?? (ltrTypes.has(type ?? "") ? "ltr" : undefined);

    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor={finalId} className="block text-sm font-bold text-text-primary">
              {label}
            </label>
            {labelAction}
          </div>
        )}
        <div className="relative group w-full">
          {icon && (
            <div className={cn("absolute top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors z-10 pointer-events-none", resolvedDir === 'ltr' ? 'left-3.5' : 'right-3.5')}>
              {icon}
            </div>
          )}
          <input
            id={finalId}
            type={currentType}
            dir={resolvedDir}
            className={cn(
              "flex w-full rounded-taj-md border-2 border-transparent bg-surface-subtle hover:bg-surface-muted px-4 py-2.5 text-sm transition-all duration-200 outline-none",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-text-muted placeholder:tracking-normal font-bold text-text-primary",
              "focus-visible:outline-none focus:ring-4 focus:ring-brand-100/50 focus:border-brand-500 hover:border-brand-100",
              "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70 disabled:grayscale",
              error && "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30 animate-shake",
              // Specific styling for date and time inputs to look uniform
              (type === "date" || type === "time") && "appearance-none min-h-[45px] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:transition-opacity",
              // Align text to the left for LTR inputs (email/tel/password) in RTL context
              resolvedDir === 'ltr' ? "text-left" : "",
              icon ? (resolvedDir === 'ltr' ? "pl-10" : "pr-10") : "",
              isPassword ? (resolvedDir === 'ltr' ? "pr-10 tracking-widest" : "pl-10 tracking-widest") : "",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors p-1 focus:outline-none focus:text-indigo-600", resolvedDir === 'ltr' ? 'right-3' : 'left-3')}
              title={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
              aria-live="polite"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-bold text-red-500 animate-fade-in-up">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs font-medium text-gray-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
