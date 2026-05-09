import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wallet } from "@/types";
import { formatDate } from "@/lib/formatters";
import { 
  WalletCards, Banknote, Zap, BarChart2,
  Landmark, LifeBuoy
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
      {/* 💰 Wallet Card — Premium Glassmorphism */}
      <div className="group animate-fade-in-up-delay relative overflow-hidden rounded-taj-xl shadow-glass transition-all duration-300 hover:shadow-lg">
        {/* Background Blobs for Glass Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 -z-10"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-400 opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500"></div>
        <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-purple-400 opacity-20 blur-2xl"></div>

        <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/60 p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
              <WalletCards className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider">
              رصيد المحفظة
            </h3>
          </div>
          
          <CurrencyDisplay 
            amount={wallet?.balance || 0} 
            size="xl" 
            className="mt-4 !justify-start text-slate-900 font-black tracking-tight"
          />

          {isTeacher ? (
            <div className="mt-6">
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl py-6">
                <Link href="/dashboard/payout">
                  طلب سحب الأرباح <Banknote className="w-4 h-4 mr-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 rounded-xl py-6">
                <Link href="/dashboard/top-up">
                  شحن المحفظة <Zap className="w-4 h-4 mr-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 📊 Transaction History */}
      <Card className="animate-fade-in-up-delay-2 p-6 bg-white/60 backdrop-blur-lg border-white/60 shadow-sm rounded-taj-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <BarChart2 className="w-5 h-5" />
            </span>
            آخر العمليات المالية
          </h3>
          <Link 
            href="/dashboard/financial-record" 
            className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
          >
            عرض الكل
          </Link>
        </div>
        {wallet?.transactions?.data?.length === 0 ? (
          <EmptyState icon={Landmark} title="لا توجد عمليات سابقة" className="py-8 bg-slate-50/50 rounded-2xl border-dashed" />
        ) : (
          <ul className="space-y-3">
            {wallet?.transactions?.data?.slice(0, 3).map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between items-center text-sm p-3.5 rounded-2xl bg-white/50 hover:bg-white transition-all duration-300 group border border-transparent hover:border-indigo-100 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-1.5 h-8 rounded-full ${tx.type === "withdrawal" || parseFloat(String(tx.amount)) < 0 ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]" : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"}`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {tx.type === "withdrawal" || parseFloat(String(tx.amount)) < 0
                        ? "خصم حجز / سحب"
                        : "إيداع / أرباح"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      {formatDate(tx.created_at, "medium")}
                    </p>
                  </div>
                </div>
                <CurrencyDisplay 
                  amount={tx.amount} 
                  showSign 
                  colorStatus 
                  size="md"
                  className="font-bold"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 🛟 Support Center */}
      <Card className="animate-fade-in-up-delay-2 p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm rounded-taj-xl relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 text-blue-100 opacity-40 group-hover:scale-110 transition-transform duration-500">
          <LifeBuoy size={100} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
          <h3 className="font-bold text-slate-800 mb-2.5 flex items-center gap-2">
            <span className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <LifeBuoy className="w-5 h-5" />
            </span>
            مركز المساعدة
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed font-medium">
            هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت.
          </p>
          <Button asChild className="w-full bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 shadow-sm rounded-xl font-bold py-5">
            <Link href="/dashboard/support">
              فتح تذكرة دعم فني
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};
