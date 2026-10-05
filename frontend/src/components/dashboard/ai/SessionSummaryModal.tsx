"use client";

import React, { useState, useEffect, useCallback } from "react";
import { bookingService } from "@/services/api/bookingService";
import { SessionSummary, SessionQuiz } from "@/types";
import { SessionSummaryCard } from "./SessionSummaryCard";
import { InteractiveQuiz } from "./InteractiveQuiz";
import {
  X,
  Sparkles,
  HelpCircle,
  BookOpen,
  Award,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SessionSummaryModalProps {
  bookingId: number | null;
  isOpen: boolean;
  onClose: () => void;
  isTeacher?: boolean;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  bookingId,
  isOpen,
  onClose,
  isTeacher = false,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "quiz">("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [quiz, setQuiz] = useState<SessionQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!bookingId) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await bookingService.getSessionSummary(bookingId);

      if (res.data) {
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (res.data.quiz) {
          setQuiz(res.data.quiz);
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "تعذر جلب ملخص الجلسة حالياً.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchSummary();
      setActiveTab("summary");
    } else {
      setSummary(null);
      setQuiz(null);
      setError(null);
    }
  }, [isOpen, bookingId, fetchSummary]);

  const handleManualGenerate = async () => {
    if (!bookingId) return;

    try {
      setIsRetrying(true);
      await bookingService.generateSessionSummary(bookingId);
      // Wait 1.5 seconds then re-fetch
      setTimeout(() => {
        fetchSummary();
        setIsRetrying(false);
      }, 1500);
    } catch {
      setIsRetrying(false);
    }
  };

  if (!isOpen || !bookingId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-brand-50/40 via-white to-purple-50/20 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                المساعد الذكي للجلسة
                <span className="text-xs font-normal text-slate-500">#{bookingId}</span>
              </h2>
              <p className="text-xs text-slate-500">ملخص أكاديمي ذكي واختبار تفاعلي لقياس الفهم</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualGenerate}
              disabled={isRetrying || isLoading}
              className="text-xs text-slate-500 hover:text-brand-600 rounded-xl h-8 px-2.5"
              title="تحديث الملخص"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl h-8 w-8 p-0 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "summary"
                ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ملخص الدرس والنقاط</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "quiz"
                ? "bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>الاختبار التفاعلي</span>
            {quiz?.completed_at && quiz.score !== null && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                {quiz.score}/{quiz.total_questions}
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                جاري تحميل محتوى الذكاء الاصطناعي...
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-5 rounded-2xl text-center text-sm">
              <p className="font-bold mb-3">{error}</p>
              <Button
                size="sm"
                onClick={handleManualGenerate}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5 ml-1.5" /> إعادة المحاولة
              </Button>
            </div>
          ) : activeTab === "summary" ? (
            <SessionSummaryCard
              summary={summary}
              isLoading={isLoading}
              onRetry={handleManualGenerate}
            />
          ) : (
            <InteractiveQuiz
              quiz={quiz}
              bookingId={bookingId}
              isTeacher={isTeacher}
              onSolved={fetchSummary}
            />
          )}
        </div>
      </div>
    </div>
  );
};
