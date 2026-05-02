"use client";

import React, { useEffect, useState } from "react";
import { discoveryService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import Modal from "@/components/ui/Modal";
import { Star, MessageSquare, Loader2, CalendarDays } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { formatDate } from "@/lib/formatters";

interface TeacherReviewsModalProps {
  teacherId: number | null;
  teacherName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Generates a deterministic pastel background + contrasting text colour
 * from any Arabic (or Latin) name string.
 * Returns { bg, text } Tailwind class strings.
 */
function getAvatarColour(name: string): { bg: string; text: string } {
  const palettes = [
    { bg: "bg-violet-100",  text: "text-violet-700" },
    { bg: "bg-indigo-100",  text: "text-indigo-700" },
    { bg: "bg-sky-100",     text: "text-sky-700"    },
    { bg: "bg-emerald-100", text: "text-emerald-700"},
    { bg: "bg-amber-100",   text: "text-amber-700"  },
    { bg: "bg-rose-100",    text: "text-rose-700"   },
    { bg: "bg-fuchsia-100", text: "text-fuchsia-700"},
    { bg: "bg-teal-100",    text: "text-teal-700"   },
  ];
  // Simple hash: sum of char codes → stable index
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return palettes[hash % palettes.length];
}

export default function TeacherReviewsModal({
  teacherId,
  teacherName,
  isOpen,
  onClose,
}: TeacherReviewsModalProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
    }
  }, [isOpen, teacherId]);

  const { data: reviewsData, isLoading: loading } = useQuery({
    queryKey: ["teacher-reviews-public", teacherId, page],
    queryFn: () => discoveryService.getTeacherReviews(teacherId!, page),
    enabled: isOpen && !!teacherId,
  });

  const reviews = reviewsData?.data?.data || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تقييمات الأستاذ ${teacherName}`} size="lg">
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold">جاري تحميل التقييمات...</p>
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="لا توجد تقييمات بعد"
            subtitle="هذا المعلم لم يتلقَ أي تقييمات من الطلاب حتى الآن."
          />
        ) : (
          <>
            {/* ─── Review list with slim custom scrollbar ─── */}
            <div className="grid grid-cols-1 gap-3 max-h-[55vh] overflow-y-auto pl-1 scrollbar-thin">
              {reviews.map((review) => {
                // Dynamic avatar: first character of student name (or '؟' if unknown)
                const studentName = review.student?.name ?? "";
                const avatarChar = studentName
                  ? studentName.charAt(0)  // first character
                  : "؟";
                const { bg, text } = getAvatarColour(studentName || String(review.id));

                return (
                  <div
                    key={review.id}
                    className="bg-gray-50/50 border border-gray-100 rounded-taj-lg p-4 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      {/* ─── Left: Avatar + Name + Date ─── */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Dynamic first-letter avatar */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${bg} ${text}`}
                          aria-hidden="true"
                        >
                          {avatarChar}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 text-sm truncate">
                            {/* Privacy: show only first name token + "..." if student loaded */}
                            {studentName
                              ? studentName.split(" ")[0] + (studentName.split(" ").length > 1 ? " ..." : "")
                              : "طالب في منصة تاج"}
                          </h4>

                          {/* Review date */}
                          {review.created_at && (
                            <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                              <CalendarDays className="w-3 h-3 shrink-0" />
                              {formatDate(review.created_at, "medium")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ─── Right: Star rating ─── */}
                      <div className="flex gap-0.5 shrink-0 pt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              review.rating >= star
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-200 fill-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment body */}
                    {review.comment && (
                      <p className="mt-3 text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-taj-md border border-gray-100 font-medium">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <PaginationControls
              page={reviewsData?.data?.current_page || page}
              totalPages={reviewsData?.data?.last_page || 1}
              onPageChange={setPage}
              isLoading={loading}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
