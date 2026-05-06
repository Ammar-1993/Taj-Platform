import * as React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number | string;
  showSign?: boolean;
  colorStatus?: boolean; // If true, green for +, red for -
  size?: "sm" | "md" | "lg" | "xl";
}

export function CurrencyDisplay({
  amount,
  showSign = false,
  colorStatus = false,
  size = "md",
  className,
  ...props
}: CurrencyDisplayProps) {
  const num = parseFloat(String(amount ?? 0));
  const isNegative = num < 0;
  const absAmount = Math.abs(num);
  
  const formattedAmount = formatCurrency(absAmount, "number");

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-2xl font-bold",
  };

  const symbolSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-lg font-normal opacity-80",
  };

  let colorClass = "";
  if (colorStatus) {
    colorClass = isNegative ? "text-red-500" : "text-green-500";
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "flex items-center gap-1 justify-end",
        sizeClasses[size],
        colorClass,
        className
      )}
      {...props}
    >
      <span className={cn("text-gray-500 font-sans", symbolSizeClasses[size])}>
        ر.س
      </span>
      <span className="font-medium">
        {showSign && !isNegative && num !== 0 ? "+" : ""}
        {isNegative ? "-" : ""}
        {formattedAmount}
      </span>
    </div>
  );
}
