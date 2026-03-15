"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function Home() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [loading, setLoading] = useState(true);

    // جلب المواد والمعلمين عند تحميل الصفحة
    useEffect(() => {
        fetchSubjects();
        fetchTeachers();
    }, []);

    // إعادة جلب المعلمين عند تغيير الفلاتر (البحث أو المادة)
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTeachers();
        }, 500); // تأخير نصف ثانية لتخفيف الضغط على السيرفر أثناء الكتابة
        return () => clearTimeout(delayDebounceFn);
    }, [search, subjectId]);

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
            // بناء رابط البحث مع الفلاتر
            let url = '/discovery/teachers?';
            if (search) url += `search=${search}&`;
            if (subjectId) url += `subject_id=${subjectId}`;

            const res = await api.get(url);
            setTeachers(res.data.data.data); // data الأولى للـ response والثانية للـ pagination
        } catch (error) {
            console.error("خطأ في جلب المعلمين", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* الهيدر والبحث */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">اختر معلمك وانطلق 🚀</h1>
                        <p className="text-gray-500 mt-2">نخبة من المعلمين المعتمدين في جميع المواد</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="ابحث باسم المعلم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                        />
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">جميع المواد</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
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
                                            {teacher.name.charAt(2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{teacher.name}</h3>
                                            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                {teacher.teacher_profile?.subject?.name}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                                        {teacher.teacher_profile?.bio || 'لا توجد نبذة تعريفية.'}
                                    </p>
                                    <div className="flex justify-between items-center border-t pt-4">
                                        <span className="text-yellow-500 font-bold">⭐ {teacher.teacher_profile?.average_rating}</span>
                                        <Link 
                                            href={`/teachers/${teacher.id}`}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
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