"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();
    const { login } = useAuth(); // نفترض أن دالة login في الكونتكست تعالج حفظ التوكن

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // ملاحظة: مسار الـ API هنا يجب أن يطابق الموجود في routes/api.php
            const response = await api.post('/auth/login', { email, password });
            
            // استخراج التوكن وبيانات المستخدم من الاستجابة المُحدثة
            const { token, user } = response.data.data;
            
            // حفظها في Context (والذي بدوره يحفظها في LocalStorage/Cookies)
            await login(token, user);
            
            // توجيه المستخدم للوحة التحكم
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            
            {/* أشكال تجميلية في الخلفية */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-100 blur-3xl"></div>
            </div>

            <div className="w-full max-w-md">
                
                {/* الهيدر */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-4 text-4xl hover:scale-110 transition-transform">
                        👑
                    </Link>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        مرحباً بعودتك!
                    </h2>
                    <p className="mt-3 text-gray-500">
                        سجل دخولك لمتابعة رحلتك التعليمية في منصة تاج
                    </p>
                </div>

                {/* صندوق تسجيل الدخول */}
                <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-xl border border-white/50 relative z-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {error && (
                            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 rounded-xl text-sm font-bold animate-pulse">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-left"
                                    placeholder="name@example.com"
                                    dir="ltr"
                                />
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-700">كلمة المرور</label>
                                    <Link href="#" className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                        نسيت كلمة المرور؟
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-left tracking-widest"
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        جاري الدخول...
                                    </span>
                                ) : 'تسجيل الدخول'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* رابط إنشاء حساب جديد */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 text-sm">
                        ليس لديك حساب؟ {' '}
                        <Link href="/register" className="font-bold text-blue-600 hover:text-blue-800 transition-colors">
                            أنشئ حساباً جديداً الآن
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}