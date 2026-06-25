"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import MicLevelMeter from "./MicLevelMeter";

// ── Phase 3.1: Pre-Call Network Test types ────────────────────────────────────
type NetworkTestResult =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "done"; rttMs: number; quality: "excellent" | "good" | "fair" | "weak" };

async function measureNetworkRtt(): Promise<number> {
  const urls = [
    "https://edge.agora.io/favicon.ico",
    "https://www.cloudflare.com/favicon.ico",
  ];
  const results: number[] = [];
  for (const url of urls) {
    const start = performance.now();
    try {
      await fetch(`${url}?_=${Date.now()}`, { method: "HEAD", mode: "no-cors", cache: "no-store" });
    } catch { /* no-cors resolves even without response body — that's expected */ }
    results.push(performance.now() - start);
  }
  return Math.min(...results);
}

function rttToQuality(rtt: number): NetworkTestResult & { status: "done" } {
  let quality: "excellent" | "good" | "fair" | "weak";
  if (rtt < 80) quality = "excellent";
  else if (rtt < 180) quality = "good";
  else if (rtt < 350) quality = "fair";
  else quality = "weak";
  return { status: "done", rttMs: Math.round(rtt), quality };
}

const QUALITY_CONFIG = {
  excellent: { label: "ممتاز",  desc: "اتصال مثالي",                      color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", bars: 5, barColor: "bg-emerald-400" },
  good:      { label: "جيد",    desc: "مناسب للفيديو والصوت",              color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20",       bars: 4, barColor: "bg-blue-400"    },
  fair:      { label: "مقبول",  desc: "قد يتأثر الفيديو أحياناً",          color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",     bars: 2, barColor: "bg-amber-400"   },
  weak:      { label: "ضعيف",   desc: "يُنصح بالدخول بالصوت فقط",          color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20",         bars: 1, barColor: "bg-red-400"     },
};

// ── Phase 3.2: NetworkBar — mini signal-strength widget ───────────────────────
// Exported so AgoraCall.tsx can use the same widget to replace its red banner.
export function NetworkBar({ quality, rttMs }: { quality: "excellent" | "good" | "fair" | "weak"; rttMs?: number }) {
  const cfg = QUALITY_CONFIG[quality];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.bg}`}>
      <div className="flex items-end gap-[2px]">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-all duration-500 ${bar <= cfg.bars ? cfg.barColor : "bg-slate-600/50"}`}
            style={{ height: `${bar * 3 + 3}px` }}
          />
        ))}
      </div>
      <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
      {rttMs !== undefined && <span className="text-[10px] text-slate-500">{rttMs}ms</span>}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface LobbyPreviewProps {
  cameraStatus: "pending" | "granted" | "denied";
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  mediaStream: MediaStream | null;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onRequestPermissions: () => void;
  onJoinClass: () => void;
}

