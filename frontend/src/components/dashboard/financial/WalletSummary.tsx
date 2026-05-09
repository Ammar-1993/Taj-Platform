"use client";

import { useUserRole } from "@/hooks";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Wallet, PlusCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";

interface WalletSummaryProps {
  balance: string;
}

export function WalletSummary({ balance }: WalletSummaryProps) {
  const { isTeacher, isParent, isStudent } = useUserRole();

  return (
    <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm overflow-hidden relative">
      <div className="absolute -right-6 -top-6 text-indigo-100 opacity-50">
        <Wallet size={120} strokeWidth={1} />
      </div>
      
      <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="mb-6 md:mb-0 text-center md:text-right">
          <p className="text-sm font-medium text-indigo-600 mb-1">الرصيد المتاح</p>
          <div className="text-4xl md:text-5xl font-bold text-slate-900">
            <CurrencyDisplay amount={balance} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {(isParent || isStudent) && (
            <Link href="/dashboard/top-up">
              <Button size="lg" className="flex items-center gap-2">
                <PlusCircle size={20} />
                <span>شحن المحفظة</span>
              </Button>
            </Link>
          )}

          {isTeacher && (
            <Link href="/dashboard/payout">
              <Button size="lg" variant="outline" className="flex items-center gap-2">
                <ArrowUpCircle size={20} />
                <span>سحب الأرباح</span>
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
