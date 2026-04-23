import * as React from "react";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

interface NumericDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number | string;
  currency?: string;
}

export function NumericDisplay({ value, currency, className, ...props }: NumericDisplayProps) {
  return (
    <span
      dir="ltr"
      className={cn("inline-flex items-baseline gap-1 font-semibold tracking-tight", inter.className, className)}
      {...props}
    >
      <span>{value}</span>
      {currency && (
        <span className="text-sm font-normal text-muted-foreground ml-1" dir="rtl">
          {currency}
        </span>
      )}
    </span>
  );
}
