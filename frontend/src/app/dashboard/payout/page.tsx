"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { walletService } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { showApiError } from '@/hooks/useApiError';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { CircleDollarSign, SendHorizonal, Send, AlertTriangle, TrendingUp, Inbox, Landmark, Calendar, Building, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { formatDate, formatCurrency } from "@/lib/formatters";

export default function PayoutPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Fetch wallet info
    const { data: walletData, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet', user?.id],
        queryFn: () => walletService.getWallet(),
        enabled: !!user,
    });
    
    // Fetch payouts
    const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
        queryKey: ['payouts', user?.id],
        queryFn: () => walletService.getPayouts(),
        enabled: !!user,
    });

    const walletInfo = walletData?.data || null;
    const payouts = payoutsData?.data || [];
    const loading = walletLoading || payoutsLoading;

    // حالات نموذج السحب
    const [amount, setAmount] = useState<number | ''>('');
    const [bankName, setBankName] = useState('');
    const [iban, setIban] = useState('SA');
    const [successRedirect, setSuccessRedirect] = useState(false);

    const walletBalance = walletInfo ? Number(walletInfo.balance) : 0;

    // Mutation for payout request
    const payoutMutation = useMutation({
        mutationFn: (data: { amount: string; bank_name: string; iban: string }) =>
            walletService.requestPayout(data),
        onSuccess: (data) => {
            toast.success(data.message || 'تم إرسال طلب السحب.');
            setAmount('');
            setBankName('');
            setIban('SA');
            queryClient.invalidateQueries({ queryKey: ['wallet', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['payouts', user?.id] });
            setSuccessRedirect(true);
        },
        onError: (error: unknown) => {
            showApiError(error, 'تأكد من صحة البيانات وألا يقل المبلغ عن 50 ريال.');
        },
    });

    const handlePayoutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        payoutMutation.mutate({
            amount: String(amount),
            bank_name: bankName,
            iban: iban
        });
    };

    const renderStatusBadge = (status: string) => {
        return <StatusBadge status={status} />;
    };

    if (loading) return (
        <div className="p-8 text-center bg-gray-50/50 min-h-screen">
             <div className="max-w-7xl mx-auto space-y-8">
                 <Skeleton className="h-10 w-1/3" />
                 <Skeleton className="h-6 w-1/2" />
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
                 </div>
             </div>
        </div>
    );
    if (!user) return null;

    return (
        <div className="p-4 md:p-8">
            
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
                
                <PageHeader
                    title="سحب الأرباح والأرصدة"
                    subtitle="اطلب تحويل أرباحك إلى حسابك البنكي بكل سهولة وأمان."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: نموذج طلب السحب والرصيد المتاح */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* بطاقة الرصيد */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-8 rounded-[2.5rem] shadow-2xl text-white animate-fade-in-up-delay">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:blur-xl transition-all"></div>
                            <h3 className="text-indigo-100 text-sm font-bold flex items-center gap-2">
                                <CircleDollarSign className="w-5 h-5 text-indigo-200" />
                                الرصيد القابل للسحب
                            </h3>
                            <div className="mt-4 flex items-baseline gap-3 font-mono" dir="ltr">
                            <span className="font-mono text-5xl font-bold tracking-tighter shadow-sm">{formatCurrency(walletInfo?.balance)}</span>
                                <span className="text-indigo-200 font-bold font-sans text-xl uppercase">SAR</span>
                            </div>
                            <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40 w-2/3 animate-shimmer"></div>
                            </div>
                        </div>

                        {/* نموذج الطلب */}
                        <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-2 p-8">
                            <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <SendHorizonal className="w-5 h-5" />
                                </span>
                                تقديم طلب جديد
                            </h3>
                            


                            {successRedirect ? (
                                <RedirectCountdown 
                                    href="/dashboard"
                                    message="تم إرسال طلب السحب بنجاح! جاري تحويلك..."
                                    seconds={3}
                                    onCancel={() => setSuccessRedirect(false)}
                                />
                            ) : (
                            <form onSubmit={handlePayoutSubmit} className="space-y-6" noValidate>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">المبلغ المراد سحبه (ريال):</label>
                                    <Input 
                                        type="number" 
                                        min="50"
                                        step="0.01"
                                        max={String(walletInfo?.balance || '')}
                                        required 
                                        value={amount} 
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        placeholder="الحد الأدنى 50 ريال"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">اسم البنك:</label>
                                    <Select
                                        required
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                    >
                                        <option value="">-- اختر البنك --</option>
                                        <option value="البنك الأهلي السعودي">البنك الأهلي السعودي</option>
                                        <option value="مصرف الراجحي">مصرف الراجحي</option>
                                        <option value="بنك الرياض">بنك الرياض</option>
                                        <option value="بنك الإنماء">بنك الإنماء</option>
                                        <option value="بنك البلاد">بنك البلاد</option>
                                        <option value="أخرى">أخرى</option>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 mr-1">رقم الآيبان (IBAN):</label>
                                    <Input 
                                        type="text" 
                                        required 
                                        value={iban} 
                                        onChange={(e) => setIban(e.target.value.toUpperCase())}
                                        placeholder="SA00 0000 0000 ..."
                                        maxLength={24}
                                        dir="ltr"
                                        className="tracking-widest"
                                    />
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    disabled={
                                        payoutMutation.isPending ||
                                        (amount !== '' && amount > walletBalance) ||
                                        walletBalance < 50
                                    }
                                    className="w-full h-14 bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:shadow-[0_12px_40px_rgba(16,185,129,0.3)] text-lg rounded-taj-xl"
                                >
                                    {payoutMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            جاري المعالجة...
                                        </>
                                    ) : (
                                        <>
                                            <span>إرسال طلب السحب</span>
                                            <Send className="w-5 h-5 mr-2" />
                                        </>
                                    )}
                                </Button>
                                {walletBalance < 50 && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] text-rose-600 font-bold text-center flex items-center gap-2 justify-center">
                                         <AlertTriangle className="w-3.5 h-3.5" />
                                         <span>رصيدك أقل من الحد الأدنى (50 ريال)</span>
                                    </div>
                                )}
                            </form>
                            )}
                        </Card>
                    </div>

                    {/* سجل طلبات السحب المحدث (Card Collection) */}
                    <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[3rem] border-white/50 h-fit animate-fade-in-up-delay-3 p-8 md:p-10">
                        <h3 className="font-bold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
                             <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <TrendingUp className="w-5 h-5" />
                             </span>
                             سجل المعاملات المالية
                        </h3>
                        
                        {payouts.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                title="لم تقدم أي طلب سحب حتى الآن."
                                subtitle="سيتم عرض جميع طلباتك وحالتها المالية هنا فور إرسالها."
                            />
                        ) : (
                            <div className="space-y-6">
                                {payouts.map((payout) => (
                                    <div key={payout.id} className="group relative overflow-hidden bg-white/50 hover:bg-white transition-all duration-300 border-2 border-gray-50 rounded-[2rem] p-7 shadow-sm hover:shadow-xl hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                    <Landmark className="w-7 h-7" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">طلب سحب #{payout.id}</h4>
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-0.5 rounded-full font-bold uppercase tracking-widest">Transaction</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                        <span className="flex items-center gap-1.5 italic"><Calendar className="w-3.5 h-3.5" /> {formatDate(payout.created_at, "medium")}</span>
                                                        <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {payout.bank_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-100 mt-2 md:mt-0">
                                                <div className="text-2xl font-bold font-mono text-emerald-600 flex items-baseline gap-1.5" dir="ltr">
                                                    <span>{formatCurrency(payout.amount, 'code')}</span>
                                                </div>
                                                <div>{renderStatusBadge(payout.status)}</div>
                                            </div>
                                        </div>
                                        <div className={`absolute bottom-0 left-0 h-1.5 w-full rounded-full opacity-20 ${
                                            payout.status === 'pending' ? 'bg-amber-400 animate-pulse' : payout.status === 'approved' ? 'bg-emerald-400' : 'bg-rose-400'
                                        }`}></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    );
}

