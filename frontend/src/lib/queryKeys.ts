/**
 * Centralized TanStack Query Key Factory.
 * Guarantees deterministic, type-safe cache keys across all queries,
 * mutations, optimistic updates, and real-time WebSocket invalidations.
 */
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    byUser: (userId?: number) => ["dashboard", userId] as const,
    page: (userId?: number, page?: number) => ["dashboard", userId, page] as const,
  },
  parentDashboard: {
    all: ["parentDashboard"] as const,
    byUser: (userId?: number) => ["parentDashboard", userId] as const,
    page: (userId?: number, page?: number) => ["parentDashboard", userId, page] as const,
  },
  wallet: {
    all: ["wallet"] as const,
    byUser: (userId?: number) => ["wallet", userId] as const,
    paginated: (page = 1, type?: string) => ["wallet", page, type] as const,
  },
  payouts: {
    all: ["payouts"] as const,
    byUser: (userId?: number) => ["payouts", userId] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    byUser: (userId?: number) => ["bookings", userId] as const,
  },
  supportTickets: {
    all: ["support-tickets"] as const,
    byUser: (userId?: number) => ["support-tickets", userId] as const,
    page: (userId?: number, page?: number) => ["support-tickets", userId, page] as const,
  },
  parentChildren: {
    all: ["parent-children"] as const,
    byUser: (userId?: number) => ["parent-children", userId] as const,
  },
  teacherProfile: {
    all: ["teacher-profile"] as const,
    byUser: (userId?: number) => ["teacher-profile", userId] as const,
  },
  teacherSlots: {
    all: ["teacher-slots"] as const,
    byUser: (userId?: number) => ["teacher-slots", userId] as const,
    publicByTeacher: (teacherId: string | number) =>
      ["teacher-slots-public", String(teacherId)] as const,
  },
  teacherReviews: {
    all: ["teacher-reviews-public"] as const,
    publicByTeacher: (teacherId: number | null, page = 1) =>
      ["teacher-reviews-public", teacherId, page] as const,
  },
  discovery: {
    subjects: ["discovery-subjects"] as const,
    gradeLevels: ["grade-levels"] as const,
    allTeachers: ["discovery-teachers"] as const,
    teachers: (search = "", subjectId = "", sortBy = "", page = 1) =>
      ["discovery-teachers", search, subjectId, sortBy, page] as const,
  },
} as const;
