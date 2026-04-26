import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, dir, label, error, hint, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = React.useId();
    const finalId = id || inputId;
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={finalId} className="block text-sm font-bold text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative group w-full">
          {icon && (
            <div className={cn("absolute top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors z-10 pointer-events-none", dir === 'ltr' ? 'left-3.5' : 'right-3.5')}>
              {icon}
            </div>
          )}
          <input
            id={finalId}
            type={currentType}
            dir={dir}
            className={cn(
              "flex w-full rounded-taj-md border-2 border-transparent bg-surface-subtle hover:bg-surface-muted px-4 py-2.5 text-sm transition-all duration-300 outline-none",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-text-muted placeholder:tracking-normal font-bold text-text-primary",
              "focus-visible:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500",
              "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-70",
              error && "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30",
              icon ? (dir === 'ltr' ? "pl-10" : "pr-10") : "",
              isPassword ? (dir === 'ltr' ? "pr-10 tracking-widest" : "pl-10 tracking-widest") : "",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors p-1 focus:outline-none focus:text-indigo-600", dir === 'ltr' ? 'right-3' : 'left-3')}
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
