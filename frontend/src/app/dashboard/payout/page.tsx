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
import EmptyState from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/formatters";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";

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
        },
        onError: (error: unknown) => {
            showApiError(error, 'تأكد من صحة البيانات وألا يقل المبلغ عن 50 ر.س.');
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
            
            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                
                <PageHeader
                    title="سحب الأرباح والأرصدة"
                    subtitle="اطلب تحويل أرباحك إلى حسابك البنكي بكل سهولة وأمان."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                    icon={<CircleDollarSign />}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: نموذج طلب السحب والرصيد المتاح */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* 💰 Withdrawable Balance Card — Premium Glassmorphism */}
                        <div className="group animate-fade-in-up-delay relative overflow-hidden rounded-taj-xl shadow-glass transition-all duration-300 hover:shadow-lg">
                            {/* Background Blobs for Glass Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 -z-10"></div>
                            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-400 opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500"></div>
                            <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-purple-400 opacity-20 blur-2xl"></div>

                            <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/60 p-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
                                        <CircleDollarSign className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider">
                                        الرصيد القابل للسحب
                                    </h3>
                                </div>
                                
                                <CurrencyDisplay 
                                    amount={walletInfo?.balance || 0} 
                                    size="xl" 
                                    className="mt-4 !justify-start text-slate-900 font-black tracking-tight"
                                />

                                <div className="mt-8 flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-white/60 shadow-inner">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                        الحد الأدنى للسحب 50 ريال
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* نموذج الطلب */}
                        <Card className="bg-white/60 backdrop-blur-lg rounded-taj-xl border-white/60 shadow-sm animate-fade-in-up-delay-2 p-8">
                            <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <SendHorizonal className="w-5 h-5" />
                                </span>
                                تقديم طلب جديد
                            </h3>
                            


                            <form onSubmit={handlePayoutSubmit} className="space-y-6" noValidate>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 mr-1">المبلغ المراد سحبه (ر.س):</label>
                                    <Input 
                                        type="number" 
                                        min="50"
                                        step="0.01"
                                        max={String(walletInfo?.balance || '')}
                                        required 
                                        value={amount} 
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        placeholder="الحد الأدنى 50 ر.س"
                                        className="bg-white/50 border-white/60 focus:bg-white transition-all rounded-xl h-12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 mr-1">اسم البنك:</label>
                                    <Select
                                        required
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="bg-white/50 border-white/60 focus:bg-white transition-all rounded-xl h-12"
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
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 mr-1">رقم الآيبان (IBAN):</label>
                                    <Input 
                                        type="text" 
                                        required 
                                        value={iban} 
                                        onChange={(e) => setIban(e.target.value.toUpperCase())}
                                        placeholder="SA00 0000 0000 ..."
                                        maxLength={24}
                                        dir="ltr"
                                        className="tracking-widest bg-white/50 border-white/60 focus:bg-white transition-all rounded-xl h-12"
                                    />
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    disabled={
                                        payoutMutation.isPending ||
                                        (amount !== '' && amount > walletBalance) ||
                                        walletBalance < 50
                                    }
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-xl font-bold text-base transition-all active:scale-[0.98]"
                                >
                                    {payoutMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin ml-2" />
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
                                         <span>رصيدك أقل من الحد الأدنى (50 ر.س)</span>
                                    </div>
                                )}
                            </form>
                        </Card>
                    </div>

                    {/* سجل طلبات السحب المحدث (Card Collection) */}
                    <Card className="lg:col-span-2 bg-white/60 backdrop-blur-lg rounded-taj-xl border-white/60 shadow-sm h-fit animate-fade-in-up-delay-3 p-8 md:p-10">
                        <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-3">
                             <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <TrendingUp className="w-5 h-5" />
                             </span>
                             سجل المعاملات المالية
                        </h3>
                        
                        {payouts.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                title="لم تقدم أي طلب سحب حتى الآن."
                                subtitle="سيتم عرض جميع طلباتك وحالتها المالية هنا فور إرسالها."
                                className="bg-slate-50/50 rounded-3xl border-dashed"
                            />
                        ) : (
                            <div className="space-y-6">
                                {payouts.map((payout) => (
                                    <div key={payout.id} className="group relative overflow-hidden bg-white/50 hover:bg-white transition-all duration-500 border border-white shadow-sm rounded-3xl p-7 hover:shadow-xl hover:-translate-y-1">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                    <Landmark className="w-7 h-7" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">طلب سحب #{payout.id}</h4>
                                                        <span className="text-[9px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">Transaction</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(payout.created_at, "medium")}</span>
                                                        <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {payout.bank_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-slate-100 mt-2 md:mt-0">
                                                <CurrencyDisplay 
                                                    amount={payout.amount} 
                                                    size="lg" 
                                                    className="text-slate-900 font-black"
                                                />
                                                <div>{renderStatusBadge(payout.status)}</div>
                                            </div>
                                        </div>
                                        <div className={`absolute bottom-0 left-0 h-1.5 w-full rounded-full opacity-30 ${
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
