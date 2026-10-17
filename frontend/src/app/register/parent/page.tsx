"use client";

import RegistrationForm from "@/components/auth/RegistrationForm";

export default function ParentRegistrationPage() {
  return (
    <RegistrationForm
      role="parent"
      emoji="👨‍👩‍👧‍👦"
      title="إنشاء حساب ولي أمر"
      subtitle="تابع تقدم أبنائك الأكاديمي وكن شريكاً في نجاحهم مع نخبة المعلمين"
      nameLabel="اسم ولي الأمر *"
      nameRequiredMessage="اسم ولي الأمر مطلوب"
      emailPlaceholder="parent@taj.com"
      submitLabel="إنشاء حساب ولي أمر"
      redirectPath="/dashboard"
      redirectSubtitle="جاري توجيهك إلى لوحة التحكم..."
      headerBgClass="bg-purple-500/10 border-b border-purple-500/10"
      topBlobClass="bg-purple-500/20"
      bottomBlobClass="bg-fuchsia-500/20"
      backLinkHoverClass="hover:text-purple-700"
    />
  );
}
