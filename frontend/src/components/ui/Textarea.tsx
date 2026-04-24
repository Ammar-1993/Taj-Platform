import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = React.useId();
    const finalId = id || inputId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={finalId} className="block text-sm font-bold text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={finalId}
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border-2 border-transparent bg-gray-50/50 hover:bg-gray-50 px-4 py-3 text-sm transition-all duration-300 outline-none resize-y",
            "placeholder:text-gray-400 font-medium text-gray-900",
            "focus-visible:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-70",
            error && "border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30",
            className
          )}
          ref={ref}
          {...props}
        />
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
Textarea.displayName = "Textarea"

export { Textarea }
