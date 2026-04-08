"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import PageHeader from '@/components/ui/PageHeader';
import DecorativeBackground from '@/components/ui/DecorativeBackground';
import { showApiError } from '@/hooks/useApiError';

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

                // العودة للوحة التحكم بعد 2 ثانية
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);

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
        <DecorativeBackground />

        <div className="relative z-10 max-w-2xl w-full space-y-8 tracking-tight">
            
            <PageHeader
                title="شحن المحفظة"
                subtitle="أضف رصيداً لتتمكن من حجز الحصص لأبنائك بسهولة."
                backHref="/dashboard"
                backLabel="العودة للوحة التحكم"
            />

            <div className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-white/50 animate-fade-in-up-delay">

                {successMsg ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-fade-in-up">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner animate-bounce-subtle">
                            ✅
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-black text-gray-900">تم الشحن بنجاح!</h2>
                            <p className="text-gray-500 font-bold text-lg">{successMsg}</p>
                        </div>
                        <div className="w-full h-2 bg-indigo-50 rounded-full overflow-hidden max-w-xs">
                            <div className="h-full bg-indigo-600 w-full animate-progress-bar"></div>
                        </div>
                        <p className="text-xs text-gray-400 font-bold animate-pulse">جاري توجيهك للوحة التحكم خلال 3 ثوانٍ...</p>
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
                                    const icons: Record<number, string> = { 50: '🌱', 100: '🌟', 200: '⚡', 500: '🚀' };
                                    return (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(val)}
                                            className={`relative group flex flex-col items-center gap-2 p-5 rounded-2xl font-black border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                                amount === val 
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-indigo-100 shadow-lg' 
                                                    : 'border-gray-100/50 bg-gray-50/50 hover:border-indigo-300 text-gray-500'
                                            }`}
                                        >
                                            <span className={`text-2xl transition-transform group-hover:scale-125 ${amount === val ? 'scale-110' : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                                {icons[val]}
                                            </span>
                                            <span className="text-lg">{val}</span>
                                            {amount === val && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] ring-4 ring-white">✓</div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-gray-900 font-black flex items-center gap-2">
                                    <span className="text-xl">🛡️</span>
                                    بيانات الدفع الآمن
                                </h3>
                                <div className="flex gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help" title="نقبل جميع البطاقات البنكية">
                                    <div className="w-8 h-5 bg-indigo-100 rounded-md"></div>
                                    <div className="w-8 h-5 bg-emerald-100 rounded-md"></div>
                                    <div className="w-8 h-5 bg-purple-100 rounded-md"></div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50/50 p-6 rounded-[2rem] border-2 border-gray-100 space-y-4">
                                <div className="space-y-4 opacity-50">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">رقم البطاقة الائتمانية</label>
                                        <input type="text" placeholder="•••• •••• •••• ••••" disabled className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white/50 cursor-not-allowed font-black tracking-widest text-gray-400" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/2 flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">تاريخ الانتهاء</label>
                                            <input type="text" placeholder="MM / YY" disabled className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white/50 cursor-not-allowed font-black text-center text-gray-400" />
                                        </div>
                                        <div className="w-1/2 flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">رمز الأمان (CVC)</label>
                                            <input type="text" placeholder="•••" disabled className="w-full p-4 border-2 border-gray-200 rounded-2xl bg-white/50 cursor-not-allowed font-black text-center text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleMockPayment}
                            disabled={isProcessing}
                            className="w-full py-4.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-[1.5rem] font-black text-xl hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] transition-all duration-300 disabled:opacity-70 flex justify-center items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>جاري معالجة الدفع...</span>
                                </>
                            ) : (
                                <>
                                    <span>ادفع {amount} ريال واشحن المحفظة</span>
                                    <span>🚀</span>
                                </>
                            )}
                        </button>
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Safe & Secure Payment</p>
                            <p className="text-center text-xs text-gray-400 font-bold italic">هذه بيئة اختبار آمنة. لن يتم خصم مبالغ حقيقية.</p>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}