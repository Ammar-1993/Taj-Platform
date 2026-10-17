"use client";

import RegistrationForm from "@/components/auth/RegistrationForm";

export default function StudentRegistrationPage() {
  return (
    <RegistrationForm
      role="student"
      emoji="🎓"
      title="إنشاء حساب طالب"
      subtitle="انضم الآن وابدأ رحلة التفوق مع نخبة المعلمين في منصة تاج"
      nameLabel="اسم الطالب *"
      nameRequiredMessage="اسم الطالب مطلوب"
      emailPlaceholder="student@taj.com"
      submitLabel="إنشاء حساب طالب"
      redirectPath="/dashboard/settings"
      redirectSubtitle="جاري توجيهك لإكمال بيانات حسابك..."
      headerBgClass="bg-indigo-500/10 border-b border-indigo-500/10"
      topBlobClass="bg-indigo-500/20"
      bottomBlobClass="bg-blue-500/20"
      backLinkHoverClass="hover:text-indigo-700"
    />
  );
}