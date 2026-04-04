"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { showApiError } from '@/hooks/useApiError';

export default function PayoutPage() {
    const { user } = useAuth();
    
    // حالات جلب البيانات
    const [walletInfo, setWalletInfo] = useState<any>(null);
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // حالات نموذج السحب
    const [amount, setAmount] = useState<number | ''>('');
    const [bankName, setBankName] = useState('');
    const [iban, setIban] = useState('SA');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // جلب الرصيد المباشر وسجل الطلبات عند فتح الصفحة
    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [walletRes, payoutsRes] = await Promise.all([
                api.get('/wallet'),
                api.get('/wallet/payouts')
            ]);
            setWalletInfo(walletRes.data.data);
            setPayouts(payoutsRes.data.data);
        } catch (error) {
            console.error("خطأ في جلب البيانات المالية", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/wallet/payouts', {
                amount: Number(amount),
                bank_name: bankName,
                iban: iban
            });
            
            setMessage({ type: 'success', text: res.data.message });
            setAmount('');
            setBankName('');
            setIban('SA');
            
            // تحديث الرصيد والجدول فوراً بدون الحاجة لتحديث الصفحة
            fetchData(); 
        } catch (error: unknown) {
            showApiError(error, 'تأكد من صحة البيانات وألا يقل المبلغ عن 50 ريال.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        return <StatusBadge status={status} />;
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold text-gray-500">جاري تحميل المحفظة والسجل المالي...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* الهيدر */}
                <PageHeader
                    title="سحب الأرباح 💸"
                    subtitle="اطلب تحويل أرباحك إلى حسابك البنكي بكل سهولة."
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: نموذج طلب السحب والرصيد المتاح */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* بطاقة الرصيد */}
                        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-md text-white">
                            <h3 className="text-green-100 text-sm font-medium">الرصيد القابل للسحب</h3>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-4xl font-extrabold">{walletInfo?.balance || '0.00'}</span>
                                <span className="text-green-200">ريال</span>
                            </div>
                        </div>

                        {/* نموذج الطلب */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">تقديم طلب جديد</h3>
                            
                            {message.text && (
                                <div className={`p-3 mb-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handlePayoutSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ المراد سحبه (ريال):</label>
                                    <input 
                                        type="number" 
                                        min="50"
                                        step="0.01"
                                        max={walletInfo?.balance}
                                        required 
                                        value={amount} 
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        placeholder="الحد الأدنى 50 ريال"
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-green-500 outline-none transition" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">اسم البنك:</label>
                                    <select
                                        required
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-green-500 outline-none bg-white transition"
                                    >
                                        <option value="">-- اختر البنك --</option>
                                        <option value="البنك الأهلي السعودي">البنك الأهلي السعودي</option>
                                        <option value="مصرف الراجحي">مصرف الراجحي</option>
                                        <option value="بنك الرياض">بنك الرياض</option>
                                        <option value="بنك الإنماء">بنك الإنماء</option>
                                        <option value="بنك البلاد">بنك البلاد</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">رقم الآيبان (IBAN):</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={iban} 
                                        onChange={(e) => setIban(e.target.value.toUpperCase())}
                                        placeholder="SA0000000000000000000000"
                                        maxLength={24}
                                        dir="ltr"
                                        className="w-full border-2 border-gray-100 p-3 rounded-xl focus:ring-green-500 outline-none text-left transition" 
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || (amount !== '' && amount > walletInfo?.balance) || walletInfo?.balance < 50}
                                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 mt-2"
                                >
                                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب السحب'}
                                </button>
                                {walletInfo?.balance < 50 && (
                                    <p className="text-xs text-red-500 text-center font-bold">عفواً، رصيدك أقل من الحد الأدنى للسحب (50 ريال).</p>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* القسم الثاني: سجل الطلبات السابقة */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                        <h3 className="font-bold text-lg text-gray-900 mb-6">سجل طلبات السحب 📝</h3>
                        
                        {payouts.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 font-medium">
                                لم تقم بتقديم أي طلب سحب حتى الآن.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3">رقم الطلب</th>
                                            <th className="px-4 py-3">التاريخ</th>
                                            <th className="px-4 py-3">المبلغ</th>
                                            <th className="px-4 py-3">البنك</th>
                                            <th className="px-4 py-3">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map((payout) => (
                                            <tr key={payout.id} className="border-b hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 font-medium text-gray-900">#{payout.id}</td>
                                                <td className="px-4 py-3 text-gray-500">{new Date(payout.created_at).toLocaleDateString('ar-SA')}</td>
                                                <td className="px-4 py-3 font-bold text-green-600">{payout.amount} SAR</td>
                                                <td className="px-4 py-3 text-gray-700">{payout.bank_name}</td>
                                                <td className="px-4 py-3">{renderStatusBadge(payout.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}