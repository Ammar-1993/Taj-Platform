import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    
    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none active:scale-95 gap-2";
    
    // الأسلوب المخصص لتصميم المنصة المحدث
    const variants = {
      default: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
      destructive: "bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 active:bg-rose-200",
      outline: "border-2 border-indigo-100 bg-white hover:bg-indigo-50 text-indigo-700",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-indigo-600 underline-offset-4 hover:underline focus-visible:underline",
      gradient: "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs rounded-md",
      lg: "h-12 px-8 text-lg rounded-xl",
      icon: "h-10 w-10",
    };

    const computedClassName = cn(baseClass, variants[variant as keyof typeof variants], sizes[size as keyof typeof sizes], className);

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement, {
        className: cn(computedClassName, (props.children.props as { className?: string }).className),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref: ref as any,
      });
    }

    return (
      <button
        ref={ref}
        className={computedClassName}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
