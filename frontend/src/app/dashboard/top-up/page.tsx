"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { paymentService } from '@/services/api';
import PageHeader from '@/components/ui/PageHeader';
import { showApiError } from '@/hooks/useApiError';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Leaf, Star, Zap, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";
import { cn } from "@/lib/utils";

export default function TopUpPage() {
    const { user } = useAuth();
    const [amount, setAmount] = useState<number>(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handlePayment = async () => {
        setIsProcessing(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await paymentService.createSession(amount);

            // 🟢 البحث العدواني: سنبحث عن الرابط في كل الطبقات المحتملة
            const checkoutUrl = response?.checkout_url 
                             || response?.data?.checkout_url 
                             || response?.data?.data?.checkout_url;

            if (checkoutUrl) {
                // نجحنا! الطيران إلى ميسر
                window.location.href = checkoutUrl;
            } else {
                // 🟢 الفخ: إذا لم يجده، سيطبع لنا شكل الاستجابة بالكامل لكي نعرف أين اختبأ الرابط!
                throw new Error('لغز الرابط: ' + JSON.stringify(response));
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error("Payment Error:", error);
            // إظهار رسالة الخطأ أو الفخ الذي نصبناه
            showApiError(error, error.message || 'حدث خطأ في إنشاء جلسة الدفع');
            setIsProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8 flex items-center justify-center">

            <div className="relative z-10 max-w-2xl w-full space-y-8">

                <PageHeader
                    title="شحن المحفظة"
                    subtitle="أضف رصيداً لتتمكن من حجز الحصص لأبنائك بسهولة."
                    backHref="/dashboard"
                    backLabel="العودة للوحة التحكم"
                />

                <Card className="animate-fade-in-up-delay border-white/50 bg-white/90 backdrop-blur-md rounded-[2.5rem]">
                    <CardContent className="p-8 md:p-10">
                        {successMsg ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-fade-in-up">
                                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-inner animate-bounce-subtle">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div className="text-center space-y-4">
                                    <h2 className="text-3xl font-bold text-gray-900">اكتملت العملية بنجاح!</h2>
                                </div>
                                <div className="w-full max-w-md">
                                    <RedirectCountdown
                                        href="/dashboard"
                                        message={successMsg}
                                        seconds={2}
                                        onCancel={() => setSuccessMsg('')}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-gray-900 font-bold mb-4 mr-1 flex items-center gap-2">
                                        <span>اختر مبلغ الشحن (ريال سعودي):</span>
                                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold">المبلغ</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[50, 100, 200, 500].map((val) => {
                                            const icons: Record<number, React.ReactNode> = {
                                                50: <Leaf className="w-8 h-8" />,
                                                100: <Star className="w-8 h-8" />,
                                                200: <Zap className="w-8 h-8" />,
                                                500: <Rocket className="w-8 h-8" />
                                            };
                                            const isActive = amount === val;
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => setAmount(val)}
                                                    className={cn(
                                                        "relative group flex flex-col items-center gap-3 p-6 rounded-taj-xl font-bold border-2 transition-all duration-500 hover:-translate-y-2 active:scale-90 select-none",
                                                        "cubic-bezier(0.34, 1.56, 0.64, 1)",
                                                        isActive
                                                            ? "border-brand-600 bg-brand-50 text-brand-700 shadow-xl shadow-brand-600/20 ring-4 ring-brand-500/10 scale-105"
                                                            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-brand-200 hover:bg-white"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "transition-all duration-500 group-hover:rotate-12",
                                                        isActive ? "scale-125 text-brand-600" : "grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100"
                                                    )}>
                                                        {icons[val]}
                                                    </span>
                                                    <span className="text-xl">{val} <small className="text-[10px] font-bold">ريال</small></span>
                                                    {isActive && (
                                                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg ring-4 ring-white animate-success-scale">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4 border-t border-gray-100">
                                    {/* Payment gateway notice */}
                                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-800">دفع آمن مع ميسر</p>
                                            <p className="text-xs text-blue-700 mt-0.5 font-medium leading-relaxed">
                                                جميع المعاملات محمية بتشفير SSL وتدعم البطاقات البنكية السعودية (مدى) والدولية (فيزا/ماستركارد).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full h-14 text-xl"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            <span>جاري معالجة الدفع...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>ادفع {amount} ريال واشحن المحفظة</span>
                                            <Rocket className="w-5 h-5 mr-3" />
                                        </>
                                    )}
                                </Button>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-center text-[10px] text-gray-400 font-bold">دفع آمن ومحمي</p>
                                    <p className="text-center text-xs text-gray-400 font-medium">هذه بيئة اختبار آمنة. لن يتم خصم مبالغ حقيقية.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}