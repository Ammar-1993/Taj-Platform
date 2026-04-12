import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    
    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-[1.25rem] text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
    
    // الأسلوب المخصص لتصميم المنصة المحدث (بدون Emojis)
    const variants = {
      default: "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-200/50 hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:-translate-y-0.5",
      destructive: "bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 active:bg-rose-200",
      outline: "border-2 border-indigo-100 bg-white hover:bg-indigo-50 text-indigo-700",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 hover:text-slate-900",
      link: "text-indigo-600 underline-offset-4 hover:underline focus-visible:underline",
    };

    const sizes = {
      default: "h-12 px-6 py-2",
      sm: "h-9 px-4 text-xs rounded-xl",
      lg: "h-14 px-8 text-lg rounded-[1.5rem]",
      icon: "h-12 w-12",
    };

    const computedClassName = cn(baseClass, variants[variant], sizes[size], className);

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children as React.ReactElement<any>, {
        className: cn(computedClassName, props.children.props.className),
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
