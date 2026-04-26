"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { Review, ApiResponse } from "@/types";
import Modal from "@/components/ui/Modal";
import { Star, MessageSquare, User, Loader2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

interface TeacherReviewsModalProps {
  teacherId: number | null;
  teacherName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TeacherReviewsModal({
  teacherId,
  teacherName,
  isOpen,
  onClose,
}: TeacherReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ data: Review[] }>>(`/discovery/teachers/${teacherId}/reviews`);
      setReviews(res.data.data.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    if (isOpen && teacherId) {
      fetchReviews();
    }
  }, [isOpen, teacherId, fetchReviews]);

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
          <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-100">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-gray-50/50 border border-gray-100 rounded-taj-lg p-5 transition-all hover:bg-white hover:shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">طالب في منصة تاج</h4>
                      <p className="text-[10px] text-gray-400">تقييم معتمد</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={`${
                            review.rating >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-taj-md border border-gray-50 font-medium">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
