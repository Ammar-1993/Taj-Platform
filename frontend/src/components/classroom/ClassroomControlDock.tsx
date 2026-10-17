import React from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  LogOut,
  PowerOff,
  MonitorUp,
  Presentation,
  LayoutGrid,
} from "lucide-react";

export interface ClassroomControlDockProps {
  isUiHidden: boolean;
  userRole: "host" | "audience";
  isTeacher: boolean;
  micStatus: "pending" | "granted" | "denied";
  cameraStatus: "pending" | "granted" | "denied";
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
  hasWhiteboardData: boolean;
  whiteboardPending: boolean;
  showWhiteboard: boolean;
  isSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onDeniedClick: (type: "camera" | "mic") => void;
  onToggleWhiteboard: () => void;
  onToggleScreenShare: () => void;
  onEndOrLeave: () => void;
}

export const ClassroomControlDock: React.FC<ClassroomControlDockProps> = ({
  isUiHidden,
  userRole,
  isTeacher,
  micStatus,
  cameraStatus,
  isMicEnabled,
  isCameraEnabled,
  hasWhiteboardData,
  whiteboardPending,
  showWhiteboard,
  isSharing,
  onToggleMic,
  onToggleCamera,
  onDeniedClick,
  onToggleWhiteboard,
  onToggleScreenShare,
  onEndOrLeave,
}) => {
  return (
    <div
      className={`absolute bottom-0 left-0 w-full flex items-center justify-center px-4 pb-5 pt-2 z-50 transition-all duration-300 ease-in-out ${
        isUiHidden
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      }`}
      dir="ltr"
    >
      <div className="flex items-center gap-2 md:gap-2.5 px-4 md:px-5 py-3 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/5">
        {/* ── Mic Toggle (host only) ── */}
        {userRole === "host" && (
          <button
            id="dock-btn-mic"
            onClick={
              micStatus === "denied"
                ? () => onDeniedClick("mic")
                : onToggleMic
            }
            className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
              micStatus === "denied"
                ? "bg-red-900/50 text-red-400 border border-red-500/30"
                : !isMicEnabled
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
            }`}
          >
            {micStatus === "denied" || !isMicEnabled ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
              <span
                className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap"
                dir="rtl"
              >
                <span className="block text-[11px] font-bold text-white">
                  الميكروفون
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {micStatus === "denied"
                    ? "⚠️ يجب منح الإذن أولاً"
                    : !isMicEnabled
                      ? "اضغط لتشغيل الصوت"
                      : "اضغط لكتم الصوت"}
                </span>
              </span>
              <span className="border-4 border-transparent border-t-slate-800/95" />
            </span>
          </button>
        )}

        {/* ── Camera Toggle (host only) ── */}
        {userRole === "host" && (
          <button
            id="dock-btn-camera"
            onClick={
              cameraStatus === "denied"
                ? () => onDeniedClick("camera")
                : onToggleCamera
            }
            className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
              cameraStatus === "denied"
                ? "bg-red-900/50 text-red-400 border border-red-500/30"
                : !isCameraEnabled
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
            }`}
          >
            {cameraStatus === "denied" || !isCameraEnabled ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
              <span
                className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap"
                dir="rtl"
              >
                <span className="block text-[11px] font-bold text-white">
                  الكاميرا
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {cameraStatus === "denied"
                    ? "⚠️ يجب منح الإذن أولاً"
                    : !isCameraEnabled
                      ? "اضغط لتشغيل الكاميرا"
                      : "اضغط لإيقاف الكاميرا"}
                </span>
              </span>
              <span className="border-4 border-transparent border-t-slate-800/95" />
            </span>
          </button>
        )}

        {/* ── Divider: comms / content ── */}
        {userRole === "host" && (
          <div className="w-px h-8 bg-white/10 mx-0.5" />
        )}

        {/* ── Whiteboard Toggle (anyone, when feature is expected) ── */}
        <button
          id="dock-btn-whiteboard"
          onClick={() => {
            if (!hasWhiteboardData) return;
            onToggleWhiteboard();
          }}
          disabled={!hasWhiteboardData}
          className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
            hasWhiteboardData
              ? showWhiteboard
                ? "bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-600/30"
                : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
              : "bg-slate-800/40 text-slate-400 border border-slate-700 cursor-not-allowed"
          }`}
        >
          {showWhiteboard ? (
            <LayoutGrid className="w-5 h-5" />
          ) : (
            <Presentation className="w-5 h-5" />
          )}
          {whiteboardPending && !hasWhiteboardData && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          )}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
            <span
              className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap"
              dir="rtl"
            >
              <span className="block text-[11px] font-bold text-white">
                السبورة التفاعلية
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                {hasWhiteboardData
                  ? showWhiteboard
                    ? "اضغط للعودة لعرض الفيديو"
                    : "اضغط لعرض السبورة"
                  : "جارٍ تهيئة السبورة..."}
              </span>
            </span>
            <span className="border-4 border-transparent border-t-slate-800/95" />
          </span>
        </button>

        {/* ── Screen Share (teacher only) ── */}
        {isTeacher && (
          <button
            id="dock-btn-screenshare"
            onClick={onToggleScreenShare}
            className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
              isSharing
                ? "bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-600/30"
                : "bg-white/8 text-white hover:bg-white/15 border border-white/10"
            }`}
          >
            <MonitorUp className="w-5 h-5" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
              <span
                className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap"
                dir="rtl"
              >
                <span className="block text-[11px] font-bold text-white">
                  مشاركة الشاشة
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  {isSharing
                    ? "اضغط لإيقاف المشاركة"
                    : "اضغط لبدء مشاركة الشاشة"}
                </span>
              </span>
              <span className="border-4 border-transparent border-t-slate-800/95" />
            </span>
          </button>
        )}

        {/* ── Divider: content / danger ── */}
        <div className="w-px h-8 bg-white/10 mx-0.5" />

        {/* ── End Call / Leave (all roles) ── */}
        <button
          id="dock-btn-end"
          onClick={onEndOrLeave}
          className="relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {isTeacher ? (
            <PowerOff className="w-5 h-5" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
            <span
              className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap"
              dir="rtl"
            >
              <span className="block text-[11px] font-bold text-white">
                {isTeacher ? "إنهاء الحصة" : "مغادرة الغرفة"}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                {isTeacher
                  ? "سيتم إيداع الأرباح فور الإنهاء"
                  : "اضغط للخروج من الحصة"}
              </span>
            </span>
            <span className="border-4 border-transparent border-t-slate-800/95" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default ClassroomControlDock;
