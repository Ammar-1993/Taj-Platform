"use client";

import { useState } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function StudentRegisterPage() {
    const router = useRouter();
    const { login } = useAuth(); 
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form Data States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // إرسال الطلب للبوابة الموحدة مع تحديد دور "الطالب"
            const res = await api.post('/auth/register', {
                name,
                email,
                phone,
                password,
                role: 'student' // 🟢 تحديد الصلاحية كطالب
            });

            setSuccessMsg(res.data.message);
            
            // تسجيل الدخول تلقائياً
            login(res.data.data.token, res.data.data.user);

            // 🟢 التوجيه الذكي: نرسله مباشرة لصفحة إعداد الملف لاختيار "المرحلة الدراسية"
            setTimeout(() => {
                router.push('/dashboard/student-profile');
            }, 2000);

        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'تأكد من صحة البيانات. قد يكون الإيميل أو الجوال مسجلاً مسبقاً.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center items-center">
            <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
                
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">🎓</div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">إنشاء حساب طالب</h1>
                    <p className="text-gray-500">انضم الآن وابدأ رحلة التفوق مع نخبة المعلمين.</p>
                </div>

                {successMsg ? (
                    <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-2xl text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-blue-800 mb-2">تم إنشاء حسابك بنجاح!</h3>
                        <p className="text-blue-700">جاري توجيهك لاختيار مرحلتك الدراسية...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="bg-red-50 text-red-700 font-bold p-4 rounded-xl border border-red-200 text-sm">{error}</div>}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">اسم الطالب *</label>
                            <input 
                                type="text" 
                                required 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="الاسم الثنائي أو الثلاثي"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 outline-none transition" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني *</label>
                            <input 
                                type="email" 
                                required 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                placeholder="student@example.com"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 outline-none transition" 
                                dir="ltr" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">رقم الجوال *</label>
                            <input 
                                type="tel" 
                                required 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                placeholder="05XXXXXXXX"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 outline-none transition" 
                                dir="ltr" 
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور *</label>
                            <input 
                                type="password" 
                                required 
                                minLength={8} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="••••••••"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-0 outline-none transition" 
                            />
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 shadow-lg"
                            >
                                {loading ? 'جاري إنشاء الحساب...' : 'يلا نبدأ 🚀'}
                            </button>
                        </div>
                        
                        <div className="text-center mt-4">
                            <Link href="/register" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
                                ← العودة لاختيار نوع الحساب
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}