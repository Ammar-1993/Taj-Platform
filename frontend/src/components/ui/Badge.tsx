import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
  size?: "sm" | "md";
}

const variants = {
  default: "bg-neutral-bg text-neutral-text border-transparent",
  success: "bg-success-bg text-success-text border-transparent",
  warning: "bg-warning-bg text-warning-text border-transparent",
  error:   "bg-error-bg text-error-text border-transparent",
  info:    "bg-info-bg text-info-text border-transparent",
  outline: "bg-transparent border-border text-text-secondary",
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({ 
  className, 
  variant = "default", 
  size = "md",
  ...props 
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-taj-sm border font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
