import { 
  LayoutDashboard, 
  CalendarDays, 
  CreditCard, 
  User, 
  LifeBuoy, 
  Users,
  Search
} from "lucide-react";
import { useUserRole } from "./useUserRole";

export function useNavLinks() {
  const { isTeacher, isParent, isStudent } = useUserRole();

  const navLinks = [
    { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "البحث عن معلمين", href: "/dashboard/teachers", icon: Search, show: isParent || isStudent },
    { name: "الجدول والمواعيد", href: "/dashboard/schedule", icon: CalendarDays, show: isTeacher },
    { name: "سحب الأرباح", href: "/dashboard/payout", icon: CreditCard, show: isTeacher },
    { name: "الملف الشخصي", href: "/dashboard/profile", icon: User, show: isTeacher },
    { name: "إدارة الأبناء", href: "/dashboard/children", icon: Users, show: isParent },
    { name: "شحن المحفظة", href: "/dashboard/top-up", icon: CreditCard, show: isParent || isStudent },
    { name: "إعدادات الطالب", href: "/dashboard/student-profile", icon: User, show: isStudent },
    { name: "الدعم الفني", href: "/dashboard/support", icon: LifeBuoy, show: true },
  ];

  return navLinks.filter(link => link.show);
}
