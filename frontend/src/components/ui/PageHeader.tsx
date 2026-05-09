import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: "default" | "glass" | "indigo";
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  badge,
  variant = "default",
  backHref = "/dashboard",
  backLabel = "العودة للوحة التحكم",
  showBack = true,
  actions,
}: PageHeaderProps) {
  const isDefault = variant === "default";
  const isIndigo = variant === "indigo";
  const isGlass = variant === "glass";

  return (
    <div 
      className={cn(
        "relative transition-all duration-300",
        isDefault && "bg-white p-5 sm:p-6 rounded-taj-lg shadow-sm border border-border",
        isIndigo && "bg-gradient-to-l from-brand-700 via-brand-600 to-brand-800 p-6 sm:p-8 rounded-taj-xl shadow-md text-white",
        isGlass && "bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-taj-xl shadow-lg border border-white/50"
      )}
    >
      {/* Decorative Background for Premium Variants */}
      {(isIndigo || isGlass) && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-0 opacity-10">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-brand-300 blur-3xl"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-5">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          {icon && (
            <div className={cn(
              "w-11 h-11 md:w-14 md:h-14 rounded-taj-md flex items-center justify-center shrink-0 shadow-inner",
              isIndigo ? "bg-white/20 text-white" : "bg-brand-50 text-brand-600"
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className={cn(
                "text-lg sm:text-2xl md:text-3xl font-bold tracking-tight truncate",
                isIndigo ? "text-white" : "text-text-primary"
              )}>
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className={cn(
                "text-xs sm:text-sm md:text-base font-medium opacity-90 leading-relaxed",
                isIndigo ? "text-brand-100" : "text-text-secondary"
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
          {actions && <div className="flex-1 sm:flex-none">{actions}</div>}
          {showBack && (
            <Link
              href={backHref}
              className={cn(
                "flex px-4 py-2 sm:px-5 sm:py-2.5 rounded-taj-md text-xs sm:text-sm font-bold transition-all duration-200 items-center justify-center gap-2",
                isIndigo 
                  ? "bg-white/20 hover:bg-white/30 text-white border border-white/20 shadow-sm" 
                  : "bg-surface-subtle hover:bg-surface-muted text-text-secondary border border-border"
              )}
            >
              <ChevronRight className="w-4 h-4 md:hidden" />
              <span>{backLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
