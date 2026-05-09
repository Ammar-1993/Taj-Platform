"use client";

import { useState } from "react";
import { useWallet } from "@/hooks";
import PageHeader from "@/components/ui/PageHeader";
import { WalletSummary } from "@/components/dashboard/financial/WalletSummary";
import { TransactionTable } from "@/components/dashboard/financial/TransactionTable";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Wallet } from "lucide-react";

export default function FinancialRecordPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useWallet(page);

  const walletData = data?.data;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <PageHeader
        title="السجل المالي"
        subtitle="تتبع جميع حركات محفظتك المالية، من شحن رصيد وأرباح وسحوبات."
        icon={<Wallet />}
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message="عفواً، حدث خطأ أثناء جلب بيانات المحفظة. يرجى المحاولة مرة أخرى." />
        </div>
      )}

      <WalletSummary balance={walletData?.balance || "0.00"} />

      <TransactionTable 
        transactions={walletData?.transactions || { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0 }}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
