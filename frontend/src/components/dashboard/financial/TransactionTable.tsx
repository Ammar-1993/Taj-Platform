"use client";

import { WalletTransaction, PaginatedResponse } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/formatters";
import { PaginationControls } from "@/components/ui/PaginationControls";
import EmptyState from "@/components/ui/EmptyState";
import { 
  History, ArrowUpLeft, ArrowDownRight 
} from "lucide-react";

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
  
  // Quick mapping for standardizing backend types to Arabic keys for StatusBadge
  const typeMap: Record<string, string> = {
    'deposit': 'wallet_topup',
    'payout': 'withdrawal',
    'earnings': 'class_earnings',
    'class_earnings': 'class_earnings',
    'wallet_topup': 'wallet_topup',
    'withdrawal': 'withdrawal',
    'refund': 'refund'
  };

  /**
   * Splits a description if it contains a hash or ID.
   * Returns { main: string, sub?: string }
   */
  const parseDescription = (desc: string) => {
    // Regex to detect UUIDs or long technical IDs (e.g. from Moyasar)
    const idRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32,}|pay_[a-zA-Z0-9]+)/i;
    const match = desc.match(idRegex);
    
    if (match) {
      const main = desc.replace(match[0], '').replace(/:\s*$/, '').trim() || "عملية مالية";
      return { main, sub: match[0] };
    }
    
    return { main: desc };
  };

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
    <Card className="shadow-sm border-slate-200 overflow-hidden rounded-xl h-full flex flex-col">
      <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-4 md:p-6">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          سجل العمليات المالية
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
        
        {/* ─── Mobile: Card List (md:hidden) ─────────────────────────────────── */}
        <div className="md:hidden divide-y divide-slate-100 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                </div>
                <div className="h-5 bg-slate-100 rounded w-16"></div>
              </div>
            ))
          ) : (
            transactions.data.map((tx) => {
              const isNegative = tx.type === 'withdrawal' || tx.type === 'payout' || parseFloat(String(tx.amount)) < 0;
              const { main, sub } = parseDescription(tx.description);
              const absAmount = Math.abs(parseFloat(tx.amount)).toFixed(2);
              const displayType = typeMap[tx.type] || tx.type;

              return (
                <div key={tx.id} className="p-4 flex items-center gap-3 active:bg-slate-50 transition-colors">
                  {/* Directional Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isNegative ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {isNegative ? <ArrowDownRight size={18} /> : <ArrowUpLeft size={18} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-bold text-slate-800 truncate">{main}</p>
                      {/* Amount LTR Fix */}
                      <div className={`shrink-0 flex items-center gap-0.5 font-bold text-sm ${
                        isNegative ? "text-rose-600" : "text-emerald-600"
                      }`} dir="ltr">
                        <span className="text-[10px] opacity-70">ر.س</span>
                        <span>{isNegative ? `-${absAmount}` : `+${absAmount}`}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={displayType} />
                      <span className="text-[10px] text-slate-400 font-medium">{formatDate(tx.created_at, "medium")}</span>
                    </div>
                    {sub && (
                      <p className="text-[9px] text-slate-300 font-mono mt-1 truncate">ID: {sub}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── Desktop: Standard Table (hidden md:block) ────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 text-right">التاريخ</th>
                <th className="px-6 py-4 text-right">النوع</th>
                <th className="px-6 py-4 text-right">الوصف</th>
                <th className="px-6 py-4 text-right">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
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
                  const { main, sub } = parseDescription(tx.description);
                  const displayType = typeMap[tx.type] || tx.type;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600 align-middle">
                        <div className="flex items-center h-full">
                          {formatDate(tx.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center h-full">
                          <StatusBadge status={displayType} />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col justify-center min-w-0">
                          <span className="font-medium text-slate-800 text-sm line-clamp-1">{main}</span>
                          {sub && (
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]" title={sub}>
                              ID: {sub}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-end gap-1 font-bold text-sm" dir="ltr">
                          <span className={`text-xs opacity-80 ${isNegative ? "text-rose-600" : "text-emerald-600"}`}>ر.س</span>
                          <span className={isNegative ? "text-rose-600" : "text-emerald-600"}>
                            {isNegative ? `-${Math.abs(parseFloat(tx.amount)).toFixed(2)}` : `+${Math.abs(parseFloat(tx.amount)).toFixed(2)}`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {transactions.last_page > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/30">
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
