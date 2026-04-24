import React, { useState } from "react";
import api from "@/lib/axios";
import { Booking } from "@/types";
import toast from "react-hot-toast";
import { showApiError } from "@/hooks/useApiError";
import Modal from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

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
      toast.success("تم إرسال التقييم بنجاح! شكراً لك. ⭐");
      onSuccess();
    } catch (err: unknown) {
      showApiError(err, "حدث خطأ أثناء التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!pendingReview) return null;

  return (
    <Modal isOpen={!!pendingReview} onClose={onClose} hideCloseButton size="sm">
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner border border-amber-200">
          ⭐
        </div>
        <h2 className="text-2xl font-bold text-gray-900">كيف كانت حصتك؟</h2>
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          يرجى تقييم حصتك مع الأستاذ{" "}
          <span className="font-bold text-indigo-600">
            {pendingReview.teacher?.name}
          </span>{" "}
          لتتمكن من متابعة تصفح لوحة التحكم.
        </p>
      </div>

      {/* النجوم */}
      <div className="flex justify-center gap-3 mb-6 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            className={`text-4xl transition transform hover:scale-125 duration-200 ${rating >= star ? "text-yellow-400 drop-shadow-sm" : "text-gray-200"}`}
          >
            ★
          </span>
        ))}
      </div>

      <Textarea
        label="تعليقك (اختياري):"
        placeholder="اكتب تعليقك هنا..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="mb-6"
      />

      <Button
        onClick={submitReview}
        isLoading={isSubmittingReview}
        className="w-full h-14 bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl text-lg"
      >
        {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
      </Button>
    </Modal>
  );
};
