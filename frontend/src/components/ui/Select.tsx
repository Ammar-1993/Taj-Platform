import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, dir, children, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        {icon && (
          <div className={cn("absolute top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-600 transition-colors z-10 pointer-events-none", dir === 'ltr' ? 'left-4' : 'right-4')}>
            {icon}
          </div>
        )}
        <select
          dir={dir}
          className={cn(
            "flex h-12 w-full appearance-none rounded-taj-md border-2 border-transparent bg-surface-subtle px-4 py-2 text-sm font-bold text-text-primary transition-all duration-300",
            "focus-visible:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 hover:bg-surface-muted cursor-pointer",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted",
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
    )
  }
)
Select.displayName = "Select"

export { Select }
