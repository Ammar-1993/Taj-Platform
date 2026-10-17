import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WalletTransaction } from "@/types";
import { formatDate } from "@/lib/formatters";
import {
  BarChart2,
  Landmark,
  LifeBuoy,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowLeft,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import {
  getFriendlyTransactionDescription,
  isNegativeTransaction,
} from "@/lib/financialUtils";

interface WalletSecondaryCardsProps {
  transactions: WalletTransaction[];
  isCollapsed: boolean;
  roleContext?: "student_teacher" | "parent";
}

export const WalletSecondaryCards: React.FC<WalletSecondaryCardsProps> = ({
  transactions,
  isCollapsed,
  roleContext = "student_teacher",
}) => {
  return (
    <div className="space-y-6 flex flex-col justify-between">
      {/* 📊 Recent Transactions — Refined Glass */}
      <Card
        className={cn(
          "animate-fade-up-2 bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[2rem] hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all duration-500",
          isCollapsed ? "p-5 sm:p-6" : "p-4 sm:p-5"
        )}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2.5">
            <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-2xs">
              <BarChart2 className="w-4 h-4" />
            </span>
            آخر العمليات المالية
          </h3>
          <Link
            href="/dashboard/financial-record"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors group/link"
          >
            <span>عرض الكل</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover/link:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="لا توجد عمليات سابقة"
            className="py-7 bg-slate-50/40 rounded-2xl border-dashed border-slate-200/80 text-xs"
          />
        ) : (
          <ul className="space-y-2">
            {transactions.slice(0, 3).map((tx) => {
              const isNegative = isNegativeTransaction(tx);
              const absAmount = Math.abs(parseFloat(tx.amount)).toFixed(2);

              return (
                <Link
                  key={tx.id}
                  href="/dashboard/financial-record"
                  className="block"
                >
                  <li className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/40 hover:bg-white/90 border border-white/60 hover:border-indigo-100 shadow-2xs cursor-pointer transition-all duration-300 group/item hover:-translate-x-0.5">
                    {/* Status Icon */}
                    <div
                      className={cn(
                        "shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110",
                        isNegative
                          ? "bg-rose-50 text-rose-600 border border-rose-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}
                    >
                      {isNegative ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpLeft className="w-4 h-4" />
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover/item:text-indigo-600 transition-colors">
                        {getFriendlyTransactionDescription(
                          tx.description,
                          isNegative,
                          roleContext
                        )}
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5">
                        {formatDate(tx.created_at, "medium")}
                      </p>
                    </div>

                    {/* Amount */}
                    <div
                      className="shrink-0 flex items-center justify-end gap-1 font-black text-xs sm:text-sm"
                      dir="ltr"
                    >
                      <span
                        className={cn(
                          "text-[10px] font-bold opacity-80",
                          isNegative ? "text-rose-600" : "text-emerald-600"
                        )}
                      >
                        ر.س
                      </span>
                      <span
                        className={
                          isNegative ? "text-rose-600" : "text-emerald-600"
                        }
                      >
                        {isNegative ? `-${absAmount}` : `+${absAmount}`}
                      </span>
                    </div>
                  </li>
                </Link>
              );
            })}
          </ul>
        )}
      </Card>

      {/* 🛟 Help Center Card — Royal Luxury */}
      <Card
        className={cn(
          "animate-fade-up-3 bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-white/80 backdrop-blur-xl border border-blue-100/70 shadow-[0_10px_30px_rgba(59,130,246,0.05)] rounded-[2rem] relative overflow-hidden group hover:shadow-[0_15px_35px_rgba(59,130,246,0.1)] transition-all duration-500",
          isCollapsed ? "p-5 sm:p-6" : "p-4 sm:p-5"
        )}
      >
        <div className="absolute -right-8 -bottom-8 text-blue-200/40 opacity-30 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 ease-out pointer-events-none">
          <LifeBuoy size={140} strokeWidth={1} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:rotate-[360deg] transition-transform duration-1000">
              <LifeBuoy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-none">
                مركز المساعدة
              </h3>
              <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest">
                Support Hub
              </span>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-500 mb-4 sm:mb-5 leading-relaxed font-bold">
            هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت لحل جميع
            استفساراتك.
          </p>

          <Button
            asChild
            className="w-full bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-100 shadow-sm rounded-2xl font-black py-5 sm:py-6 transition-all duration-300 active:scale-95 group/btn overflow-hidden relative"
          >
            <Link
              href="/dashboard/support"
              className="flex items-center justify-center gap-2"
            >
              <span className="relative z-10 text-xs sm:text-sm">
                فتح تذكرة دعم فني
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500 group-hover/btn:bg-white animate-pulse"></span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};
