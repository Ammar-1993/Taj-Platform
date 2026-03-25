"use client";

import Link from 'next/link';

export default function RegisterHubPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
            
            <div className="text-center max-w-3xl mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    مرحباً بك في منصة تاج 👑
                </h1>
                <p className="text-lg text-gray-600">
                    اختر نوع الحساب الذي ترغب في إنشائه لنقوم بتوجيهك للمسار الصحيح.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
                
                {/* 1. بطاقة الطالب */}
                <Link href="/register/student" className="group">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center cursor-pointer">
                        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                            🎓
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">طالب</h2>
                        <p className="text-gray-500 text-sm">أريد أن أتعلم، أحجز حصصاً، وأطور من مهاراتي مع نخبة من المعلمين.</p>
                        <span className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-6 rounded-full group-hover:bg-blue-700 transition">
                            إنشاء حساب طالب
                        </span>
                    </div>
                </Link>

                {/* 2. بطاقة المعلم */}
                <Link href="/register/teacher" className="group">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-transparent hover:border-green-500 hover:shadow-xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center cursor-pointer">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                            👨‍🏫
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">معلم / خبير</h2>
                        <p className="text-gray-500 text-sm">أريد الانضمام لفريق تاج، تقديم حصص تفاعلية، وتحقيق دخل إضافي.</p>
                        <span className="mt-6 inline-block bg-green-600 text-white font-bold py-2 px-6 rounded-full group-hover:bg-green-700 transition">
                            الانضمام كمعلم
                        </span>
                    </div>
                </Link>

                {/* 3. بطاقة ولي الأمر */}
                <Link href="/register/parent" className="group">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-transparent hover:border-purple-500 hover:shadow-xl transition-all duration-300 text-center h-full flex flex-col justify-center items-center cursor-pointer">
                        <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                            👨‍👩‍👦
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">ولي أمر</h2>
                        <p className="text-gray-500 text-sm">أريد إدارة حسابات أبنائي، شحن محافظهم، ومتابعة تطورهم الدراسي.</p>
                        <span className="mt-6 inline-block bg-purple-600 text-white font-bold py-2 px-6 rounded-full group-hover:bg-purple-700 transition">
                            حساب ولي أمر
                        </span>
                    </div>
                </Link>

            </div>

            <div className="mt-12 text-center">
                <p className="text-gray-600 font-medium">
                    لديك حساب بالفعل؟ {' '}
                    <Link href="/login" className="text-blue-600 hover:underline font-bold">
                        تسجيل الدخول
                    </Link>
                </p>
            </div>

        </div>
    );
}