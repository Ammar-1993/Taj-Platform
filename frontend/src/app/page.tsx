"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function Home() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [sortBy, setSortBy] = useState(''); // 🟢 1. حالة الترتيب الجديدة
    const [loading, setLoading] = useState(true);

    // جلب المواد عند تحميل الصفحة فقط
    useEffect(() => {
        fetchSubjects();
    }, []);

    // 🟢 2. إعادة جلب المعلمين عند تغيير أي من الفلاتر (البحث، المادة، الترتيب)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTeachers();
        }, 500); 
        return () => clearTimeout(delayDebounceFn);
    }, [search, subjectId, sortBy]); // إضافة sortBy للمصفوفة

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
            // 🟢 3. إرسال المعاملات بشكل أنظف باستخدام params في axios
            const res = await api.get('/discovery/teachers', {
                params: {
                    search: search || undefined,
                    subject_id: subjectId || undefined,
                    sort_by: sortBy || undefined // إرسال معامل الترتيب
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
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* الهيدر */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">اختر معلمك وانطلق 🚀</h1>
                    <p className="text-gray-500 mt-2">نخبة من المعلمين المعتمدين في جميع المواد</p>
                </div>

                {/* 🟢 4. قسم الفلاتر والبحث (تم التوسعة ليشمل 3 عناصر) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    
                    {/* البحث النصي */}
                    <div className="w-full md:flex-1">
                        <input
                            type="text"
                            placeholder="ابحث باسم المعلم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition"
                        />
                    </div>

                    {/* فلتر المواد */}
                    <div className="w-full md:w-1/4">
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-4 py-3 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition bg-white"
                        >
                            <option value="">جميع المواد</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* الفلتر الجديد: الترتيب حسب التقييم */}
                    <div className="w-full md:w-1/4">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full transition bg-blue-50 text-blue-900 font-semibold cursor-pointer"
                        >
                            <option value="">الترتيب الافتراضي</option>
                            <option value="rating_desc">⭐ الأعلى تقييماً</option>
                        </select>
                    </div>

                </div>

                {/* شبكة المعلمين */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500 text-xl font-semibold animate-pulse">جاري البحث...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teachers.length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 py-10">لا يوجد معلمين يطابقون بحثك.</div>
                        ) : (
                            teachers.map((teacher) => (
                                <div key={teacher.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{teacher.name}</h3>
                                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                {teacher.teacher_profile?.subject?.name || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4 h-10">
                                        {teacher.teacher_profile?.bio || 'لا توجد نبذة تعريفية.'}
                                    </p>

                                    {/* 🟢 5. عرض التقييم مع عدد المقيمين بتصميم أنيق */}
                                    <div className="flex justify-between items-center border-t pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-yellow-500 font-bold flex items-center gap-1">
                                                ⭐ {teacher.teacher_profile?.average_rating || '0.00'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                                            </span>
                                        </div>
                                        
                                        <Link 
                                            href={`/teachers/${teacher.id}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
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