"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { User, Subject } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Search, BookOpen, ListFilter, Star, SearchX, GraduationCap } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function DashboardTeachers() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(true);

  const { loading: authLoading } = useAuth();

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

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTeachers();
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [fetchTeachers]);

  if (authLoading) return null;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white rounded-3xl shadow-sm border border-gray-100 gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0 shadow-inner">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              البحث عن معلمين
            </h1>
            <p className="text-gray-500 text-sm">
              استكشف نخبة من المعلمين المتميزين واحجز حصتك الآن.
            </p>
          </div>
        </div>
      </div>

      {/* Modernized Search & Filters */}
      <Card variant="glass" className="p-4 sm:p-5 flex flex-col lg:flex-row gap-4 justify-between items-center animate-fade-in-up-delay">
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
      </Card>

      {/* Teacher Grid */}
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
                variant="glass"
                className="animate-fade-in-up hover:border-indigo-100 hover:-translate-y-1.5 group flex flex-col transition-all duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardHeader className="flex flex-row items-center gap-4 mb-1 pb-2">
                  <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
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
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-50 mt-auto gap-4 sm:gap-0">
                  <div className="flex flex-col items-center sm:items-start gap-1">
                    <span className="text-amber-500 font-bold flex items-center gap-1.5 text-lg">
                      <Star size={18} className="fill-amber-500" />
                      {teacher.teacher_profile?.average_rating || "0.00"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      ({teacher.teacher_profile?.reviews_count || 0} تقييم)
                    </span>
                  </div>
                  <Button asChild variant="default" className="w-full sm:w-auto px-6 rounded-2xl">
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
  );
}
