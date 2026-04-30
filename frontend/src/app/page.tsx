"use client";

import { useState } from "react";
import Link from "next/link";
import { discoveryService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
  CalendarX,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from "@/components/ui/Card";
import TeacherReviewsModal from "@/components/discovery/TeacherReviewsModal";
import { useDebounce } from "@/hooks";

export default function Home() {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedTeacherForReviews, setSelectedTeacherForReviews] = useState<{ id: number; name: string } | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const { user, loading: authLoading } = useAuth();

  // Fetch Subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['discovery-subjects'],
    queryFn: () => discoveryService.getSubjects(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Fetch Teachers
  const { data: teachersData, isLoading: loading } = useQuery({
    queryKey: ['discovery-teachers', debouncedSearch, subjectId, sortBy],
    queryFn: () => discoveryService.getTeachers({
        search: debouncedSearch || undefined,
        subject_id: subjectId || undefined,
        sort_by: sortBy || undefined,
    }),
  });

  const subjects = subjectsData?.data || [];
  const teachers = teachersData?.data?.data || [];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="animate-fade-up relative overflow-hidden bg-gradient-to-l from-brand-700 via-brand-600 to-purple-700 p-8 md:p-12 rounded-taj-xl shadow-xl text-white">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-300 blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="w-full md:w-auto text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="text-3xl md:text-4xl drop-shadow-lg animate-subtle-pulse">👑</span>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">منصة تاج التعليمية</h1>
              </div>
              <p className="text-indigo-200 text-base md:text-lg font-medium mt-1">
                نخبة من المعلمين المعتمدين في جميع المواد
                <br />
                اختر معلمك وانطلق نحو التفوق.
              </p>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:flex lg:items-center lg:justify-end w-full lg:w-auto gap-2 sm:gap-3 mt-4 lg:mt-0">
              {authLoading ? (
                <div className="h-10 md:h-12 w-full md:w-32 bg-white/20 animate-pulse rounded-taj-md md:rounded-taj-lg"></div>
              ) : user ? (
                <Button asChild variant="default" className="flex-1 md:flex-none py-3.5 bg-white text-brand-700 hover:bg-gray-50">
                  <Link href="/dashboard">
                    <span>لوحة التحكم</span>
                    <HomeIcon className="w-5 h-5" strokeWidth={2.5} />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1 md:flex-none border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md">
                    <Link href="/faq" className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>الأسئلة الشائعة</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1 md:flex-none border-white/20 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md">
                    <Link href="/login" className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </Link>
                  </Button>
                  <Button asChild variant="gradient" className="flex-1 md:flex-none h-12 px-8 shadow-xl">
                    <Link href="/register" className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                      <span>إنشاء حساب مجاني</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="animate-fade-up-1 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-taj-lg sm:rounded-taj-xl shadow-lg border border-white/50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="w-full md:flex-1 relative">
            <Input
              type="text"
              placeholder="ابحث باسم المعلم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>
          
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

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-xl font-bold animate-pulse">
            جاري البحث...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={SearchX}
                  title="لا يوجد معلمين يطابقون بحثك"
                  subtitle="جرب تغيير كلمات البحث أو تصفية المواد"
                />
              </div>
            ) : (
              teachers.map((teacher, index) => (
                <Card
                  key={teacher.id}
                  className="animate-fade-up hover:border-brand-100 hover:-translate-y-1.5 group flex flex-col"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardHeader className="flex flex-row items-center gap-4 mb-1 pb-2">
                    <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-brand-50 to-purple-50 border border-brand-100/50 rounded-taj-lg flex items-center justify-center text-brand-600 font-bold text-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 mb-1.5">
                        {teacher.name}
                      </CardTitle>
                      <span className="inline-flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50/80 px-2.5 py-1 rounded-taj-sm font-bold">
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
                  <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-50 mt-auto gap-4 sm:gap-0">
                    <div className="flex flex-col items-center sm:items-start gap-1">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedTeacherForReviews({ id: teacher.id, name: teacher.name });
                      }}
                      className="text-amber-500 font-bold flex items-center gap-1.5 text-lg hover:scale-105 transition-transform"
                    >
                      <Star size={18} className="fill-amber-500" />
                      {teacher.teacher_profile?.average_rating || "0.00"}
                      <span className="text-[10px] text-gray-400 font-medium mr-1">
                        ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                      </span>
                    </button>
                      <span className={cn(
                        "text-[10px] font-bold flex items-center gap-1 transition-colors duration-300",
                        (teacher.active_slots_count || 0) > 0 ? "text-emerald-600" : "text-gray-400"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          (teacher.active_slots_count || 0) > 0 ? "bg-emerald-500 animate-pulse-dot" : "bg-gray-300"
                        )} />
                        {(teacher.active_slots_count || 0) > 0
                          ? `${teacher.active_slots_count} موعد متاح`
                          : "لا توجد مواعيد"}
                      </span>
                    </div>
                    {(teacher.active_slots_count || 0) > 0 ? (
                      <Button asChild variant="default" className="w-full sm:w-auto px-6 rounded-taj-lg">
                        <Link href={`/teachers/${teacher.id}`}>احجز الآن</Link>
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs rounded-xl font-bold bg-gray-100 text-gray-400 cursor-not-allowed select-none w-full sm:w-auto justify-center">
                        <CalendarX size={14} />
                        لا توجد مواعيد متاحة
                      </span>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        )}

        <TeacherReviewsModal
          isOpen={!!selectedTeacherForReviews}
          teacherId={selectedTeacherForReviews?.id || null}
          teacherName={selectedTeacherForReviews?.name || ""}
          onClose={() => setSelectedTeacherForReviews(null)}
        />
      </div>
    </div>
  );
}