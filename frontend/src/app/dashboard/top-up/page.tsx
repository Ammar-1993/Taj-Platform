"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import PageHeader from '@/components/ui/PageHeader';
import { showApiError } from '@/hooks/useApiError';
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Leaf, Star, Zap, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import RedirectCountdown from "@/components/ui/RedirectCountdown";

export default function TopUpPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState<number>(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleMockPayment = async () => {
        setIsProcessing(true);
        
        // نحاكي تأخير الشبكة والبنك (ثانيتين)
        setTimeout(async () => {
            try {
                // استخدام axios لضمان المسار الصحيح والتقاط الأخطاء
                await api.post('/webhooks/payment', {
                    data: {
                        id: "pay_test_" + Math.random().toString(36).substring(2, 9),
                        status: "paid",
                        amount: amount * 100, // البنك يرسلها بالهللة
                        metadata: { user_id: user?.id }
                    }
                });

                setSuccessMsg(`تم شحن محفظتك بمبلغ ${amount} ريال بنجاح!`);
                setIsProcessing(false);


            } catch (error: unknown) {
                console.error(error);
                showApiError(error, 'حدث خطأ في الاتصال بالبنك أو السيرفر. تحقق من مسار الـ Webhook.');
                setIsProcessing(false);
            }
        }, 2000);
    };

    if (!user) return null;

    return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50/50 p-4 md:p-8 flex items-center justify-center">
        
        <div className="relative z-10 max-w-2xl w-full space-y-8 tracking-tight">
            
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
                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Amount</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[50, 100, 200, 500].map((val) => {
                                    const icons: Record<number, React.ReactNode> = { 
                                        50: <Leaf className="w-8 h-8" />, 
                                        100: <Star className="w-8 h-8" />, 
                                        200: <Zap className="w-8 h-8" />, 
                                        500: <Rocket className="w-8 h-8" /> 
                                    };
                                    return (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className={`relative group flex flex-col items-center gap-2 p-5 rounded-2xl font-bold border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                                amount === val 
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-indigo-100 shadow-lg' 
                                                    : 'border-gray-100/50 bg-gray-50/50 hover:border-indigo-300 text-gray-500'
                                            }`}
                                        >
                                            <span className={`transition-transform group-hover:scale-125 ${amount === val ? 'scale-110' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                                {icons[val]}
                                            </span>
                                            <span className="text-lg">{val}</span>
                                            {amount === val && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] ring-4 ring-white">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-gray-100">
                            {/* Sandbox notice — replaces fake payment form (P0-01 fix) */}
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-800">بيئة تطوير — الشحن الفوري نشط</p>
                                    <p className="text-xs text-amber-700 mt-0.5 font-medium leading-relaxed">
                                        بوابة الدفع الحقيقية (مدى / فيزا / أبل باي) ستُفعَّل قريباً. حالياً سيُشحن رصيدك مباشرة بالمبلغ المختار لأغراض الاختبار.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleMockPayment}
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
                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safe & Secure Payment</p>
                            <p className="text-center text-xs text-gray-400 font-bold italic">هذه بيئة اختبار آمنة. لن يتم خصم مبالغ حقيقية.</p>
                        </div>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}