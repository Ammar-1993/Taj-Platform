"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/api';
import { useWallet } from '@/hooks';
import PageHeader from '@/components/ui/PageHeader';
import { showApiError } from '@/hooks/useApiError';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { 
    CheckCircle2, 
    Leaf, 
    Star, 
    Zap, 
    Rocket, 
    ShieldCheck, 
    Loader2, 
    CreditCard, 
    Wallet, 
    Lock, 
    Sparkles 
} from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import { cn } from "@/lib/utils";

export default function TopUpPage() {
    const { user } = useAuth();
    const { data: walletData } = useWallet();
    const [amount, setAmount] = useState<number>(100);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const currentBalance = walletData?.data?.balance ?? 0;

    const handleSelectPreset = (val: number) => {
        setAmount(val);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomAmount(val);
        const parsed = parseFloat(val);
        if (!isNaN(parsed) && parsed > 0) {
            setAmount(parsed);
        }
    };

    const handlePayment = async () => {
        if (!amount || amount < 10) {
            showApiError(new Error('الحد الأدنى للشحن هو 10 ر.س'), 'الحد الأدنى للشحن هو 10 ر.س');
            return;
        }

        setIsProcessing(true);

        try {
            const response = await paymentService.createSession(amount);

            const checkoutUrl = response?.checkout_url 
                             || response?.data?.checkout_url 
                             || response?.data?.data?.checkout_url;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                throw new Error('تعذر العثور على رابط بوابة الدفع');
            }
        } catch (error: unknown) {
            console.error("Payment Error:", error);
            showApiError(error, 'حدث خطأ في إنشاء جلسة الدفع، يرجى المحاولة لاحقاً');
            setIsProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 md:p-8">
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 tracking-tight">
                <PageHeader
                    title="شحن المحفظة"
                    subtitle="أضف رصيداً لتتمكن من حجز الحصص والدروس التعليمية بكل سهولة وأمان."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                    icon={<CreditCard className="w-6 h-6" />}
                />

                {successMsg ? (
                    <Card className="animate-fade-in-up border-white/50 bg-white/90 backdrop-blur-md rounded-taj-xl p-8 md:p-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-6 max-w-md mx-auto">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-inner animate-bounce-subtle">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">اكتملت العملية بنجاح!</h2>
                            <RedirectCountdown
                                href="/dashboard"
                                message={successMsg}
                                seconds={2}
                                onCancel={() => setSuccessMsg('')}
                            />
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* ── العمود الأول: بطاقة الرصيد ومعلومات الأمان ── */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* بطاقة رصيد المحفظة الحالي بتصميم Glassmorphism فخم */}
                            <div className="group animate-fade-in-up-delay relative overflow-hidden rounded-taj-xl shadow-glass transition-all duration-300 hover:shadow-lg">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 -z-10"></div>
                                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-400 opacity-20 blur-3xl group-hover:opacity-30 transition-opacity duration-500"></div>
                                <div className="absolute bottom-0 -left-10 w-32 h-32 rounded-full bg-purple-400 opacity-20 blur-2xl"></div>

                                <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white/60 p-8">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
                                            <Wallet className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider">
                                            الرصيد الحالي في المحفظة
                                        </h3>
                                    </div>
                                    
                                    <CurrencyDisplay 
                                        amount={currentBalance} 
                                        size="xl" 
                                        className="mt-4 !justify-start text-slate-900 font-black tracking-tight"
                                    />

                                    <div className="mt-8 flex items-center gap-3 bg-white/50 p-3 rounded-2xl border border-white/60 shadow-inner">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                            جاهز للاستخدام الفوري في الحجوزات
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* بطاقة الأمان والضمان البنكي */}
                            <Card className="bg-white/60 backdrop-blur-lg rounded-taj-xl border-white/60 shadow-sm p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">دفع إلكتروني آمن وموثق</h4>
                                        <p className="text-xs text-slate-500">بوابة دفع معتمدة من البنك المركزي</p>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs text-slate-600 border-t border-slate-100 pt-4 leading-relaxed">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>تشفير بيانات البطاقات بمعايير 256-bit SSL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <span>إيداع فوري للرصيد فور إتمام العملية</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-brand-600 shrink-0" />
                                        <span>دعم بطاقات مدى، فيزا، ماستركارد، وأبل باي</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* ── العمود الثاني: خيارات الشحن وتأكيد العملية ── */}
                        <div className="lg:col-span-2">
                            <Card className="bg-white/90 backdrop-blur-md rounded-taj-xl border-white/50 shadow-sm p-6 md:p-8 animate-fade-in-up-delay">
                                <CardContent className="p-0 space-y-8">
                                    {/* باقات الشحن السريع */}
                                    <div>
                                        <label className="block text-gray-900 font-bold mb-4 flex items-center gap-2">
                                            <span>اختر باقة الشحن السريع:</span>
                                            <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-bold">باقات موصى بها</span>
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {[50, 100, 200, 500].map((val) => {
                                                const icons: Record<number, React.ReactNode> = {
                                                    50: <Leaf className="w-7 h-7" />,
                                                    100: <Star className="w-7 h-7" />,
                                                    200: <Zap className="w-7 h-7" />,
                                                    500: <Rocket className="w-7 h-7" />
                                                };
                                                const isActive = amount === val && !customAmount;
                                                return (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => handleSelectPreset(val)}
                                                        className={cn(
                                                            "relative group flex flex-col items-center gap-3 p-5 rounded-taj-xl font-bold border-2 transition-all duration-300 hover:-translate-y-1 active:scale-95 select-none",
                                                            isActive
                                                                ? "border-brand-600 bg-brand-50/70 text-brand-700 shadow-md shadow-brand-600/10 ring-2 ring-brand-500/20"
                                                                : "border-slate-100 bg-slate-50/70 text-slate-500 hover:border-brand-200 hover:bg-white"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "transition-all duration-300",
                                                            isActive ? "scale-110 text-brand-600" : "opacity-60 group-hover:opacity-100 group-hover:scale-105"
                                                        )}>
                                                            {icons[val]}
                                                        </span>
                                                        <span className="text-lg font-black">{val} <small className="text-[10px] font-bold">ر.س</small></span>
                                                        {isActive && (
                                                            <div className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-md">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* إدخال مبلغ مخصص */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 mr-1">
                                            أو أدخل مبلغاً آخر (ر.س):
                                        </label>
                                        <Input
                                            type="number"
                                            min="10"
                                            step="1"
                                            value={customAmount}
                                            onChange={handleCustomAmountChange}
                                            placeholder="أدخل المبلغ (مثال: 150)"
                                            className="bg-white/60 border-slate-200 focus:bg-white transition-all rounded-xl h-12 text-base font-bold"
                                        />
                                        <p className="text-[11px] text-slate-400 mt-1.5 mr-1 font-medium">الحد الأدنى للشحن هو 10 ر.س</p>
                                    </div>

                                    {/* زر الدفع */}
                                    <div className="pt-4 border-t border-slate-100 space-y-4">
                                        <Button
                                            onClick={handlePayment}
                                            disabled={isProcessing || !amount || amount < 10}
                                            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-brand-500/10 transition-all active:scale-[0.99]"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                                                    <span>جاري تجهيز بوابة الدفع...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>ادفع {amount} ر.س واشحن المحفظة</span>
                                                    <Rocket className="w-5 h-5 mr-3" />
                                                </>
                                            )}
                                        </Button>

                                        <p className="text-center text-xs text-slate-400 font-medium">
                                            سيتم تحويلك بشكل آمن إلى بوابة الدفع الإلكتروني (ميسر) لإتمام العملية
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}