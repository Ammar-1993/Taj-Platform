"use client";

import RegistrationForm from "@/components/auth/RegistrationForm";

export default function TeacherRegistrationPage() {
  return (
    <RegistrationForm
      role="teacher"
      emoji="👨‍🏫"
      title="إنشاء حساب معلم"
      subtitle="انضم لنخبة المعلمين في منصة تاج وابدأ رحلتك التعليمية"
      nameLabel="الاسم الكامل (كما في الهوية) *"
      nameRequiredMessage="اسم المعلم مطلوب"
      emailPlaceholder="teacher@taj.com"
      submitLabel="إنشاء حساب معلم"
      redirectPath="/dashboard"
      redirectSubtitle="جاري توجيهك للوحة التحكم لاستكمال التوثيق..."
      headerBgClass="bg-emerald-500/10 border-b border-emerald-500/10"
      topBlobClass="bg-emerald-500/20"
      bottomBlobClass="bg-teal-500/20"
      backLinkHoverClass="hover:text-emerald-700"
    />
  );
}