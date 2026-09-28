import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandEmblemProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withText?: boolean;
  clickable?: boolean;
}

export default function BrandEmblem({
  size = "md",
  className,
  withText = false,
  clickable = true,
}: BrandEmblemProps) {
  const sizeMap = {
    sm: { box: "w-9 h-9 rounded-xl", icon: "w-5 h-5", text: "text-base" },
    md: { box: "w-12 h-12 rounded-2xl", icon: "w-6 h-6", text: "text-lg" },
    lg: { box: "w-16 h-16 rounded-2xl sm:rounded-3xl", icon: "w-8 h-8 sm:w-9 sm:h-9", text: "text-xl sm:text-2xl" },
    xl: { box: "w-20 h-20 rounded-3xl", icon: "w-11 h-11", text: "text-2xl sm:text-3xl" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={cn("inline-flex items-center gap-3.5 group select-none", className)}>
      <div className="relative">
        {/* Ambient Glow */}
        <div
          className={cn(
            "absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 opacity-40 blur-md group-hover:opacity-75 transition-opacity duration-500",
            currentSize.box
          )}
        />

        {/* Squircle Glassmorphic Container */}
        <div
          className={cn(
            "relative flex items-center justify-center bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/40",
            currentSize.box
          )}
        >
          {/* Royal 3D Crown SVG */}
          <svg
            className={cn("text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:rotate-3", currentSize.icon)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1s.4-1 1-1h12c.6 0 1 .4 1 1z" />
          </svg>
        </div>
      </div>

      {withText && (
        <div className="flex flex-col text-right">
          <span className={cn("font-black tracking-tight text-slate-900", currentSize.text)}>
            منصة تاج التعليمية
          </span>
          <span className="text-xs text-slate-500 font-medium -mt-0.5">
            المنظومة التعليمية الذكية
          </span>
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" title="العودة للصفحة الرئيسية" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl">
        {content}
      </Link>
    );
  }

  return content;
}
