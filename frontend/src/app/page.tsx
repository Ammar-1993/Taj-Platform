import { getCachedSubjects, getCachedTeachers } from "@/lib/server-api";
import HomeClient from "@/components/discovery/HomeClient";

// 10 minutes ISR revalidation for the landing page
export const revalidate = 600;

export default async function HomePage() {
  // Fetch initial subjects and verified teachers in parallel on the server
  const [initialSubjects, initialTeachers] = await Promise.all([
    getCachedSubjects(),
    getCachedTeachers({ page: 1 }),
  ]);

  return (
    <HomeClient
      initialSubjects={initialSubjects}
      initialTeachers={initialTeachers}
    />
  );
}