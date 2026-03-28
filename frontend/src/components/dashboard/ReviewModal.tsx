import React, { useState } from "react";
import api from "@/lib/axios";
import { Booking } from "@/types";

interface ReviewModalProps {
  pendingReview: Booking | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ pendingReview, onSuccess, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const submitReview = async () => {
    if (!pendingReview) return;
    setIsSubmittingReview(true);
    try {
      await api.post("/reviews", {
        booking_id: pendingReview.id,
        rating: rating,
        comment: comment,
      });
      alert("تم إرسال التقييم بنجاح! شكراً لك.");
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "حدث خطأ أثناء التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!pendingReview) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up border border-gray-100">
        {/* زر الإغلاق الاختياري */}
        {/* <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">×</button> */}

        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg">
            ⭐
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">كيف كانت حصتك؟</h2>
          <p className="text-gray-500 mt-2">
            يرجى تقييم حصتك مع الأستاذ{" "}
            <span className="font-bold text-blue-600">
              {pendingReview.teacher?.name}
            </span>{" "}
            لتتمكن من متابعة تصفح لوحة التحكم.
          </p>
        </div>

        {/* النجوم */}
        <div className="flex justify-center gap-2 mb-6 cursor-pointer">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              className={`text-4xl transition transform hover:scale-110 ${rating >= star ? "text-yellow-400" : "text-gray-200"}`}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="اكتب تعليقك هنا (اختياري)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl p-3 mb-6 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
        />

        <button
          onClick={submitReview}
          disabled={isSubmittingReview}
          className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-extrabold py-3.5 rounded-xl hover:shadow-xl transition-all duration-200 disabled:opacity-50 hover:-translate-y-0.5"
        >
          {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
        </button>
      </div>
    </div>
  );
};
