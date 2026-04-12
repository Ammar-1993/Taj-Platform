import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, dir, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {icon && (
          <div className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none", dir === 'ltr' ? 'left-4' : 'right-4')}>
            {icon}
          </div>
        )}
        <input
          type={type}
          dir={dir}
          className={cn(
            "flex h-12 w-full rounded-[1.25rem] border-2 border-transparent bg-gray-50/50 px-4 py-2 text-sm font-medium transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-gray-400 font-bold",
            "focus-visible:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 hover:bg-gray-50",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
            icon ? (dir === 'ltr' ? "pl-11" : "pr-11") : "",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
