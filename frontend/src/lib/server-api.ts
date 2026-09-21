import { Subject, ApiResponse, PaginatedApiResponse, User, TeacherSlotsResponse } from "@/types";

const BASE_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1";

/**
 * Server-side cached fetch for available subjects.
 * Leverages Next.js Data Cache with Stale-While-Revalidate (1 hour).
 */
export async function getCachedSubjects(): Promise<ApiResponse<Subject[]>> {
  try {
    const res = await fetch(`${BASE_API_URL}/discovery/subjects`, {
      next: {
        revalidate: 3600, // 1 hour edge cache
        tags: ["catalog", "subjects"],
      },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return { status: "error", data: [] };
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch subjects server-side:", error);
    return { status: "error", data: [] };
  }
}

/**
 * Server-side cached fetch for verified teachers.
 * Leverages Next.js Data Cache with Stale-While-Revalidate (10 minutes).
 */
export async function getCachedTeachers(params?: {
  page?: number;
  search?: string;
  subject_id?: string;
  sort_by?: string;
}): Promise<PaginatedApiResponse<User>> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.search) query.set("search", params.search);
    if (params?.subject_id) query.set("subject_id", params.subject_id);
    if (params?.sort_by) query.set("sort_by", params.sort_by);

    const queryString = query.toString();
    const url = `${BASE_API_URL}/discovery/teachers${queryString ? `?${queryString}` : ""}`;

    const res = await fetch(url, {
      next: {
        revalidate: 600, // 10 minutes edge cache
        tags: ["catalog", "teachers"],
      },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return {
        status: "error",
        data: {
          data: [],
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
        },
      };
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch teachers server-side:", error);
    return {
      status: "error",
      data: {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
      },
    };
  }
}

/**
 * Server-side cached fetch for a teacher's public booking slots.
 * Leverages Next.js Data Cache with Stale-While-Revalidate (5 minutes).
 */
export async function getCachedTeacherSlots(
  teacherId: number
): Promise<TeacherSlotsResponse> {
  try {
    const res = await fetch(
      `${BASE_API_URL}/discovery/teachers/${teacherId}/slots`,
      {
        next: {
          revalidate: 300, // 5 minutes edge cache
          tags: ["slots", `teacher_${teacherId}`],
        },
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      return {
        data: {},
        teacher_name: "",
      };
    }

    return await res.json();
  } catch (error) {
    console.error(
      `Failed to fetch teacher ${teacherId} slots server-side:`,
      error
    );
    return {
      data: {},
      teacher_name: "",
    };
  }
}
