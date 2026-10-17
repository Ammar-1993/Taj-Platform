import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Wallet } from "@/types";
import { WalletCards, Banknote, Zap } from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { WalletSecondaryCards } from "./WalletSecondaryCards";

interface WalletWidgetProps {
  wallet: Wallet | null;
  isTeacher: boolean;
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({
  wallet,
  isTeacher,
}) => {
  const { isCollapsed } = useSidebar();
  const transactions = wallet?.transactions?.data || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 lg:space-y-6 lg:gap-0 lg:sticky lg:top-24">
      {/* 💰 Wallet Card — Ultra-Premium Glassmorphism */}
      <div className="animate-fade-up-1 group relative overflow-hidden rounded-[2rem] border border-white/80 dark:border-white/20 bg-white/40 backdrop-blur-2xl shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(79,70,229,0.22)] hover:-translate-y-1">
        {/* Background Blobs for Ambient Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white/30 -z-10 pointer-events-none"></div>
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-brand-400 opacity-20 blur-[75px] group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-purple-400 opacity-20 blur-[65px] group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>

        {/* Moving Reflection Glint */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/35 to-transparent -z-5 skew-x-12 pointer-events-none"></div>

        <div
          className={cn(
            "relative z-10 transition-all duration-300",
            isCollapsed ? "p-5 sm:p-6 xl:p-8" : "p-4 sm:p-5 xl:p-6"
          )}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between gap-2.5 mb-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/90 border border-indigo-100/80 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <WalletCards className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-slate-800 text-xs sm:text-sm font-black tracking-tight truncate">
                  رصيد المحفظة
                </h3>
                <span className="text-[10px] text-slate-400 font-bold block truncate">
                  {isTeacher
                    ? "محفظة أرباح المعلم"
                    : "المحفظة الإلكترونية للطالب"}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              نشطة
            </span>
          </div>

          {/* Primary Balance */}
          <div className="mt-5">
            <CurrencyDisplay
              amount={wallet?.balance || 0}
              size="xl"
              className={cn(
                "!justify-start text-slate-900 font-black tracking-tight",
                isCollapsed
                  ? "text-3xl sm:text-4xl"
                  : "text-2xl sm:text-3xl xl:text-4xl"
              )}
            />
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {isTeacher
                ? "الرصيد المتاح لطلب السحب الفوري"
                : "الرصيد المتاح لحجز الحصص الجديدة"}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-5 sm:mt-6">
            {isTeacher ? (
              <Button
                asChild
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.32)] hover:shadow-[0_16px_32px_rgba(79,70,229,0.42)] rounded-2xl py-5 sm:py-6 font-black transition-all duration-300 active:scale-[0.98] group/btn overflow-hidden relative"
              >
                <Link
                  href="/dashboard/payout"
                  className="flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>طلب سحب الأرباح</span>
                  <Banknote className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.32)] hover:shadow-[0_16px_32px_rgba(79,70,229,0.42)] rounded-2xl py-5 sm:py-6 font-black transition-all duration-300 active:scale-[0.98] group/btn overflow-hidden relative"
              >
                <Link
                  href="/dashboard/top-up"
                  className="flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>شحن المحفظة</span>
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse group-hover/btn:rotate-12 transition-transform duration-300" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Second Column on Tablet / Stacked below Wallet on Desktop */}
      <WalletSecondaryCards
        transactions={transactions}
        isCollapsed={isCollapsed}
        roleContext="student_teacher"
      />
    </div>
  );
};
