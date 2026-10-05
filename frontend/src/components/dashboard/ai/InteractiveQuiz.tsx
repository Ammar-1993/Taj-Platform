"use client";

import React, { useState } from "react";
import { SessionQuiz, QuizResultItem } from "@/types";
import { bookingService } from "@/services/api/bookingService";
import { Button } from "@/components/ui/Button";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  Lightbulb,
  Send,
  Loader2,
} from "lucide-react";

interface InteractiveQuizProps {
  quiz: SessionQuiz | null | undefined;
  bookingId: number;
  isTeacher?: boolean;
  onSolved?: () => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  quiz,
  bookingId,
  isTeacher = false,
  onSolved,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string | number, number>>(
    quiz?.student_answers || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResults, setSubmittedResults] = useState<{
    score: number;
    total: number;
    percentage: number;
    results: QuizResultItem[];
  } | null>(null);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
        لا يتوفر اختبار لهذه الجلسة حالياً.
      </div>
    );
  }

  const isAlreadySolved = Boolean(quiz.completed_at) || Boolean(submittedResults);
  const allAnswered = quiz.questions.every((q) => selectedAnswers[q.id] !== undefined);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isAlreadySolved || isTeacher) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!allAnswered || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await bookingService.submitQuiz(bookingId, selectedAnswers);

      setSubmittedResults({
        score: res.data.score,
        total: res.data.total_questions,
        percentage: res.data.percentage,
        results: res.data.results,
      });

      if (onSolved) {
        onSolved();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "تعذر إرسال الإجابات، يرجى المحاولة مرة أخرى.";
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayScore = submittedResults ? submittedResults.score : quiz.score;
  const displayTotal = submittedResults ? submittedResults.total : quiz.total_questions;
  const displayPercentage = submittedResults
    ? submittedResults.percentage
    : displayTotal && displayScore !== null
    ? Math.round((displayScore / displayTotal) * 100)
    : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{quiz.title || "اختبار فهم الدرس"}</h3>
            <p className="text-xs text-slate-500">
              {isTeacher
                ? "معاينة الأسئلة التعليمية ونموذج الإجابة"
                : isAlreadySolved
                ? "تم الانتهاء من حل الاختبار وتصحيحه"
                : `أجب عن ${quiz.questions.length} أسئلة قصيرة لاختبار استيعابك`}
            </p>
          </div>
        </div>

        {isAlreadySolved && displayScore !== null && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-900">
              النتيجة: {displayScore} من {displayTotal} ({displayPercentage}%)
            </span>
          </div>
        )}
      </div>

      {/* Completion Banner */}
      {isAlreadySolved && (
        <div className="bg-gradient-to-l from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 text-sm sm:text-base">
              {displayPercentage >= 80
                ? "أداء متميز ورائع! 🌟"
                : displayPercentage >= 50
                ? "أحسنت! إجابات جيدة 👍"
                : "فرصة رائعة للمراجعة والتعلم 💡"}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-700 mt-0.5">
              حصلت على {displayScore} من إجمالي {displayTotal} أسئلة. يمكنك مراجعة الشروحات التفصيلية لكل سؤال أدناه.
            </p>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {quiz.questions.map((question, qIdx) => {
          const chosenAnswer = selectedAnswers[question.id];

          // Check if we have detailed result from submission or if question has answers
          const resultDetail = submittedResults?.results.find((r) => r.id === question.id);
          const correctAnswerIndex =
            resultDetail?.correct_answer_index ?? question.correct_answer_index;
          const explanationText = resultDetail?.explanation ?? question.explanation;

          return (
            <div
              key={question.id || qIdx}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4"
            >
              {/* Question Title */}
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {qIdx + 1}
                </span>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed">
                  {question.question}
                </h4>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {question.options.map((option, optIdx) => {
                  const isSelected = chosenAnswer === optIdx;
                  const isCorrect = correctAnswerIndex !== undefined && correctAnswerIndex === optIdx;
                  const isWrongSelected = isAlreadySolved && isSelected && !isCorrect;

                  let optionStyle =
                    "border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-700";

                  if (isAlreadySolved) {
                    if (isCorrect) {
                      optionStyle = "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-bold";
                    } else if (isWrongSelected) {
                      optionStyle = "border-rose-400 bg-rose-50/80 text-rose-900";
                    } else {
                      optionStyle = "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-brand-600 bg-brand-50/70 text-brand-900 font-bold ring-2 ring-brand-100";
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAlreadySolved || isTeacher}
                      onClick={() => handleSelectOption(question.id, optIdx)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-right transition-all text-xs sm:text-sm ${optionStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-bold">
                          {["أ", "ب", "ج", "د"][optIdx] || optIdx + 1}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAlreadySolved && (
                        <div>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {isWrongSelected && <XCircle className="w-4 h-4 text-rose-500" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pedagogical Explanation Box */}
              {isAlreadySolved && explanationText && (
                <div className="mt-3 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">توضيح تربوي:</span>
                    {explanationText}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm p-3 rounded-xl font-medium">
          {submitError}
        </div>
      )}

      {/* Submit Button (Only for students who haven't completed it) */}
      {!isTeacher && !isAlreadySolved && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <span className="text-xs text-slate-500">
            {allAnswered
              ? "أجبت على جميع الأسئلة! يمكنك الآن اعتماد الحل."
              : `تبقى ${
                  quiz.questions.length - Object.keys(selectedAnswers).length
                } سؤال للإجابة.`}
          </span>

          <Button
            size="default"
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl px-6 h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري التصحيح...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 ml-2" /> إرسال وتصحيح الاختبار
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
