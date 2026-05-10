import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wallet } from "@/types";
import { formatDate } from "@/lib/formatters";
import { 
  WalletCards, Banknote, Zap, BarChart2,
  Landmark, LifeBuoy, ArrowUpLeft, ArrowDownRight
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

interface WalletWidgetProps {
  wallet: Wallet | null;
  isTeacher: boolean;
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({ wallet, isTeacher }) => {
  return (
    <div className="space-y-6 lg:sticky lg:top-28">
      {/* 💰 Wallet Card — Ultra-Premium Glassmorphism */}
      <div className="group animate-fade-in-up-delay relative overflow-hidden rounded-[2rem] shadow-[0_20px_50px_rgba(79,70,229,0.15)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(79,70,229,0.25)] hover:-translate-y-1">
        {/* Background Blobs for Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-white/20 -z-10"></div>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-brand-400 opacity-20 blur-[80px] group-hover:opacity-40 transition-opacity duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-purple-400 opacity-20 blur-[60px] group-hover:opacity-40 transition-opacity duration-700"></div>

        {/* Moving Reflection Glint */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent -z-5 skew-x-12"></div>

        <div className="relative z-10 bg-white/30 backdrop-blur-2xl border border-white/60 p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <WalletCards className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-[0.15em]">
              رصيد المحفظة
            </h3>
          </div>
          
          <CurrencyDisplay 
            amount={wallet?.balance || 0} 
            size="xl" 
            className="mt-6 !justify-start text-slate-900 font-black tracking-tight text-4xl"
          />

          <div className="mt-8">
            {isTeacher ? (
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] rounded-2xl py-7 font-bold transition-all active:scale-[0.97]">
                <Link href="/dashboard/payout">
                  <span className="flex items-center gap-2">
                    طلب سحب الأرباح <Banknote className="w-5 h-5" />
                  </span>
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30_rgba(79,70,229,0.4)] rounded-2xl py-7 font-bold transition-all active:scale-[0.97]">
                <Link href="/dashboard/top-up">
                  <span className="flex items-center gap-2">
                    شحن المحفظة <Zap className="w-5 h-5 animate-pulse" />
                  </span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 📊 Transaction History — Refined Glass */}
      <Card className="animate-fade-in-up-delay-2 p-6 bg-white/40 backdrop-blur-xl border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] rounded-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap">
            <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <BarChart2 className="w-4 h-4" />
            </span>
            آخر العمليات المالية
          </h3>
          <Link 
            href="/dashboard/financial-record" 
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline bg-transparent p-0 transition-all duration-300 whitespace-nowrap"
          >
            عرض الكل
          </Link>
        </div>
        
        {wallet?.transactions?.data?.length === 0 ? (
          <EmptyState icon={Landmark} title="لا توجد عمليات سابقة" className="py-8 bg-slate-50/30 rounded-3xl border-dashed border-slate-100" />
        ) : (
          <ul className="space-y-1">
            {wallet?.transactions?.data?.slice(0, 3).map((tx) => {
              const isNegative = tx.type === "withdrawal" || parseFloat(String(tx.amount)) < 0;
              const absAmount = Math.abs(parseFloat(tx.amount)).toFixed(2);
              
              return (
                <Link key={tx.id} href="/dashboard/financial-record" className="block">
                  <li className="flex items-center gap-3 p-2.5 -mx-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group/item">
                    {/* Status Icon Container */}
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover/item:scale-110 ${
                      isNegative ? "bg-rose-100/50 text-rose-600" : "bg-emerald-100/50 text-emerald-600"
                    }`}>
                      {isNegative ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpLeft className="w-5 h-5" />
                      )}
                    </div>

                    {/* Text Section */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {isNegative ? "خصم حجز / سحب" : "إيداع / أرباح"}
                      </p>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        {formatDate(tx.created_at, "medium")}
                      </p>
                    </div>

                    {/* Amount Section (LTR Bidi Fix) */}
                    <div className="shrink-0 flex items-center justify-end gap-1 font-bold text-sm" dir="ltr">
                      <span className={`text-xs opacity-80 ${isNegative ? "text-rose-600" : "text-emerald-600"}`}>ر.س</span>
                      <span className={isNegative ? "text-rose-600" : "text-emerald-600"}>
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

      {/* 🛟 Support Center — High-Detail */}
      <Card className="animate-fade-in-up-delay-2 p-6 bg-gradient-to-br from-blue-50/50 to-white/50 backdrop-blur-xl border-blue-100/50 shadow-[0_10px_30px_rgba(59,130,246,0.05)] rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
        <div className="absolute -right-8 -bottom-8 text-blue-100/50 opacity-40 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000 ease-out pointer-events-none">
          <LifeBuoy size={140} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-[360deg] transition-transform duration-1000">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs leading-none">مركز المساعدة</h3>
              <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Support Hub</span>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-500 mb-5 leading-relaxed font-bold max-w-[90%]">
            هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت لحل جميع استفساراتك.
          </p>
          
          <Button asChild className="w-full bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-50 shadow-sm rounded-[1.25rem] font-black py-6 transition-all duration-300 active:scale-95 group/btn overflow-hidden relative">
            <Link href="/dashboard/support" className="flex items-center justify-center gap-2">
              <span className="relative z-10">فتح تذكرة دعم فني</span>
              <span className="w-2 h-2 rounded-full bg-blue-400 group-hover/btn:bg-white animate-pulse"></span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};
