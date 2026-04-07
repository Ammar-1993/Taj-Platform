"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { User, Subject } from '@/types';
import { useAuth } from '@/context/AuthContext';
// تأكد من تثبيت المكتبة: npm install lucide-react
import { Search, Star, BookOpen, Crown, UserPlus, LogIn, HelpCircle, LayoutDashboard, Frown } from 'lucide-react';

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
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-800 pt-16 pb-32 px-4 overflow-hidden">
                {/* خلفية جمالية (Abstract Shapes) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[70%] rounded-full bg-white/5 blur-[120px]"></div>
                    <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-purple-400/20 blur-[120px]"></div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-white">
                    <div className="text-center md:text-right space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full mb-2">
                            <Crown size={18} className="text-yellow-400" />
                            <span className="text-sm font-semibold tracking-wide">المنصة الأولى للتعليم المخصص</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                            منصة تاج التعليمية
                        </h1>
                        <p className="text-indigo-100/90 text-lg md:text-xl font-medium max-w-lg">
                            نخبة من المعلمين المعتمدين في جميع المواد — اختر معلمك وانطلق نحو التفوق.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
                        {authLoading ? (
                            <div className="h-12 w-32 bg-white/10 animate-pulse rounded-2xl"></div>
                        ) : user ? (
                            <Link href="/dashboard" className="px-6 py-3.5 bg-white text-indigo-700 rounded-2xl text-sm font-bold transition-all duration-300 hover:shadow-[0_8px_30px_rgb(255,255,255,0.2)] hover:-translate-y-1 flex items-center gap-2">
                                <LayoutDashboard size={18} />
                                <span>لوحة التحكم</span>
                            </Link>
                        ) : (
                            <>
                                <Link href="/faq" className="px-5 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-sm font-bold transition-all duration-300 border border-white/10 hover:shadow-lg flex items-center gap-2">
                                    <HelpCircle size={18} />
                                    <span>الأسئلة الشائعة</span>
                                </Link>
                                <Link href="/login" className="px-5 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-sm font-bold transition-all duration-300 border border-white/10 hover:shadow-lg flex items-center gap-2">
                                    <LogIn size={18} />
                                    <span>تسجيل الدخول</span>
                                </Link>
                                <Link href="/register" className="px-6 py-3.5 bg-white text-indigo-700 rounded-2xl text-sm font-bold transition-all duration-300 hover:shadow-[0_8px_30px_rgb(255,255,255,0.2)] hover:-translate-y-1 flex items-center gap-2">
                                    <UserPlus size={18} />
                                    <span>إنشاء حساب</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 space-y-12">
                {/* Floating Search & Filters (Glassmorphism) */}
                <div className="relative z-20 -mt-16 bg-white/80 backdrop-blur-xl p-3 md:p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:flex-1 relative group">
                        <Search size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="ابحث باسم المعلم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pr-14 pl-4 py-4 bg-gray-50/80 hover:bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all duration-300 font-semibold placeholder:text-gray-400 placeholder:font-medium"
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50/80 hover:bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all duration-300 cursor-pointer font-semibold text-gray-700 appearance-none"
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
                            className="w-full px-5 py-4 bg-indigo-50/80 hover:bg-indigo-50 border-2 border-transparent focus:border-indigo-200 focus:bg-indigo-50/50 rounded-2xl outline-none transition-all duration-300 text-indigo-700 font-bold cursor-pointer appearance-none"
                        >
                            <option value="">الترتيب الافتراضي</option>
                            <option value="rating_desc">الأعلى تقييماً</option>
                        </select>
                    </div>
                </div>

                {/* Teacher Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 bg-white rounded-3xl shadow-sm border border-gray-100 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                                    <Frown size={48} strokeWidth={1.5} />
                                </div>
                                <h4 className="text-2xl font-bold text-gray-800 mb-2">لا يوجد معلمين يطابقون بحثك</h4>
                                <p className="text-gray-500">جرب استخدام كلمات بحث مختلفة أو تغيير المادة.</p>
                            </div>
                        ) : (
                            teachers.map((teacher, index) => (
                                <div
                                    key={teacher.id}
                                    className="group animate-fade-in-up bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-100 transition-all duration-500 hover:-translate-y-1.5 flex flex-col"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <h3 className="font-extrabold text-lg text-gray-900 mb-1 line-clamp-1">{teacher.name}</h3>
                                            <div className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/80 px-3 py-1.5 rounded-xl font-bold">
                                                <BookOpen size={14} />
                                                {teacher.teacher_profile?.subject?.name || 'غير محدد'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed">
                                        {teacher.teacher_profile?.bio || 'لا توجد نبذة تعريفية مضافة لهذا المعلم حتى الآن.'}
                                    </p>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg">
                                                <Star size={14} className="fill-amber-500 text-amber-500" />
                                                <span className="font-black text-sm pt-0.5">
                                                    {teacher.teacher_profile?.average_rating || '0.00'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">
                                                ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                                            </span>
                                        </div>
                                        
                                        <Link 
                                            href={`/teachers/${teacher.id}`}
                                            className="bg-gray-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                                        >
                                            عرض التفاصيل
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