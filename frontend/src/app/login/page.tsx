"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import DecorativeBackground from '@/components/ui/DecorativeBackground';
import { showApiError } from '@/hooks/useApiError';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
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
        } catch (error: unknown) {
            showApiError(error, 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            
            {/* خلفية تجميلية */}
            <DecorativeBackground colorFrom="indigo" colorTo="purple" opacity="opacity-30" />

            <div className="w-full max-w-md animate-fade-in-up">
                
                {/* الهيدر */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block mb-4 text-5xl hover:scale-110 transition-transform duration-200 drop-shadow-lg animate-subtle-pulse">
                        👑
                    </Link>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        مرحباً بعودتك!
                    </h2>
                    <p className="mt-3 text-gray-500">
                        سجل دخولك لمتابعة رحلتك التعليمية في منصة تاج
                    </p>
                </div>

                {/* صندوق تسجيل الدخول */}
                <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/50 relative z-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        
                        {error && (
                            <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 rounded-xl text-sm font-bold animate-pulse">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
                                <div className="relative group">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">📧</span>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-left"
                                        placeholder="name@example.com"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-700">كلمة المرور</label>
                                    <Link href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                                        نسيت كلمة المرور؟
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pr-12 pl-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-left tracking-widest"
                                        placeholder="••••••••"
                                        dir="ltr"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? '👁️‍🗨️' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-extrabold rounded-xl text-white bg-gradient-to-l from-indigo-600 to-purple-600 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
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
                        <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                            أنشئ حساباً جديداً 
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}