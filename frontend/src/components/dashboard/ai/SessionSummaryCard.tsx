"use client";

import React, { useState } from "react";
import { SessionSummary } from "@/types";
import { Sparkles, CheckCircle2, Copy, Check, BookOpen, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SessionSummaryCardProps {
  summary: SessionSummary | null | undefined;
  isLoading?: boolean;
  onRetry?: () => void;
}

export const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({
  summary,
  isLoading = false,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!summary?.content) return;
    navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || summary?.status === "pending") {
    return (
      <div className="bg-gradient-to-br from-brand-50/50 via-white to-purple-50/30 border border-brand-100 rounded-2xl p-6 sm:p-8 text-center animate-pulse">
        <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-slate-800 mb-1">
          جاري إعداد الملخص الذكي بواسطة الذكاء الاصطناعي...
        </h4>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          يقوم المساعد التربوي الذكي بتحليل موضوع الجلسة وتجهيز مراجعة مخصصة ونقاط مستفادة واختبار قصير لك.
        </p>
      </div>
    );
  }

  if (summary?.status === "failed") {
    return (
      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-amber-900 mb-1">
          تعذر توليد الملخص الذكي تلقائياً
        </h4>
        <p className="text-amber-700 text-xs sm:text-sm mb-4">
          يمكنك النقر على الزر أدناه لإعادة محاولة التوليد مجدداً.
        </p>
        {onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
          >
            <RefreshCw className="w-4 h-4 ml-2" /> إعادة المحاولة
          </Button>
        )}
      </div>
    );
  }

  if (!summary || !summary.content) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
        لا يتوفر ملخص لهذه الجلسة حتى الآن.
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              ملخص الجلسة التعليمية
              <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-bold border border-brand-200">
                {summary.model_used || "ذكاء اصطناعي"}
              </span>
            </h3>
            <p className="text-xs text-slate-500">تم إعداده وتلخيصه آلياً لمساعدتك على المذاكرة السريعة</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="text-xs border-slate-200 text-slate-600 hover:text-brand-600 rounded-xl h-8 px-3"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 ml-1 text-emerald-600" /> تم النسخ
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 ml-1" /> نسخ الملخص
            </>
          )}
        </Button>
      </div>

      {/* Summary Content Body */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800">
        <div className="prose prose-sm sm:prose-base max-w-none text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
          {summary.content}
        </div>
      </div>

      {/* Key Takeaways */}
      {summary.key_takeaways && summary.key_takeaways.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            أهم النقاط المستفادة من الحصة
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {summary.key_takeaways.map((point, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs hover:border-brand-200 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-normal">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
