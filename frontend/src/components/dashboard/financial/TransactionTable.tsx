"use client";

import { WalletTransaction, PaginatedResponse } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/formatters";
import { PaginationControls } from "@/components/ui/PaginationControls";
import EmptyState from "@/components/ui/EmptyState";
import { History } from "lucide-react";

interface TransactionTableProps {
  transactions: PaginatedResponse<WalletTransaction>;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function TransactionTable({ 
  transactions, 
  onPageChange,
  isLoading 
}: TransactionTableProps) {
  
  if (!isLoading && (!transactions.data || transactions.data.length === 0)) {
    return (
      <EmptyState
        icon={History}
        title="لا توجد عمليات مالية بعد"
        subtitle="عندما تقوم بأي عمليات شحن أو دفع أو استلام أرباح، ستظهر هنا."
      />
    );
  }

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="border-b border-slate-50 bg-slate-50/50">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          سجل العمليات المالية
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">النوع</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                  </tr>
                ))
              ) : (
                transactions.data.map((tx) => {
                  const isNegative = tx.type === 'withdrawal' || tx.type === 'payout' || parseFloat(String(tx.amount)) < 0;
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 align-middle">
                        <div className="flex items-center h-full">
                          {formatDate(tx.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center h-full">
                          <StatusBadge status={tx.type} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium align-middle">
                        <div className="flex items-center h-full">
                          {tx.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <CurrencyDisplay 
                          amount={isNegative ? -Math.abs(parseFloat(tx.amount)) : Math.abs(parseFloat(tx.amount))} 
                          showSign 
                          colorStatus 
                          size="md"
                          className="font-bold"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {transactions.last_page > 1 && (
          <div className="p-4 border-t border-slate-100">
            <PaginationControls
              page={transactions.current_page}
              totalPages={transactions.last_page}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
