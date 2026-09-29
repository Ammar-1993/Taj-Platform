"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { discoveryService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PaginationControls } from "@/components/ui/PaginationControls";
import DecorativeBackground from "@/components/layout/DecorativeBackground";
import {
  HelpCircle,
  LogIn,
  UserPlus,
  Search,
  BookOpen,
  ListFilter,
  Star,
  SearchX,
  CalendarX,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
  ArrowLeft,
  X,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import TeacherReviewsModal from "@/components/discovery/TeacherReviewsModal";
import { useDebounce } from "@/hooks";
import { ApiResponse, PaginatedApiResponse, Subject, User } from "@/types";

interface HomeClientProps {
  initialSubjects?: ApiResponse<Subject[]>;
  initialTeachers?: PaginatedApiResponse<User>;
}

export default function HomeClient({
  initialSubjects,
  initialTeachers,
}: HomeClientProps) {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [selectedTeacherForReviews, setSelectedTeacherForReviews] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, subjectId, sortBy]);

  // Fetch Subjects with server-provided initialData
  const { data: subjectsData } = useQuery({
    queryKey: ["discovery-subjects"],
    queryFn: () => discoveryService.getSubjects(),
    initialData: initialSubjects,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const isDefaultView =
    !debouncedSearch && !subjectId && !sortBy && page === 1;

  // Fetch Teachers with server-provided initialData for default landing view
  const { data: teachersData, isLoading: loading } = useQuery({
    queryKey: ["discovery-teachers", debouncedSearch, subjectId, sortBy, page],
    queryFn: () =>
      discoveryService.getTeachers({
        search: debouncedSearch || undefined,
        subject_id: subjectId || undefined,
        sort_by: sortBy || undefined,
        page,
      }),
    initialData: isDefaultView ? initialTeachers : undefined,
  });

  const subjects = subjectsData?.data || [];
  const teachers = teachersData?.data?.data || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl">
      
      {/* 🎭 الخلفية التفاعلية المضيئة وشبكة الماتريكس */}
      <DecorativeBackground />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* 👑 البانر الترحيبي الملكي المتجاوب (Luxury Responsive Hero Banner) */}
        <div className="animate-fade-up relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 p-6 sm:p-8 md:p-10 lg:p-12 rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-indigo-950/20 text-white border border-white/10 ring-1 ring-white/15">
          {/* هالات إضاءة ناعمة داخل البانر */}
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8">
            
            {/* النصوص الترحيبية والهوية الملكية */}
            <div className="w-full lg:max-w-2xl text-center lg:text-right">
              {/* شارة التميز */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-amber-300/30 backdrop-blur-md mb-4 shadow-sm select-none">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>المنظومة التعليمية الأولى بالمملكة</span>
              </div>

              {/* عنوان المنصة مع الشعار الملكي المصقول */}
              <div className="flex items-center justify-center lg:justify-start gap-3.5 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/25 ring-2 ring-white/30 shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-slate-950 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1s.4-1 1-1h12c.6 0 1 .4 1 1z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  منصة تاج التعليمية
                </h1>
              </div>

              <p className="text-indigo-200 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                نخبة من أمهر المعلمين المعتمدين في جميع المواد والمراحل الدراسية. اختر معلمك المفضل وانطلق نحو التفوق الأكاديمي.
              </p>

              {/* شارات الضمان والموثوقية المصغرة */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 mt-6 text-xs text-indigo-200/90 font-semibold select-none">
                <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  معلمون معتمدون
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  دفع آمن بالضمان (Escrow)
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  تقييم 4.9/5
                </span>
              </div>
            </div>

            {/* أزرار الإجراء السريع (Hero Actions) */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">
              {authLoading ? (
                <div className="h-12 w-48 bg-white/20 animate-pulse rounded-2xl" />
              ) : user ? (
                <Button
                  asChild
                  variant="gradient"
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl shadow-xl shadow-indigo-500/25 font-bold text-sm sm:text-base"
                >
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <span>العودة إلى لوحة التحكم</span>
                    <ChevronLeft className="w-5 h-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  {/* زر إنشاء حساب مجاني الملكي */}
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-105 active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>إنشاء حساب مجاني</span>
                  </Link>

                  {/* زر تسجيل الدخول الزجاجي */}
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </Link>

                  {/* زر الأسئلة الشائعة */}
                  <Link
                    href="/faq"
                    className="w-full sm:w-auto px-4 py-3.5 bg-white/5 hover:bg-white/15 border border-white/15 text-indigo-100 font-bold rounded-2xl backdrop-blur-md transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>الأسئلة الشائعة</span>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>

        {/* 🔍 وحدة التحكم في البحث والتصفية (Glassmorphic Control Center) */}
        <div className="animate-fade-up-1 bg-white/90 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl shadow-xl shadow-indigo-500/5 border border-white/95 ring-1 ring-slate-900/5 space-y-4">
          
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
            {/* حقل البحث باسم المعلم */}
            <div className="w-full md:flex-1 relative">
              <Input
                type="text"
                placeholder="ابحث باسم المعلم أو المادة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-5 h-5 text-indigo-600" />}
                className="h-12 bg-white/80 border-slate-200/80 rounded-2xl focus:border-indigo-400 text-sm font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  title="مسح"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* قائمة تصفية المواد */}
            <div className="w-full md:w-1/4 relative">
              <Select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                icon={<BookOpen className="w-5 h-5 text-indigo-600" />}
                className="h-12 bg-white/80 border-slate-200/80 rounded-2xl focus:border-indigo-400 text-sm font-bold"
              >
                <option value="">جميع المواد</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* قائمة خيارات الترتيب */}
            <div className="w-full md:w-1/4 relative">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                icon={<ListFilter className="w-5 h-5 text-indigo-600" />}
                className="h-12 bg-white/80 border-slate-200/80 rounded-2xl focus:border-indigo-400 text-sm font-bold"
              >
                <option value="">الترتيب الافتراضي</option>
                <option value="rating_desc">الأعلى تقييماً</option>
              </Select>
            </div>
          </div>

          {/* أشرطة التصفية السريعة للمواد (Quick Subject Pills) */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none select-none text-xs">
              <button
                onClick={() => setSubjectId("")}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all duration-200 ${
                  subjectId === ""
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60"
                }`}
              >
                الكل ({subjects.length})
              </button>

              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSubjectId(subjectId === String(sub.id) ? "" : String(sub.id))}
                  className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all duration-200 ${
                    subjectId === String(sub.id)
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* 👨‍🏫 شبكة بطاقات المعلمين الفاخرة (Teachers Grid) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white/80 rounded-3xl p-6 shadow-md border border-white animate-pulse space-y-4 h-64"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-9 bg-slate-200 rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    icon={SearchX}
                    title="لا يوجد معلمين يطابقون بحثك"
                    subtitle="جرب تغيير كلمات البحث أو تصفية المواد لاستكشاف بقية المعلمين."
                  />
                </div>
              ) : (
                teachers.map((teacher, index) => (
                  <div
                    key={teacher.id}
                    className="group relative bg-white/90 backdrop-blur-xl border border-white/90 hover:border-indigo-300/80 shadow-md hover:shadow-2xl hover:shadow-indigo-500/15 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between h-full overflow-hidden ring-1 ring-slate-900/5 animate-fade-up select-none"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* شريط تدرج علوي ناعم يظهر عند التحويم */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div>
                      {/* ترويسة بطاقة المعلم */}
                      <div className="flex items-center gap-4 mb-3">
                        {/* صورة أو أيقونة المعلم الفاخرة */}
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                          {teacher.name.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <h2 className="text-lg font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {teacher.name}
                            </h2>
                            <span title="معلم موثق" className="inline-flex items-center">
                              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/90 border border-indigo-100/80 px-2.5 py-0.5 rounded-full font-bold">
                            <BookOpen size={13} />
                            <span className="truncate max-w-[150px]">
                              {teacher.teacher_profile?.subject?.name || "غير محدد"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* نبذة تعريفية مختصرة */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 my-3 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                        {teacher.teacher_profile?.bio || "معلم معتمد في منصة تاج يقدم شروحات تفاعلية متميزة."}
                      </p>
                    </div>

                    {/* تذييل بطاقة المعلم */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 mt-2 gap-3 sm:gap-0">
                      
                      {/* التقييم وعدد الحصص المتاحة */}
                      <div className="flex items-center sm:flex-col sm:items-start gap-3 sm:gap-1 w-full sm:w-auto justify-between">
                        
                        {/* زر التقييم والنجوم */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if ((teacher.teacher_profile?.average_rating ?? 0) > 0) {
                              setSelectedTeacherForReviews({
                                id: teacher.id,
                                name: teacher.name,
                              });
                            }
                          }}
                          className={cn(
                            "font-black flex items-center gap-1.5 transition-all py-0.5 px-2 rounded-xl",
                            (teacher.teacher_profile?.average_rating ?? 0) > 0
                              ? "text-amber-600 bg-amber-50/90 border border-amber-200/70 hover:bg-amber-100 hover:scale-105 text-sm"
                              : "text-slate-400 bg-slate-100 text-xs cursor-default"
                          )}
                        >
                          {(teacher.teacher_profile?.average_rating ?? 0) > 0 ? (
                            <>
                              <Star size={15} className="fill-amber-500 text-amber-500" />
                              <span>{teacher.teacher_profile?.average_rating}</span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                ({teacher.teacher_profile?.reviews_count || 0})
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold">معلم جديد ⭐</span>
                          )}
                        </button>

                        {/* حالة الحصص والمواعيد المتاحة */}
                        <span
                          className={cn(
                            "text-[11px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors",
                            (teacher.active_slots_count || 0) > 0
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200/70"
                              : "text-slate-400 bg-slate-50 border-slate-200/60"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              (teacher.active_slots_count || 0) > 0
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-slate-300"
                            )}
                          />
                          {(teacher.active_slots_count || 0) > 0
                            ? `${teacher.active_slots_count} موعد متاح`
                            : "لا توجد مواعيد"}
                        </span>
                      </div>

                      {/* زر الحجز السريع */}
                      {(teacher.active_slots_count || 0) > 0 ? (
                        <Button
                          asChild
                          variant="gradient"
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 group/btn"
                        >
                          <Link href={`/teachers/${teacher.id}`} className="flex items-center justify-center gap-1.5">
                            <span>احجز الآن</span>
                            <ArrowLeft className="w-3.5 h-3.5 group-hover/btn:-translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200/60 cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <CalendarX size={14} />
                          <span>غير متاح حالياً</span>
                        </Button>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>

            {/* عناصر التنقل بين الصفحات */}
            <div className="pt-6">
              <PaginationControls
                page={teachersData?.data?.current_page || 1}
                totalPages={teachersData?.data?.last_page || 1}
                onPageChange={setPage}
                isLoading={loading}
              />
            </div>
          </>
        )}

        {/* نافذة تقييمات المعلم المنبثقة */}
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
