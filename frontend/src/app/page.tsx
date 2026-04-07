"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { User, Subject } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Crown, Home as HomeIcon, HelpCircle, LogIn, UserPlus, Search, BookOpen, Star, SearchX } from 'lucide-react';

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
        <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Hero Header */}
                <div className="animate-fade-in-up relative overflow-hidden bg-gradient-to-l from-indigo-700 via-indigo-600 to-purple-700 p-8 md:p-12 rounded-3xl shadow-xl text-white">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-300 blur-3xl"></div>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="w-full md:w-auto text-center md:text-right">
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                                <Crown size={40} className="text-yellow-400 drop-shadow-md animate-subtle-pulse" strokeWidth={2.5} />
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight">منصة تاج التعليمية</h1>
                            </div>
                            <p className="text-indigo-200 text-base md:text-lg font-medium mt-1">نخبة من المعلمين المعتمدين في جميع المواد — اختر معلمك وانطلق</p>
                        </div>
                        
                        {/* 🟢 تم تحديث حاوية الأزرار هنا لتكون في صف واحد ومتجاوبة */}
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-1.5 sm:gap-2 md:gap-3 mt-2 md:mt-0">
                            {authLoading ? (
                                <div className="h-10 md:h-12 w-full md:w-32 bg-white/20 animate-pulse rounded-xl md:rounded-2xl"></div>
                            ) : user ? (
                                <Link href="/dashboard" className="flex-1 md:flex-none flex justify-center items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3.5 bg-white text-indigo-700 rounded-xl md:rounded-2xl text-xs md:text-sm font-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 shadow-xl whitespace-nowrap">
                                    <span>لوحة التحكم</span>
                                    <HomeIcon className="w-4 h-4 md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                                </Link>
                            ) : (
                                <>
                                    <Link href="/faq" className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-1 sm:px-2 md:px-5 py-2.5 md:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-bold transition-all duration-300 border border-white/10 hover:shadow-xl hover:-translate-y-1 whitespace-nowrap">
                                        <span>الأسئلة الشائعة</span>
                                        <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                                    </Link>
                                    <Link href="/login" className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-1 sm:px-2 md:px-6 py-2.5 md:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-black transition-all duration-300 border border-white/20 hover:shadow-xl hover:-translate-y-1 whitespace-nowrap">
                                        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                                        <span>تسجيل الدخول</span>
                                    </Link>
                                    <Link href="/register" className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-1 sm:px-2 md:px-6 py-2.5 md:py-3 bg-white text-indigo-700 rounded-xl md:rounded-2xl text-[10px] sm:text-xs md:text-sm font-black transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 shadow-xl whitespace-nowrap">
                                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
                                        <span>إنشاء حساب</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modernized Search & Filters */}
                <div className="animate-fade-in-up-delay bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-lg border border-white/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="w-full md:flex-1 relative group">
                        <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="ابحث باسم المعلم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pr-12 pl-4 py-4 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-2xl outline-none w-full transition-all duration-300 focus:bg-white font-bold placeholder:text-gray-400"
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-5 py-4 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-2xl outline-none w-full transition-all duration-300 cursor-pointer focus:bg-white font-bold text-gray-700 appearance-none"
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
                            className="px-5 py-4 bg-indigo-50/50 hover:bg-indigo-50 border-2 border-transparent focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 rounded-2xl outline-none w-full transition-all duration-300 text-indigo-900 font-extrabold cursor-pointer appearance-none"
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
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-indigo-300">
                                    <SearchX size={40} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-xl font-extrabold text-gray-800 mb-2">لا يوجد معلمين يطابقون بحثك</h4>
                                <p className="text-gray-400 text-sm">جرب تغيير كلمات البحث أو تصفية المواد</p>
                            </div>
                        ) : (
                            teachers.map((teacher, index) => (
                                <div
                                    key={teacher.id}
                                    className="animate-fade-in-up bg-white p-6 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1.5 group flex flex-col"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-lg text-gray-900 mb-1.5">{teacher.name}</h3>
                                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg font-bold">
                                                <BookOpen size={14} />
                                                {teacher.teacher_profile?.subject?.name || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10 leading-relaxed flex-1">
                                        {teacher.teacher_profile?.bio || 'لا توجد نبذة تعريفية.'}
                                    </p>

                                    <div className="flex justify-between items-center pt-5 border-t border-gray-50">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-amber-500 font-black flex items-center gap-1.5 text-lg">
                                                <Star size={18} className="fill-amber-500" />
                                                {teacher.teacher_profile?.average_rating || '0.00'}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                                            </span>
                                        </div>
                                        
                                        <Link 
                                            href={`/teachers/${teacher.id}`}
                                            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white px-6 py-3 rounded-2xl text-xs font-black hover:shadow-[0_12px_40px_rgba(79,70,229,0.3)] transition-all duration-300 hover:-translate-y-1 shadow-lg active:scale-95"
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