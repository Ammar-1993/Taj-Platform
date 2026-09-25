import { getCachedTeacherSlots } from "@/lib/server-api";
import TeacherProfileClient from "@/components/teachers/TeacherProfileClient";
import type { Metadata } from "next";

export const revalidate = 300; // 5 minutes ISR revalidation

interface TeacherPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TeacherPageProps): Promise<Metadata> {
  const { id } = await params;
  const slotsData = await getCachedTeacherSlots(Number(id));
  const teacherName = slotsData?.teacher_name || "معلم معتمد";
  const subjectName = slotsData?.teacher?.teacher_profile?.subject?.name;

  return {
    title: `${teacherName}${subjectName ? ` - معلم ${subjectName}` : ""} | منصة تاج التعليمية`,
    description: `احجز حصتك الخاصة الآن مع المعلم المعتمد ${teacherName} على منصة تاج التعليمية. جدول المواعيد متاح للحجز الفوري.`,
    openGraph: {
      title: `${teacherName} | منصة تاج التعليمية`,
      description: `احجز حصتك الخاصة الآن مع المعلم المعتمد ${teacherName} على منصة تاج التعليمية.`,
    },
  };
}

export default async function TeacherPage({ params }: TeacherPageProps) {
  const { id } = await params;
  const initialSlots = await getCachedTeacherSlots(Number(id));

  return (
    <TeacherProfileClient
      teacherId={id}
      initialSlots={initialSlots}
    />
  );
}
