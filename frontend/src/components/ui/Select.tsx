import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, dir, label, error, children, id, ...props }, ref) => {
    const selectId = React.useId();
    const finalId = id || selectId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={finalId} className="block text-sm font-bold text-text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative group w-full">
          {icon && (
            <div className={cn("absolute top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors z-10 pointer-events-none", dir === 'ltr' ? 'left-4' : 'right-4')}>
              {icon}
            </div>
          )}
          <select
            id={finalId}
            dir={dir}
            className={cn(
              "flex h-12 w-full appearance-none rounded-taj-md border-2 border-transparent bg-surface-subtle px-4 py-2 text-sm font-bold text-text-primary transition-all duration-300 outline-none",
              "focus-visible:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 hover:bg-surface-muted cursor-pointer",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
              error && "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30",
              icon ? (dir === 'ltr' ? "pl-11 pr-10" : "pr-11 pl-10") : (dir === 'ltr' ? "pr-10" : "pl-10"),
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={18}
            className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none", dir === 'ltr' ? 'right-4' : 'left-4')}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-bold text-red-500">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
