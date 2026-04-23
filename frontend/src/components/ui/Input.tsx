import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, dir, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const currentType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="relative group w-full">
        {icon && (
          <div className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none", dir === 'ltr' ? 'left-4' : 'right-4')}>
            {icon}
          </div>
        )}
        <input
          type={currentType}
          dir={dir}
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-400 placeholder:tracking-normal font-bold",
            "focus-visible:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400",
            icon ? (dir === 'ltr' ? "pl-11" : "pr-11") : "",
            isPassword ? (dir === 'ltr' ? "pr-11 tracking-widest" : "pl-11 tracking-widest") : "",
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
    )
  }
)
Input.displayName = "Input"

export { Input }
