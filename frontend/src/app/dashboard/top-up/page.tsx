"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function TopUpPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [amount, setAmount] = useState<number>(100);
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // هذه الدالة تحاكي ما ستقوم به بوابة الدفع (ميسر/تاب)
    // في الواقع، سيقوم الطالب بإدخال رقم بطاقته هنا، ولكن للتبسيط والمحاكاة:
    const handleMockPayment = async () => {
        setIsProcessing(true);
        
        // نحاكي تأخير الشبكة والبنك (ثانيتين)
        setTimeout(async () => {
            // هنا نحاكي البنك وهو يرسل الـ Webhook إلى السيرفر الخاص بنا (Laravel)
            try {
                // نرسل الطلب لمسار الـ Webhook كأننا خوادم البنك تماماً!
               // نرسل الطلب لمسار الـ Webhook كأننا خوادم البنك تماماً!
                const res = await fetch('http://localhost:8000/api/v1/webhooks/payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            id: "pay_test_" + Math.random().toString(36).substr(2, 9),
                            status: "paid",
                            amount: amount * 100, // البنك يرسلها بالهللة
                            metadata: { user_id: user?.id } // نخبر السيرفر من هو صاحب المحفظة
                        }
                    })
                });

                // 🔴 هذا السطر يمنع الكذب: إذا رد السيرفر بخطأ، سيوقف العملية فوراً!
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'خطأ داخلي في السيرفر');
                }

                setSuccessMsg(`تم شحن محفظتك بمبلغ ${amount} ريال بنجاح!`);
                setIsProcessing(false);

                // العودة للوحة التحكم بعد 3 ثوانٍ
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);

            } catch (error) {
                alert('حدث خطأ في الاتصال بالبنك.');
                setIsProcessing(false);
            }
        }, 2000);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">شحن المحفظة البنكية 💳</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">العودة للوحة</Link>
                </div>

                {successMsg ? (
                    <div className="bg-green-100 text-green-800 p-6 rounded-xl text-center font-bold text-lg animate-pulse">
                        ✅ {successMsg}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">اختر المبلغ (ريال سعودي):</label>
                            <div className="grid grid-cols-3 gap-4">
                                {[50, 100, 200, 500].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`py-3 rounded-lg font-bold border-2 transition ${
                                            amount === val ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-600'
                                        }`}
                                    >
                                        {val} SAR
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-8">
                            <h3 className="text-gray-800 font-bold mb-4">بيانات البطاقة (محاكاة الاختبار)</h3>
                            <div className="space-y-4">
                                <input type="text" placeholder="رقم البطاقة (4000 0000 0000 0000)" disabled className="w-full p-3 border rounded-lg bg-gray-100 cursor-not-allowed" />
                                <div className="flex gap-4">
                                    <input type="text" placeholder="تاريخ الانتهاء (MM/YY)" disabled className="w-1/2 p-3 border rounded-lg bg-gray-100 cursor-not-allowed" />
                                    <input type="text" placeholder="رمز الأمان (CVC)" disabled className="w-1/2 p-3 border rounded-lg bg-gray-100 cursor-not-allowed" />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleMockPayment}
                            disabled={isProcessing}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center"
                        >
                            {isProcessing ? 'جاري معالجة الدفع مع البنك...' : `ادفع ${amount} ريال لشحن محفظتك`}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-4">هذه بيئة اختبار آمنة. لن يتم خصم مبالغ حقيقية.</p>
                    </div>
                )}
            </div>
        </div>
    );
}