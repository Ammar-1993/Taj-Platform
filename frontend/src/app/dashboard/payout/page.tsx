"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import api from '@/lib/axios';

export default function PayoutPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [iban, setIban] = useState('SA');
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/wallet/payouts', {
                amount: parseFloat(amount),
                bank_name: bankName,
                iban: iban
            });

            setMessage({ type: 'success', text: res.data.message });
            
            // توجيه المعلم للوحة التحكم بعد 3 ثواني
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);

        } catch (error: any) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'تأكد من صحة البيانات وألا يقل المبلغ عن 50 ريال.' 
            });
            setIsProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-900">طلب سحب أرباح 💸</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">العودة للوحة</Link>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-center font-bold mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المراد سحبه (الرصيد المتاح: {user.wallet?.balance} SAR)</label>
                        <input
                            type="number"
                            required
                            min="50"
                            step="0.01"
                            max={user.wallet?.balance}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="مثال: 100"
                        />
                        <p className="text-xs text-gray-500 mt-1">الحد الأدنى للسحب هو 50 ريال.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم البنك</label>
                        <select
                            required
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- اختر البنك --</option>
                            <option value="البنك الأهلي السعودي">البنك الأهلي السعودي</option>
                            <option value="مصرف الراجحي">مصرف الراجحي</option>
                            <option value="بنك الرياض">بنك الرياض</option>
                            <option value="بنك الإنماء">بنك الإنماء</option>
                            <option value="بنك البلاد">بنك البلاد</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">رقم الآيبان (IBAN)</label>
                        <input
                            type="text"
                            required
                            value={iban}
                            onChange={(e) => setIban(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-left"
                            dir="ltr"
                            placeholder="SA0000000000000000000000"
                            maxLength={24}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-70"
                    >
                        {isProcessing ? 'جاري إرسال الطلب...' : 'تأكيد طلب السحب'}
                    </button>
                </form>
            </div>
        </div>
    );
}