export default function LobbyPreview({
  cameraStatus,
  isCameraEnabled,
  isMicEnabled,
  mediaStream,
  onToggleCamera,
  onToggleMic,
  onRequestPermissions,
  onJoinClass,
}: LobbyPreviewProps) {
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [networkTest, setNetworkTest] = useState<NetworkTestResult>({ status: "idle" });

  // ── Phase 3.1: Run network probe 600ms after lobby mounts ─────────────────
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setNetworkTest({ status: "testing" });
      try {
        const rtt = await measureNetworkRtt();
        if (!cancelled) setNetworkTest(rttToQuality(rtt));
      } catch {
        if (!cancelled) setNetworkTest({ status: "idle" });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!previewVideoRef.current) return;
    if (mediaStream && cameraStatus === "granted" && isCameraEnabled) {
      previewVideoRef.current.srcObject = mediaStream;
    } else {
      previewVideoRef.current.srcObject = null;
    }
  }, [mediaStream, cameraStatus, isCameraEnabled]);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6 md:space-y-8 p-4 md:p-8 text-center animate-fade-in-up bg-slate-950 relative overflow-y-auto">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-full aspect-video md:w-[480px] bg-slate-900 rounded-[32px] overflow-hidden border-2 border-white/5 shadow-2xl relative mb-8 group ring-1 ring-white/10">
          {cameraStatus === "granted" ? (
            <>
              <video
                ref={previewVideoRef}
                autoPlay muted playsInline
                className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraEnabled ? "opacity-100" : "opacity-0"}`}
              />
              {!isCameraEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                  <VideoOff className="w-16 h-16 mb-2 opacity-10" />
                  <span className="text-sm font-bold opacity-30">الكاميرا متوقفة</span>
                </div>
              )}

              {/* Preview mode badge — top right */}
              <div className="absolute top-4 right-4">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                  <Settings className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">وضع المعاينة</span>
                </div>
              </div>

              {/* ── Phase 3.1: Network badge — top left ── */}
              <div className="absolute top-4 left-4">
                {networkTest.status === "testing" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-white/10 backdrop-blur-md">
                    <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                    <span className="text-[10px] text-slate-400 font-medium">جاري فحص الاتصال…</span>
                  </div>
                )}
                {networkTest.status === "done" && (
                  <NetworkBar quality={networkTest.quality} rttMs={networkTest.rttMs} />
                )}
              </div>

              {/* Control bar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                <button onClick={onToggleMic} className={`p-2 rounded-lg transition-colors ${isMicEnabled ? "text-white" : "text-red-500 bg-red-500/10"}`}>
                  {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <div className="w-px h-6 bg-white/10" />
                <button onClick={onToggleCamera} className={`p-2 rounded-lg transition-colors ${isCameraEnabled ? "text-white" : "text-red-500 bg-red-500/10"}`}>
                  {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 space-y-6">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-900/30 rounded-[40px] flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_20px_50px_rgba(30,58,138,0.3)] transform -rotate-6">
                <Video className="w-12 h-12 md:w-16 md:h-16" />
              </div>
              {cameraStatus === "pending" && (
                <button onClick={onRequestPermissions} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 active:scale-95 flex items-center gap-2">
                  تفعيل الكاميرا والمايكروفون
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {cameraStatus === "granted" ? "تبدو رائعاً!" : "هل أنت مستعد؟"}
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed font-medium">
            {cameraStatus === "granted"
              ? "تأكد من عمل الميكروفون ثم انضم إلى الحصة التعليمية."
              : "انضم الآن وباشر رحلتك التعليمية. تأكد من جودة الاتصال وإضاءة المكان."}
          </p>

          {/* ── Phase 3.1: Weak network advisory ── */}
          {networkTest.status === "done" && networkTest.quality === "weak" && (
            <div className="flex items-center justify-center gap-2 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 max-w-sm mx-auto">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-sm font-medium text-right">
                اتصالك بطيء — يُنصح بإيقاف الكاميرا للحصول على صوت أوضح
              </p>
            </div>
          )}
        </div>

        {cameraStatus === "granted" && (
          <div className="mb-10 w-full flex justify-center">
            <MicLevelMeter stream={mediaStream} enabled={isMicEnabled} />
          </div>
        )}

        <button
          onClick={cameraStatus === "granted" || cameraStatus === "denied" ? onJoinClass : onRequestPermissions}
          className={`relative z-10 font-black py-4 md:py-5 px-10 md:px-16 rounded-[28px] transition-all transform hover:scale-105 active:scale-95 text-lg md:text-xl tracking-wide flex items-center gap-3 shadow-2xl ${
            cameraStatus === "granted"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-8 ring-emerald-600/20"
              : cameraStatus === "denied"
                ? "bg-amber-600 hover:bg-amber-700 text-white ring-8 ring-amber-600/20"
                : "bg-blue-600 hover:bg-blue-700 text-white ring-8 ring-blue-600/20"
          }`}
        >
          {cameraStatus === "granted" ? (
            <>دخول الفصل الآن <CheckCircle2 className="w-6 h-6" /></>
          ) : cameraStatus === "denied" ? (
            "دخول الفصل (بدون كاميرا)"
          ) : (
            "تجهيز الكاميرا والبدء"
          )}
        </button>
      </div>
    </div>
  );
}
