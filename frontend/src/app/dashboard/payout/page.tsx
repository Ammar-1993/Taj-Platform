"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageHeader from '@/components/ui/PageHeader';
import DecorativeBackground from '@/components/ui/DecorativeBackground';
import StatusBadge from '@/components/ui/StatusBadge';
import { showApiError } from '@/hooks/useApiError';
import { ApiResponse, PayoutRequest, Wallet } from '@/types';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { CircleDollarSign, SendHorizonal, Send, AlertTriangle, TrendingUp, Inbox, Landmark, Calendar, Building, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function PayoutPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [walletInfo, setWalletInfo] = useState<Wallet | null>(null);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // حالات نموذج السحب
    const [amount, setAmount] = useState<number | ''>('');
    const [bankName, setBankName] = useState('');
    const [iban, setIban] = useState('SA');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const walletBalance = walletInfo ? Number(walletInfo.balance) : 0;

    // جلب الرصيد المباشر وسجل الطلبات عند فتح الصفحة
    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [walletRes, payoutsRes] = await Promise.all([
                api.get<ApiResponse<Wallet>>('/wallet'),
                api.get<ApiResponse<PayoutRequest[]>>('/wallet/payouts')
            ]);
            setWalletInfo(walletRes.data.data);
            setPayouts(payoutsRes.data.data || []);
        } catch (error) {
            console.error("خطأ في جلب البيانات المالية", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await api.post<ApiResponse<unknown>>('/wallet/payouts', {
                amount: Number(amount),
                bank_name: bankName,
                iban: iban
            });
            
            toast.success(res.data.message || 'تم إرسال طلب السحب.');
            setAmount('');
            setBankName('');
            setIban('SA');
            
            // تحديث الرصيد والجدول فوراً بدون الحاجة لتحديث الصفحة
            fetchData(); 
            
            // العودة للوحة بعد 3 ثواني
            setTimeout(() => router.push('/dashboard'), 3000);        } catch (error: unknown) {
            showApiError(error, 'تأكد من صحة البيانات وألا يقل المبلغ عن 50 ريال.');
        } finally {
            setIsSubmitting(false);
        }
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
        <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8">
            <DecorativeBackground />

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
                        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-green-800 p-8 rounded-[2.5rem] shadow-2xl text-white animate-fade-in-up-delay">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:blur-xl transition-all"></div>
                            <h3 className="text-emerald-100 text-sm font-black flex items-center gap-2">
                                <CircleDollarSign className="w-5 h-5 text-emerald-200" />
                                الرصيد القابل للسحب
                            </h3>
                            <div className="mt-4 flex items-baseline gap-3">
                                <span className="text-5xl font-black tracking-tighter shadow-sm">{walletInfo?.balance || '0.00'}</span>
                                <span className="text-emerald-200 font-bold text-xl uppercase">SAR</span>
                            </div>
                            <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/40 w-2/3 animate-shimmer"></div>
                            </div>
                        </div>

                        {/* نموذج الطلب */}
                        <Card className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border-white/50 animate-fade-in-up-delay-2 p-8">
                            <h3 className="font-black text-xl text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <SendHorizonal className="w-5 h-5" />
                                </span>
                                تقديم طلب جديد
                            </h3>
                            


                            <form onSubmit={handlePayoutSubmit} className="space-y-6">
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
                                    <div className="relative">
                                        <select
                                            required
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="w-full bg-gray-50/50 border-2 border-gray-100 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all duration-200 text-sm font-bold text-gray-700 appearance-none cursor-pointer"
                                        >
                                            <option value="">-- اختر البنك --</option>
                                            <option value="البنك الأهلي السعودي">البنك الأهلي السعودي</option>
                                            <option value="مصرف الراجحي">مصرف الراجحي</option>
                                            <option value="بنك الرياض">بنك الرياض</option>
                                            <option value="بنك الإنماء">بنك الإنماء</option>
                                            <option value="بنك البلاد">بنك البلاد</option>
                                            <option value="أخرى">أخرى</option>
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                                    </div>
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
                                        isSubmitting ||
                                        (amount !== '' && amount > walletBalance) ||
                                        walletBalance < 50
                                    }
                                    className="w-full h-14 bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:shadow-[0_12px_40px_rgba(16,185,129,0.3)] text-lg rounded-[1.5rem]"
                                >
                                    {isSubmitting ? (
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
                        </Card>
                    </div>

                    {/* سجل طلبات السحب المحدث (Card Collection) */}
                    <Card className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-[3rem] border-white/50 h-fit animate-fade-in-up-delay-3 p-8 md:p-10">
                        <h3 className="font-extrabold text-2xl text-gray-900 mb-8 flex items-center gap-3 underline underline-offset-8 decoration-indigo-100">
                             <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <TrendingUp className="w-5 h-5" />
                             </span>
                             سجل المعاملات المالية
                        </h3>
                        
                        {payouts.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 text-gray-400 font-black flex flex-col items-center gap-4">
                                <Inbox className="w-16 h-16 text-gray-300" />
                                <span>لم تقم بتقديم أي طلب سحب حتى الآن.</span>
                                <p className="text-xs font-bold leading-relaxed">سيتم عرض جميع طلباتك وحالتها المالية هنا فور إرسالها.</p>
                            </div>
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
                                                        <h4 className="font-black text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">طلب سحب #{payout.id}</h4>
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-0.5 rounded-full font-black uppercase tracking-widest">Transaction</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                        <span className="flex items-center gap-1.5 italic"><Calendar className="w-3.5 h-3.5" /> {new Date(payout.created_at).toLocaleDateString('ar-SA')}</span>
                                                        <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> {payout.bank_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-100 mt-2 md:mt-0">
                                                <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1.5">
                                                    <span>{payout.amount}</span>
                                                    <span className="text-xs font-bold text-emerald-400">SAR</span>
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

