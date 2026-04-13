"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { User, Subject } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  Home as HomeIcon,
  HelpCircle,
  LogIn,
  UserPlus,
  Search,
  BookOpen,
  ListFilter,
  Star,
  SearchX,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from "@/components/ui/Card";

import toast from "react-hot-toast";

export default function Home() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();

  // 🟢 الطريقة الاحترافية: استخدام useCallback لمنع تحذيرات React
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get("/discovery/subjects");
      setSubjects(res.data.data);
    } catch (error) {
      console.error("خطأ في جلب المواد", error);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/discovery/teachers", {
        params: {
          search: search || undefined,
          subject_id: subjectId || undefined,
          sort_by: sortBy || undefined,
        },
      });
      setTeachers(res.data.data.data);
    } catch (error) {
      console.error("خطأ في جلب المعلمين", error);
    } finally {
      setLoading(false);
    }
  }, [search, subjectId, sortBy]);

  // استدعاء جلب المواد مرة واحدة عند تحميل الصفحة
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // استدعاء جلب المعلمين مع تأخير (Debounce) ذكي
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTeachers();
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [fetchTeachers]);

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
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="text-4xl drop-shadow-lg animate-subtle-pulse">👑</span>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">منصة تاج التعليمية</h1>
              </div>
              <p className="text-indigo-200 text-base md:text-lg font-medium mt-1">
                نخبة من المعلمين المعتمدين في جميع المواد — اختر معلمك وانطلق نحو التفوق.
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-1.5 sm:gap-2 md:gap-3 mt-2 md:mt-0">
              {authLoading ? (
                <div className="h-10 md:h-12 w-full md:w-32 bg-white/20 animate-pulse rounded-xl md:rounded-2xl"></div>
              ) : user ? (
                <Button asChild variant="default" className="flex-1 md:flex-none py-3.5 bg-white text-indigo-700 hover:bg-gray-50">
                  <Link href="/dashboard">
                    <span>لوحة التحكم</span>
                    <HomeIcon className="w-5 h-5 ml-2" strokeWidth={2.5} />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1 md:flex-none border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                    <Link href="/faq">
                      <HelpCircle className="w-4 h-4 ml-2" />
                      <span>الأسئلة الشائعة</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 md:flex-none border-white/20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md">
                    <Link href="/login">
                      <LogIn className="w-4 h-4 ml-2" />
                      <span>تسجيل الدخول</span>
                    </Link>
                  </Button>
                  <Button asChild variant="default" className="flex-1 md:flex-none bg-white text-indigo-700 hover:bg-gray-50 shadow-xl">
                    <Link href="/register">
                      <UserPlus className="w-4 h-4 ml-2" strokeWidth={2.5} />
                      <span>إنشاء حساب</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modernized Search & Filters */}
        <div className="animate-fade-in-up-delay bg-white/90 backdrop-blur-md p-5 rounded-[2rem] shadow-lg border border-white/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:flex-1 relative">
            <Input
              type="text"
              placeholder="ابحث باسم المعلم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>
          
          {/* حقل اختيار المادة */}
          <div className="w-full md:w-1/4 relative">
            <Select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              icon={<BookOpen size={20} />}
            >
              <option value="">جميع المواد</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </Select>
          </div>

          {/* حقل الترتيب */}
          <div className="w-full md:w-1/4 relative">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              icon={<ListFilter size={20} />}
            >
              <option value="">الترتيب الافتراضي</option>
              <option value="rating_desc">الأعلى تقييماً</option>
            </Select>
          </div>
        </div>

        {/* Teacher Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xl font-bold animate-pulse">
            جاري البحث...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.length === 0 ? (
              <div className="col-span-full text-center py-16 animate-fade-in-up">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-indigo-300">
                  <SearchX size={40} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-extrabold text-gray-800 mb-2">
                  لا يوجد معلمين يطابقون بحثك
                </h4>
                <p className="text-gray-400 text-sm">
                  جرب تغيير كلمات البحث أو تصفية المواد
                </p>
              </div>
            ) : (
              teachers.map((teacher, index) => (
                <Card
                  key={teacher.id}
                  className="animate-fade-in-up hover:border-indigo-100 hover:-translate-y-1.5 group flex flex-col"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader className="flex flex-row items-center gap-4 mb-1 pb-2">
                    <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 mb-1.5">
                        {teacher.name}
                      </CardTitle>
                      <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg font-bold">
                        <BookOpen size={14} />
                        {teacher.teacher_profile?.subject?.name || "غير محدد"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <CardDescription className="line-clamp-2 h-10 leading-relaxed text-xs">
                      {teacher.teacher_profile?.bio || "لا توجد نبذة تعريفية."}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-5 border-t border-gray-50 mt-auto">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-500 font-black flex items-center gap-1.5 text-lg">
                        <Star size={18} className="fill-amber-500" />
                        {teacher.teacher_profile?.average_rating || "0.00"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                      </span>
                    </div>
                    <Button asChild variant="default" className="px-6 rounded-2xl">
                      <Link 
                        href={`/teachers/${teacher.id}`}
                        onClick={(e) => {
                          if ((teacher.active_slots_count || 0) <= 0) {
                            e.preventDefault();
                            toast.error("عذراً، هذا المعلم ليس لديه مواعيد متاحة حالياً.");
                          }
                        }}
                      >
                        احجز الآن
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}