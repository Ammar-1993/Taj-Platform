"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { User, Subject } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
    const [teachers, setTeachers] = useState<User[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [search, setSearch] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [loading, setLoading] = useState(true);

    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTeachers();
        }, 500); 
        return () => clearTimeout(delayDebounceFn);
    }, [search, subjectId, sortBy]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/discovery/subjects');
            setSubjects(res.data.data);
        } catch (error) {
            console.error("خطأ في جلب المواد", error);
        }
    };

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/discovery/teachers', {
                params: {
                    search: search || undefined,
                    subject_id: subjectId || undefined,
                    sort_by: sortBy || undefined
                }
            });
            setTeachers(res.data.data.data); 
        } catch (error) {
            console.error("خطأ في جلب المعلمين", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Hero Header */}
                <div className="animate-fade-in-up relative overflow-hidden bg-gradient-to-l from-indigo-700 via-indigo-600 to-purple-700 p-8 md:p-12 rounded-3xl shadow-xl text-white">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-300 blur-3xl"></div>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-4xl drop-shadow-lg animate-subtle-pulse">👑</span>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight">منصة تاج التعليمية</h1>
                            </div>
                            <p className="text-indigo-200 text-base md:text-lg font-medium mt-1">نخبة من المعلمين المعتمدين في جميع المواد — اختر معلمك وانطلق</p>
                        </div>
                        <div className="flex gap-2">
                            {authLoading ? (
                                <div className="h-10 w-24 bg-white/20 animate-pulse rounded-xl"></div>
                            ) : user ? (
                                <Link href="/dashboard" className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-extrabold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                                    <span>لوحة التحكم</span>
                                    <span>🏠</span>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" className="px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-sm font-bold transition-all duration-200 border border-white/20 hover:shadow-lg hover:-translate-y-0.5">
                                        تسجيل الدخول
                                    </Link>
                                    <Link href="/register" className="px-5 py-2.5 bg-white text-indigo-700 rounded-xl text-sm font-extrabold transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                                        إنشاء حساب
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="animate-fade-in-up-delay bg-white/80 backdrop-blur-sm p-4 md:p-5 rounded-2xl shadow-lg border border-gray-100/80 flex flex-col md:flex-row gap-3 justify-between items-center">
                    <div className="w-full md:flex-1">
                        <input
                            type="text"
                            placeholder="🔍 ابحث باسم المعلم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-3 bg-gray-50/80 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all duration-200 focus:bg-white"
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-4 py-3 bg-gray-50/80 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all duration-200 cursor-pointer focus:bg-white"
                        >
                            <option value="">جميع المواد</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-1/4">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-indigo-50/80 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full transition-all duration-200 text-indigo-900 font-bold cursor-pointer"
                        >
                            <option value="">الترتيب الافتراضي</option>
                            <option value="rating_desc">⭐ الأعلى تقييماً</option>
                        </select>
                    </div>
                </div>

                {/* Teacher Grid */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-xl font-bold animate-pulse">جاري البحث...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.length === 0 ? (
                            <div className="col-span-full text-center py-16 animate-fade-in-up">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🔍</div>
                                <h4 className="text-xl font-extrabold text-gray-800 mb-2">لا يوجد معلمين يطابقون بحثك</h4>
                                <p className="text-gray-400 text-sm">جرب تغيير كلمات البحث أو تصفية المواد</p>
                            </div>
                        ) : (
                            teachers.map((teacher, index) => (
                                <div
                                    key={teacher.id}
                                    className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-105 transition-transform duration-200 shadow-sm">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-lg text-gray-900">{teacher.name}</h3>
                                            <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-bold">
                                                📚 {teacher.teacher_profile?.subject?.name || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10 leading-relaxed">
                                        {teacher.teacher_profile?.bio || 'لا توجد نبذة تعريفية.'}
                                    </p>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-amber-500 font-extrabold flex items-center gap-1 text-base">
                                                ⭐ {teacher.teacher_profile?.average_rating || '0.00'}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">
                                                ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                                            </span>
                                        </div>
                                        
                                        <Link 
                                            href={`/teachers/${teacher.id}`}
                                            className="bg-gradient-to-l from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-extrabold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                                        >
                                            احجز الآن
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}