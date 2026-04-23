import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wallet } from "@/types";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { 
  WalletCards, CalendarDays, Banknote, Zap, BarChart2,
  Landmark, LifeBuoy
} from "lucide-react";

interface WalletWidgetProps {
  wallet: Wallet | null;
  isTeacher: boolean;
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({ wallet, isTeacher }) => {
  return (
    <div className="space-y-6 sticky top-28">
      {/* 💰 Wallet Card — Premium Gradient */}
      <div className="animate-fade-in-up-delay relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 rounded-3xl shadow-xl text-white">
        {/* Decorative Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-300 blur-2xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <WalletCards className="w-6 h-6 text-purple-200" />
            <h3 className="text-purple-200 text-sm font-bold">
              رصيد المحفظة
            </h3>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight">
              {wallet?.balance || "0.00"}
            </span>
            <span className="text-purple-200 text-base sm:text-lg font-medium">
              ريال
            </span>
          </div>

          {isTeacher ? (
            <div className="mt-6 flex gap-2">
              <Button asChild variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl h-10 px-2 py-0 text-xs">
                <Link href="/dashboard/schedule">
                  إدارة الجدول <CalendarDays className="w-3.5 h-3.5 mr-1" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="flex-1 bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl h-10 px-2 py-0 text-xs">
                <Link href="/dashboard/payout">
                  طلب سحب <Banknote className="w-3.5 h-3.5 mr-1" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6">
              <Button asChild variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-xl">
                <Link href="/dashboard/top-up">
                  شحن المحفظة <Zap className="w-4 h-4 mr-2" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 📊 Transaction History */}
      <Card variant="glass" className="animate-fade-in-up-delay-2 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </span>
          آخر العمليات المالية
        </h3>
        {wallet?.transactions?.data?.length === 0 ? (
          <div className="text-center py-6">
            <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">لا توجد عمليات سابقة</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {wallet?.transactions?.data?.slice(0, 5).map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between items-center text-sm p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-1.5 h-8 rounded-full ${tx.type === "withdrawal" ? "bg-red-500" : "bg-emerald-500"}`}
                  ></div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {tx.type === "withdrawal"
                        ? "خصم حجز/تجميد"
                        : "إيداع/أرباح"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(tx.created_at, "short")}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-base ${tx.type === "withdrawal" ? "text-red-500" : "text-emerald-500"}`}
                >
                  {tx.type === "withdrawal" ? "-" : "+"}
                  {formatCurrency(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 🛟 Support Center */}
      <Card variant="glass" className="animate-fade-in-up-delay-2 p-6">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <LifeBuoy className="w-4 h-4" />
          </span>
          مركز المساعدة
        </h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          هل تواجه مشكلة؟ فريق الدعم متاح لمساعدتك في أي وقت.
        </p>
        <Button asChild className="w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl">
          <Link href="/dashboard/support">
            فتح تذكرة دعم فني
          </Link>
        </Button>
      </Card>
    </div>
  );
};
