"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
    if (imageUrl.startsWith("http")) return imageUrl;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
      "http://localhost:8000";
    return `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  })();

  const firstLetter = userName ? userName.charAt(0) : "؟";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ─── Avatar Trigger ─── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 w-10 rounded-full cursor-pointer overflow-hidden border-2 border-white/30 hover:border-white/60 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
        aria-label="فتح قائمة الملف الشخصي"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {resolvedImageUrl ? (
          <Image
            src={resolvedImageUrl}
            alt={userName}
            width={40}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-semibold text-base">
            {firstLetter}
          </div>
        )}
      </button>

      {/* ─── Dropdown Menu ─── */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[200px] z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right"
          dir="rtl"
          role="menu"
        >
          {/* Account Settings */}
          <Link
            href={settingsPath}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full transition-colors text-slate-600 font-medium hover:text-blue-600 hover:bg-slate-50 text-right"
            role="menuitem"
          >
            <User className="w-4 h-4 shrink-0" />
            <span>إعدادات الحساب</span>
          </Link>

          {/* Divider */}
          <div className="border-b border-gray-100 mx-2" />

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer w-full transition-colors text-slate-600 font-medium hover:text-blue-600 hover:bg-slate-50 text-right"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      )}
    </div>
  );
}
