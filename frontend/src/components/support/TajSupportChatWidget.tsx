"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Headphones,
  Ticket,
  ChevronDown,
  ExternalLink,
  Bot,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { supportService } from "@/services/api/supportService";
import { SupportChatMessage } from "@/types";

// ─── SVG WhatsApp Icon ────────────────────────────────────────────────────────
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.213 8.213 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
    </svg>
  );
}

// ─── Simple Markdown Renderer for Chat ─────────────────────────────────────────
function ChatMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Heading
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-black text-slate-900 pt-1 text-sm sm:text-base">
              {trimmed.replace("### ", "")}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-black text-slate-900 pt-1.5 text-sm sm:text-base">
              {trimmed.replace("## ", "")}
            </h3>
          );
        }

        // Unordered list
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const listText = trimmed.replace(/^[-*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 ps-1">
              <span className="text-brand-600 font-black select-none">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(listText) }} />
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 ps-1">
              <span className="text-brand-600 font-bold select-none">{numMatch[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(numMatch[2]) }} />
            </div>
          );
        }

        // Regular paragraph with bold support
        return (
          <p key={idx} dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />
        );
      })}
    </div>
  );
}

function formatBold(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
}

// ─── Default Quick Suggestion Chips ────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = [
  "كيف أبدأ بحجز أول حصة؟",
  "كيف يضمن نظام Escrow حقي المالي؟",
  "ماذا لو انقطع الإنترنت أثناء الحصة؟",
  "كيف يتم احتساب أرباح المعلم وسحبها؟",
];

