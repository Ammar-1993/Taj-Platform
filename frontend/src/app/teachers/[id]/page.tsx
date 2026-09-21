import { getCachedTeacherSlots } from "@/lib/server-api";
import TeacherProfileClient from "@/components/teachers/TeacherProfileClient";
import type { Metadata } from "next";

export const revalidate = 300; // 5 minutes ISR revalidation

interface TeacherPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: TeacherPageProps): Promise<Metadata> {
  const slotsData = await getCachedTeacherSlots(Number(params.id));
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
  const initialSlots = await getCachedTeacherSlots(Number(params.id));

  return (
    <TeacherProfileClient
      teacherId={params.id}
      initialSlots={initialSlots}
    />
  );
}
