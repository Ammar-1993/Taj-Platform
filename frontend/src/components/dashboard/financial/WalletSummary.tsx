"use client";

import { useUserRole } from "@/hooks";
import { Button } from "@/components/ui/Button";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { PlusCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";

interface WalletSummaryProps {
  balance: string;
}

export function WalletSummary({ balance }: WalletSummaryProps) {
  const { isTeacher, isParent, isStudent } = useUserRole();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex items-center justify-between border border-slate-100">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-slate-500 font-medium">الرصيد المتاح</p>
        <div className="text-2xl font-bold text-slate-900">
          <CurrencyDisplay amount={balance} />
        </div>
      </div>

      <div className="flex gap-3">
        {(isParent || isStudent) && (
          <Link href="/dashboard/top-up">
            <Button className="flex items-center gap-2 rounded-lg font-bold h-11 px-6 shadow-sm">
              <PlusCircle size={18} />
              <span>شحن المحفظة</span>
            </Button>
          </Link>
        )}

        {isTeacher && (
          <Link href="/dashboard/payout">
            <Button variant="outline" className="flex items-center gap-2 rounded-lg font-bold h-11 px-6 border-slate-200 hover:bg-slate-50">
              <ArrowUpCircle size={18} />
              <span>سحب الأرباح</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
