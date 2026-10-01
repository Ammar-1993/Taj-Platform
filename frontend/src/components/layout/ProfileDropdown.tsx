"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut } from "lucide-react";

interface ProfileDropdownProps {
  userName: string;
  imageUrl: string | null;
  settingsPath: string;
  onLogout: () => void;
}

export default function ProfileDropdown({
  userName,
  imageUrl,
  settingsPath,
  onLogout,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset imgError if imageUrl changes
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // Resolve avatar URL — handles relative paths from the backend
  const resolvedImageUrl = (() => {
    if (!imageUrl || imgError) return null;
    const trimmed = typeof imageUrl === "string" ? imageUrl.trim() : "";
    if (
      !trimmed ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === "[object Object]"
    ) {
      return null;
    }
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
      "http://localhost:8000";
    return `${baseUrl}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  })();

  const firstLetter = userName ? userName.trim().charAt(0) : "؟";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ─── Avatar Trigger ─── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 w-10 rounded-full cursor-pointer overflow-hidden border-2 border-white/40 hover:border-white/80 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-transparent relative bg-brand-700/60"
        aria-label="فتح قائمة الملف الشخصي"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {resolvedImageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedImageUrl}
            alt=""
            className="object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm tracking-wide select-none shadow-inner">
            {firstLetter}
          </div>
        )}
      </button>

      {/* ─── Dropdown Menu ─── */}
      {isOpen && (
        <div
          className="absolute right-0 md:left-0 md:right-auto top-full mt-2 bg-white rounded-xl shadow-xl border border-surface-muted py-1 min-w-[210px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right md:origin-top-left"
          dir="rtl"
          role="menu"
        >
          <div className="px-4 py-2 border-b border-surface-subtle mb-1">
            <p className="text-[10px] font-bold text-text-muted mb-0.5">الحساب</p>
            <p className="text-sm font-bold text-text-primary truncate">{userName}</p>
          </div>

          {/* Account Settings */}
          <Link
            href={settingsPath}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full transition-colors text-text-secondary font-bold hover:text-brand-600 hover:bg-brand-50/50"
            role="menuitem"
          >
            <User className="w-4 h-4 shrink-0" />
            <span>إعدادات الحساب</span>
          </Link>

          {/* Divider */}
          <div className="border-b border-surface-subtle mx-2" />

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full transition-colors text-error-text font-bold hover:bg-error-bg/50"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 shrink-0 text-error-text" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