export const TajSupportChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const pathname = usePathname();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore messages from sessionStorage on initial mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("taj_support_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // Ignore session storage errors
    }

    // Default welcome message if empty
    setMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content:
          "مرحباً بك في منصة **تاج التعليمية**! 👋\n\nأنا مساعدك الذكي للإجابة الفورية عن الحجوزات، الأمان المالي، سياسات المنصة، وأي استفسار تريده على مدار الساعة.\n\nكيف يمكنني مساعدتك اليوم؟",
        timestamp: new Date().toISOString(),
        suggested_questions: DEFAULT_SUGGESTIONS,
      },
    ]);
  }, []);

  // Save messages to sessionStorage when updated
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem("taj_support_chat_history", JSON.stringify(messages));
      } catch {
        // Ignore session storage quota errors
      }
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputValue).trim();
      if (!text || isLoading) return;

      const userMessage: SupportChatMessage = {
        id: "msg-" + Date.now(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputValue("");
      setIsLoading(true);

      try {
        // Prepare payload for backend (role & content only)
        const payload = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await supportService.sendMessage(payload);

        const botMessage: SupportChatMessage = {
          id: "msg-" + Date.now() + "-reply",
          role: "assistant",
          content: res.data.reply,
          timestamp: new Date().toISOString(),
          needs_human_support: res.data.needs_human_support,
          support_options: res.data.support_options,
          suggested_questions: res.data.suggested_questions,
        };

        setMessages((prev) => [...prev, botMessage]);

        if (!isOpen) {
          setHasUnread(true);
        }
      } catch {
        const fallbackErrorMessage: SupportChatMessage = {
          id: "msg-" + Date.now() + "-err",
          role: "assistant",
          content:
            "نعتذر منك، حدث خطأ مؤقت في الاتصال. يمكنك إعادة المحاولة أو التواصل المباشر مع موظف الدعم الفني.",
          timestamp: new Date().toISOString(),
          needs_human_support: true,
          support_options: {
            whatsapp: {
              phone: "+967774344625",
              link: "https://wa.me/967774344625?text=" + encodeURIComponent("مرحباً فريق دعم منصة تاج التعليمية، أحتاج لمساعدتكم."),
              label: "التحدث مع موظف الدعم عبر واتساب (+967774344625)",
            },
            ticket: {
              link: "/dashboard/support",
              label: "فتح تذكرة دعم فني",
            },
          },
        };

        setMessages((prev) => [...prev, fallbackErrorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, messages, isOpen]
  );

  // Listen for global custom event to open chat (e.g. from FAQ page button)
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ initialQuestion?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.initialQuestion) {
        handleSendMessage(customEvent.detail.initialQuestion);
      }
    };

    window.addEventListener("open-taj-support-chat", handleOpen);
    return () => window.removeEventListener("open-taj-support-chat", handleOpen);
  }, [handleSendMessage]);

  const handleClearChat = () => {
    const defaultWelcome: SupportChatMessage = {
      id: "welcome-reset",
      role: "assistant",
      content:
        "تم مسح المحادثة السابقة. مرحباً بك مجدداً في **مساعد تاج الذكي**! كيف يمكنني مساعدتك؟",
      timestamp: new Date().toISOString(),
      suggested_questions: DEFAULT_SUGGESTIONS,
    };
    setMessages([defaultWelcome]);
    try {
      sessionStorage.removeItem("taj_support_chat_history");
    } catch {
      // Ignore
    }
  };

  // Do not show the floating widget inside active classroom session to avoid overlapping Agora controls
  if (pathname?.startsWith("/classroom")) {
    return null;
  }

  return (
    <>
      {/* ─── Floating Action Button (FAB) ─────────────────────────────────── */}
      <div className="fixed bottom-6 start-6 z-40 print:hidden">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="فتح المساعد الذكي للدعم الفني"
          className={`group relative flex items-center gap-2.5 px-4 py-3 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
            isOpen
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white hover:shadow-brand-500/40 hover:-translate-y-1"
          }`}
        >
          {/* Animated Glow on Idle */}
          {!isOpen && (
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-brand-500 to-purple-500 opacity-60 blur-xs group-hover:opacity-100 transition duration-300 animate-pulse -z-10" />
          )}

          {isOpen ? (
            <>
              <ChevronDown className="w-5 h-5 transition-transform duration-300" />
              <span className="text-xs sm:text-sm font-bold">إغلاق المساعد</span>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
                </div>
                {hasUnread && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-ping" />
                )}
              </div>
              <div className="flex flex-col text-start leading-tight">
                <span className="text-xs sm:text-sm font-black tracking-wide flex items-center gap-1">
                  مساعد تاج الذكي
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </span>
                <span className="text-[10px] text-white/80 font-medium hidden sm:inline">
                  إجابات فورية 24/7
                </span>
              </div>
            </>
          )}
        </button>
      </div>

      {/* ─── Expandable Chat Modal / Drawer ──────────────────────────────── */}
      {isOpen && (
        <div
          dir="rtl"
          className="fixed bottom-[88px] sm:bottom-24 start-4 sm:start-6 z-[60] w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[calc(100vh-120px)] bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl shadow-brand-900/20 flex flex-col overflow-hidden ring-1 ring-slate-900/10 animate-fade-in-up"
          style={{ bottom: "88px" }}
        >
          {/* Top Decorative Gradient Line */}
          <div className="h-1.5 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 shrink-0" />

          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-b from-slate-50 to-white/90 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-slate-900">مساعد تاج الذكي</h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-50 text-brand-700 rounded-md border border-brand-100 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  متصل الآن • جاهز لمساعدتك
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="مسح المحادثة والبدء من جديد"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="إغلاق النافذة"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-slate-800 text-white shadow-xs"
                        : "bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-xs"
                    }`}
                  >
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble Content */}
                  <div className={`max-w-[82%] sm:max-w-[85%] space-y-2`}>
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm shadow-xs ${
                        isUser
                          ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-te-none"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-ts-none"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <ChatMarkdown content={msg.content} />
                      )}
                    </div>

                    {/* 🚨 بطاقة التحويل البشري المزدوجة (واتساب + تذكرة الدعم) ──────────────── */}
                    {msg.needs_human_support && msg.support_options && (
                      <div className="p-3 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/90 rounded-2xl shadow-xs space-y-2.5 animate-fade-in">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                          <Headphones className="w-3.5 h-3.5 text-amber-600" />
                          <span>يتطلب هذا استجابة مباشرة من فريق الدعم</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          نظراً لحساسية طلبك وحرصنا على حقوقك، يمكنك التواصل فوراً عبر أي من الخيارين المتاحين:
                        </p>

                        <div className="flex flex-col gap-2 pt-1">
                          {/* الخيار الأول: واتساب الرسمي (+967774344625) */}
                          {msg.support_options.whatsapp && (
                            <a
                              href={msg.support_options.whatsapp.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <WhatsAppIcon className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                                <span>التحدث مع الدعم عبر واتساب</span>
                              </div>
                              <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded-md font-mono" dir="ltr">
                                {msg.support_options.whatsapp.phone}
                              </span>
                            </a>
                          )}

                          {/* الخيار الثاني: تذكرة دعم فني عبر المنصة */}
                          {msg.support_options.ticket && (
                            <Link
                              href={msg.support_options.ticket.link}
                              className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-slate-700 hover:text-brand-700 font-bold text-xs rounded-xl shadow-2xs transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-brand-600" />
                                <span>{msg.support_options.ticket.label}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Suggested follow-up questions */}
                    {msg.suggested_questions && msg.suggested_questions.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {msg.suggested_questions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isLoading}
                            className="text-[11px] font-semibold bg-white border border-slate-200/80 hover:border-brand-300 hover:bg-brand-50/50 text-slate-600 hover:text-brand-700 px-2.5 py-1 rounded-lg shadow-2xs transition-all text-start"
                          >
                            💡 {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs ps-9 pt-1 animate-pulse">
                <div className="flex items-center gap-1 bg-white border border-slate-200/80 px-2.5 py-1.5 rounded-xl shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-500 font-medium ms-1.5">المساعد يفكر...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-100 shrink-0 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="اكتب سؤالك هنا (مثال: كيف أضمن حقي المالي؟)..."
                disabled={isLoading}
                maxLength={1000}
                className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="إرسال السؤال"
                className="p-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-brand-500/30 transition-all shrink-0 active:scale-95"
              >
                <Send className="w-4 h-4 rtl:-rotate-90" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                خصوصية تامة وحماية لبياناتك
              </span>
              <span>مدعوم بذكاء منصة تاج</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
