"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { bookingService } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FloatingVideoWidget from "@/components/classroom/FloatingVideoWidget";
import LobbyPreview from "@/components/classroom/LobbyPreview";
import { showApiError } from "@/hooks/useApiError";
import type { IAgoraRTCClient, ILocalVideoTrack } from "agora-rtc-sdk-ng";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Lock,
  AlertTriangle,
  LogOut,
  PowerOff,
  MonitorUp,
  Loader2,
  Coins,
  Presentation,
  LayoutGrid,
  X,
} from "lucide-react";

const AGORA_APP_ID = (process.env.NEXT_PUBLIC_AGORA_APP_ID || "").trim();
const WHITEBOARD_APP_ID = (
  process.env.NEXT_PUBLIC_WHITEBOARD_APP_IDENTIFIER || ""
).trim();
const WHITEBOARD_REGION = (
  process.env.NEXT_PUBLIC_WHITEBOARD_REGION || "sg"
).trim();

// استدعاء مكون الكاميرا الآمن من SSR
const AgoraCall = dynamic(() => import("@/components/classroom/AgoraCall"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-white font-bold animate-pulse flex items-center gap-2">
        جاري تشغيل الكاميرا وإعداد الاتصال... <Video className="w-5 h-5" />
      </p>
    </div>
  ),
});

// استدعاء السبورة التفاعلية من SSR
const Whiteboard = dynamic(() => import("@/components/classroom/Whiteboard"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4 bg-white/5 backdrop-blur-md rounded-xl">
      <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      <p className="text-blue-100 font-medium">
        جاري إعداد السبورة التفاعلية...
      </p>
    </div>
  ),
});

export default function ClassroomPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [channelName, setChannelName] = useState("");
  const [agoraToken, setAgoraToken] = useState<string | null>(null);
  const [rtmToken, setRtmToken] = useState<string | null>(null);
  const [screenToken, setScreenToken] = useState<string | null>(null);
  const [whiteboardData, setWhiteboardData] = useState<{
    room_uuid: string;
    room_token: string;
  } | null>(null);
  const [whiteboardPending, setWhiteboardPending] = useState(false);
  const [uid, setUid] = useState<number>(0);
  const [userRole, setUserRole] = useState<"host" | "audience">("audience");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inCall, setInCall] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [permBannerDismissed, setPermBannerDismissed] = useState(false);
  const [bannerShake, setBannerShake] = useState(false);

  // 🧭 Auto-hide UI states
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 🔐 حالات صلاحيات الميديا
  const [cameraStatus, setCameraStatus] = useState<
    "pending" | "granted" | "denied"
  >("pending");
  const [micStatus, setMicStatus] = useState<"pending" | "granted" | "denied">(
    "pending",
  );
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // 🟢 حالات مشاركة الشاشة (العميل المزدوج)
  const [isSharing, setIsSharing] = useState(false);
  const [isRemoteSharing, setIsRemoteSharing] = useState(false); // remote screen share detected by AgoraCall
  const [screenClient, setScreenClient] = useState<IAgoraRTCClient | null>(
    null,
  );
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);

  // Ref for the full-screen screen-share background div (used by AgoraCall via externalScreenRef)
  const screenBgRef = useRef<HTMLDivElement>(null);

  const isTeacher = user?.roles?.some((r) => r.name === "teacher");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await bookingService.getClassroomAccess(Number(params.id));
        const data = res.data;

        setChannelName(data.channel_name);
        setUid(data.uid);
        setUserRole(data.role === "host" ? "host" : "audience");

        if (data.token) {
          setAgoraToken(data.token);
        }

        if (data.rtm_token) {
          setRtmToken(data.rtm_token);
        }

        if (data.screen_token) {
          setScreenToken(data.screen_token);
        }

        if (data.whiteboard?.room_uuid && data.whiteboard?.room_token) {
          setWhiteboardData(data.whiteboard);
          setWhiteboardPending(false);
        } else {
          setWhiteboardData(null);
          setWhiteboardPending(true);
        }

        setLoading(false);
      } catch {
        setError("فشل الاتصال بالغرفة الافتراضية أو غير مصرح لك.");
        setLoading(false);
      }
    };

    if (user) fetchAccess();
  }, [params.id, user]);

  // 🔄 Polling for Whiteboard Data if pending
  // Uses the lightweight /whiteboard-status endpoint (no DB side effects,
  // no Agora token generation) instead of the full getClassroomAccess call.
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (whiteboardPending && !whiteboardData && !loading && !error) {
      interval = setInterval(async () => {
        try {
          const res = await bookingService.getWhiteboardStatus(Number(params.id));

          if (res.status === 'ready' && res.whiteboard?.room_uuid && res.whiteboard?.room_token) {
            setWhiteboardData(res.whiteboard);
            setWhiteboardPending(false);
          }
          // 'pending' → keep polling; 'error' → also keep polling (transient server error)
        } catch (err) {
          console.error("Failed to poll whiteboard status:", err);
        }
      }, 3000); // 3s — safe since the endpoint is now side-effect-free
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [whiteboardPending, whiteboardData, loading, error, params.id]);

  // ── Heartbeat: تُرسَل كل 30 ثانية أثناء الحصة لتفادي إغلاقها تلقائياً كـ"مهجورة" ──
  useEffect(() => {
      if (!inCall) return;

      const sendHeartbeat = () => {
          bookingService.sendHeartbeat(Number(params.id)).catch(() => {
              // فشل صامت — انقطاع نبضة واحدة مقبول ضمن فترة السماح في الباك إند
          });
      };

      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 30000);

      return () => clearInterval(interval);
  }, [inCall, params.id]);

  // ── 4.5: Graceful Cleanup on Browser Close ────────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (screenTrack) {
        screenTrack.close();
      }
      // We don't await screenClient.leave() here because the browser is closing
      // and won't wait for async operations, but closing the track stops the stream immediately.
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [screenTrack]);

  // 🚪 دالة المغادرة المؤقتة / العادية
  const handleLeave = async () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    // إغلاق الشاشة إذا كانت تعمل قبل الخروج
    if (screenTrack) {
      screenTrack.close();
      if (screenClient) await screenClient.leave();
    }
    setInCall(false);
    setTimeout(() => router.replace("/dashboard"), 1000);
  };

  // 🔴 دالة إنهاء الحصة
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleCompleteClass = async () => {
    setShowEndConfirm(false);
    setIsEnding(true);
    try {
      await bookingService.complete(Number(params.id));

      // Invalidate queries to refresh dashboard and wallet data
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });

      toast.success(
        <div className="flex items-center gap-2">
          تم إنهاء الحصة بنجاح! وتم إيداع الأرباح. <Coins className="w-4 h-4" />
        </div>,
      );
      await handleLeave();
    } catch (err: unknown) {
      showApiError(err, "حدث خطأ أثناء إنهاء الحصة");
      setIsEnding(false);
    }
  };

  // ... (permission logic)
  // 🔐 طلب الصلاحيات
  const handleJoinRequest = () => {
    if (cameraStatus === "granted" && micStatus === "granted") {
      // 🚀 Hardware Track Reusability (Task 4): 
      // We DON'T stop the tracks here anymore. We pass them to AgoraCall.
      setInCall(true);
      return;
    }
    // Instead of showing modal, just request directly
    requestMediaPermissions();
  };

  // ── Auto-hide UI Logic (Task 4) ──
  useEffect(() => {
    if (!inCall) return;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      // Auto-hide after 3 seconds of inactivity
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
    };

    // Initial timer start
    resetIdleTimer();

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("mousedown", resetIdleTimer);
    window.addEventListener("touchstart", resetIdleTimer, { passive: true });
    window.addEventListener("keydown", resetIdleTimer);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("mousedown", resetIdleTimer);
      window.removeEventListener("touchstart", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
    };
  }, [inCall]);

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      setCameraStatus("granted");
      setMicStatus("granted");
      setMediaStream(stream);
      setIsCameraEnabled(true);
      setIsMicEnabled(true);

      // Note: We DON'T set inCall(true) yet. We let them see the preview first.
    } catch (err: unknown) {
      console.error("Permission request failed:", err);
      const errorName = err instanceof Error ? err.name : "";

      if (
        errorName === "NotAllowedError" ||
        errorName === "PermissionDeniedError"
      ) {
        setCameraStatus("denied");
        setMicStatus("denied");
        setIsCameraEnabled(false);
        setIsMicEnabled(false);

        // Allow entering even if denied. Banner will surface automatically — no toast needed.
        setPermBannerDismissed(false);
        setInCall(true);
      } else {
        toast.error("حدث خطأ أثناء محاولة الوصول للكاميرا والميكروفون.");
      }
    }
  };

  const handleToggleCamera = async () => {
    if (!inCall) {
      if (isCameraEnabled) {
        // Turn OFF camera hardware (stop track and remove from stream)
        if (mediaStream) {
          mediaStream.getVideoTracks().forEach((track) => {
            track.stop();
            mediaStream.removeTrack(track);
          });
        }
        setIsCameraEnabled(false);
      } else {
        // Turn ON camera hardware (fetch new video track and add to existing stream)
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
          });
          const newVideoTrack = newStream.getVideoTracks()[0];

          if (mediaStream) {
            mediaStream.addTrack(newVideoTrack);
          } else {
            setMediaStream(newStream);
          }
          setIsCameraEnabled(true);
        } catch (err) {
          console.error("Failed to re-enable camera:", err);
          toast.error("حدث خطأ أثناء محاولة تشغيل الكاميرا.");
        }
      }
      return;
    }

    // In-call: we don't stop the hardware track to avoid renegotiation delays.
    // The AgoraCall component will simply mute the track (setEnabled(false)).
    setIsCameraEnabled((prev) => !prev);
  };

  // ... (UI click handlers and screen share)
  // 🛠 التعامل مع النقر على الأزرار المحظورة
  const handleDeniedClick = (type: "camera" | "mic") => {
    // Suppress all toasts — the banner is the sole notification surface for permission errors.
    // If it was dismissed, bring it back; always shake it as tactile feedback.
    void type; // consumed only for future extensibility
    setPermBannerDismissed(false);
    setBannerShake(true);
    setTimeout(() => setBannerShake(false), 600);
  };

  // 💻 🟢 دالة مشاركة الشاشة السحرية (العميل المزدوج)
  const toggleScreenShare = async () => {
    // استدعاء المكتبة داخلياً لتجنب مشاكل Vercel SSR
    const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

    // حالة إيقاف المشاركة
    if (isSharing && screenTrack) {
      screenTrack.close();
      if (screenClient) await screenClient.leave();
      setIsSharing(false);
      setScreenTrack(null);
      setScreenClient(null);
      return;
    }

    // حالة بدء المشاركة
    try {
      // 1. طلب إذن مشاركة الشاشة من المتصفح (نطلب الإذن أولاً لتجنب إنشاء عميل معلق إذا تراجع المستخدم)
      // 🚀 Network Resilience (Task 4): Use 5fps for screen sharing to save bandwidth while keeping text sharp.
      const track = await AgoraRTC.createScreenVideoTrack(
        { 
          encoderConfig: {
            width: 1920,
            height: 1080,
            frameRate: 5,
            bitrateMax: 1500,
            bitrateMin: 600
          }, 
          optimizationMode: "detail" 
        },
        "disable",
      );

      // 2. إنشاء عميل (مستخدم) جديد مخصص للشاشة فقط
      // VP9: ضغط أفضل بـ 30% من VP8 بنفس الجودة البصرية
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp9" });

      // Screen UID = uid + 1_000_000_000 (must match the backend's screen token issuer).
      // Agora UIDs are 32-bit unsigned integers (max 4,294,967,295).
      // Guard: if uid is abnormally large and the sum would overflow Agora's valid range,
      // fall back to a fixed reserved value (2,000,000,001) that is guaranteed to be
      // outside any real user-ID space on this platform.
      const AGORA_UID_MAX   = 4_294_967_295;
      const SCREEN_UID_BASE = 1_000_000_000;
      const screenUid       = (uid + SCREEN_UID_BASE) <= AGORA_UID_MAX
        ? uid + SCREEN_UID_BASE
        : 2_000_000_001;

      await client.join(
        AGORA_APP_ID,
        channelName,
        screenToken || agoraToken,
        screenUid,
      );

      // ── 3.6: Dual-stream for screen share ──────────────────────────────────
      // Enable simulcast for screen share so students with very bad connections
      // can still see the board clearly at a lower resolution (480p, 5fps, 300kbps)
      // instead of freezing on the 1080p high stream.
      try {
        await client.enableDualStream();
        client.setLowStreamParameter({
            width: 854,
            height: 480,
            framerate: 5,
            bitrate: 300,
        });
      } catch (err) {
        console.warn("[page] Failed to enable dual stream for screen share:", err);
      }

      // 3. البث للغرفة
      await client.publish(track);

      // 4. معالجة قيام المستخدم بالضغط على "إيقاف المشاركة" من شريط المتصفح الافتراضي
      track.on("track-ended", async () => {
        track.close();
        await client.leave();
        setIsSharing(false);
        setScreenTrack(null);
        setScreenClient(null);
      });

      setScreenClient(client);
      setScreenTrack(track);
      setIsSharing(true);
    } catch (error: any) {
      console.error("Screen share error:", error);
      // لا تظهر رسالة خطأ إذا قام المستخدم بإلغاء العملية بنفسه
      if (error?.name !== "NotAllowedError" && error?.message !== "Permission denied") {
        toast.error("حدث خطأ أثناء محاولة مشاركة الشاشة.");
      }
    }
  };

  // ── 3.4: Screen-share token renewal callback ──────────────────────────────
  // AgoraCall renews its own main token internally. For the screen-share
  // client (which lives here in page.tsx as `screenClient` state), we
  // receive the fresh tokens via this callback and call renewToken() on it.
  // Using useCallback avoids creating a new function reference on every
  // render, which would otherwise force AgoraCall to re-render (it is memo'd).
  const handleTokenWillExpire = useCallback((
    _freshToken: string,
    freshScreenToken: string | null,
  ) => {
    if (freshScreenToken && screenClient) {
      screenClient
        .renewToken(freshScreenToken)
        .then(() => console.log("[page] Screen token renewed successfully."))
        .catch((err: unknown) => console.warn("[page] Screen token renewal failed:", err));
    }
  }, [screenClient]);

  // 🛡️ Memoize rtcProps to prevent AgoraCall from re-rendering on every parent state change (like isIdle)
  const rtcProps = useMemo(() => ({
    appId: AGORA_APP_ID,
    channel: channelName,
    token: agoraToken,
    uid: uid,
    role: userRole,
  }), [channelName, agoraToken, uid, userRole]);

  if (authLoading || loading)
    return (
      <div
        className="h-[100dvh] flex items-center justify-center font-bold text-xl animate-pulse bg-gray-900 text-white gap-3"
        dir="rtl"
      >
        جاري تجهيز الفصل الافتراضي... <Lock className="w-6 h-6" />
      </div>
    );

  if (error)
    return (
      <div
        className="h-[100dvh] flex flex-col items-center justify-center bg-gray-900 text-white"
        dir="rtl"
      >
        <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
        <h2 className="font-bold text-2xl mb-2">عذراً، حدث خطأ</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => router.replace("/dashboard")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition"
        >
          العودة للوحة التحكم
        </button>
      </div>
    );

  return (
    <div
      className="h-[100dvh] w-full bg-slate-950 text-white flex flex-col overflow-hidden relative"
      dir="rtl"
    >
      {/* 1. Floating Header — Room Info Badge Only */}
      <div 
        className={`absolute top-0 left-0 w-full p-4 md:p-5 z-40 pointer-events-none transition-all duration-300 ease-in-out ${
          isIdle && inCall ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="inline-flex items-center gap-3 pointer-events-auto bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5 shadow-lg">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${inCall ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
          />
          <div className="text-right">
            <h1 className="font-bold text-sm md:text-base leading-tight drop-shadow-lg">
              {isTeacher ? "لوحة تحكم المعلم" : "الفصل الافتراضي"}
            </h1>
            <p className="text-[10px] md:text-xs text-slate-300 font-medium opacity-80 mt-0.5">
              حصة رقم #{params.id}
            </p>
          </div>
        </div>
      </div>

      {/* ⚠️ Permission Denied Banner — floats below header when mic/cam are blocked */}
      {inCall &&
        (cameraStatus === "denied" || micStatus === "denied") &&
        !permBannerDismissed && (
          <div className="absolute top-14 md:top-[68px] left-0 right-0 flex justify-center px-4 z-[45] pointer-events-none">
            <div
              className={`pointer-events-auto flex items-start gap-3 w-full max-w-lg bg-amber-950/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 transition-transform ${
                bannerShake ? "animate-[shake_0.5s_ease-in-out]" : ""
              }`}
              dir="rtl"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-amber-200 font-bold text-sm leading-snug">
                  متصفحك يمنع الوصول للكاميرا والمايكروفون
                </p>
                <p className="text-amber-300/75 text-xs mt-1 leading-relaxed">
                  انقر على الأيقونة الموجودة بجوار رابط الموقع في شريط العنوان
                  أعلاه، وقم بتفعيل خيار{" "}
                  <strong className="text-amber-200 font-bold">«سماح»</strong>،
                  ثم أعد تحميل الصفحة.
                </p>
              </div>
              <button
                onClick={() => setPermBannerDismissed(true)}
                aria-label="إغلاق التنبيه"
                className="flex-shrink-0 p-1 rounded-lg text-amber-500/50 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      {/* 2. Main Content Area */}
      <div className="flex-1 relative overflow-hidden p-2 md:p-4">
        {!inCall ? (
          <LobbyPreview
            cameraStatus={cameraStatus}
            isCameraEnabled={isCameraEnabled}
            isMicEnabled={isMicEnabled}
            mediaStream={mediaStream}
            onToggleCamera={handleToggleCamera}
            onToggleMic={() => setIsMicEnabled(!isMicEnabled)}
            onRequestPermissions={requestMediaPermissions}
            onJoinClass={handleJoinRequest}
          />
        ) : (
          <div className="w-full h-full relative">
            {/* ── Background 1: Interactive Whiteboard ── */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                showWhiteboard && whiteboardData
                  ? "opacity-100 pointer-events-auto z-0"
                  : "opacity-0 pointer-events-none -z-10"
              }`}
              aria-hidden={!showWhiteboard}
            >
              {whiteboardData && (
                <Whiteboard
                  appIdentifier={WHITEBOARD_APP_ID}
                  roomUuid={whiteboardData.room_uuid}
                  roomToken={whiteboardData.room_token}
                  uid={uid.toString()}
                  isTeacher={!!isTeacher}
                  bookingId={params.id}
                  region={WHITEBOARD_REGION}
                  agoraChannel={channelName}
                  rtmToken={rtmToken}
                />
              )}
            </div>

            {/* ── Background 2: Screen Share (local or remote) ──
             *  Always mounted so AgoraCall can portal content into it.
             *  Visible only when screen sharing is active and whiteboard is hidden. */}
            <div
              ref={screenBgRef}
              className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                (isSharing || isRemoteSharing) && !showWhiteboard
                  ? 'opacity-100 pointer-events-auto z-0'
                  : 'opacity-0 pointer-events-none -z-10'
              }`}
            />

            {/* ── AgoraCall inside FloatingVideoWidget ──
             *  isFocusMode = whiteboard OR screen share active
             *  • false → fills entire content area (normal call view)
             *  • true  → draggable floating widget (camera feeds only) */}
            <FloatingVideoWidget focusMode={showWhiteboard || isSharing || isRemoteSharing} hidden={showWhiteboard}>
              <AgoraCall
                bookingId={params.id}
                rtcProps={rtcProps}
                isCameraEnabled={isCameraEnabled}
                isMicEnabled={isMicEnabled}
                isSharing={isSharing}
                localScreenTrack={screenTrack}
                lobbyMediaStream={mediaStream}
                externalScreenRef={screenBgRef}
                onScreenShareActive={setIsRemoteSharing}
                onTokenWillExpire={handleTokenWillExpire}
              />
            </FloatingVideoWidget>
          </div>
        )}
      </div>

      {/* 3. Unified Floating Bottom Control Dock — all roles, all controls */}
      {inCall && (
        <div
          className={`absolute bottom-0 left-0 w-full flex items-center justify-center px-4 pb-5 pt-2 z-50 transition-all duration-300 ease-in-out ${
            isIdle ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
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
                    ? () => handleDeniedClick("mic")
                    : () => setIsMicEnabled(!isMicEnabled)
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
                    ? () => handleDeniedClick("camera")
                    : handleToggleCamera
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
                if (!whiteboardData) return;
                setShowWhiteboard(!showWhiteboard);
              }}
              disabled={!whiteboardData}
              className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                whiteboardData
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
              {whiteboardPending && !whiteboardData && (
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
                    {whiteboardData
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
                onClick={toggleScreenShare}
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
              onClick={isTeacher ? () => setShowEndConfirm(true) : handleLeave}
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
      )}


      <ConfirmDialog
        isOpen={showEndConfirm}
        title="إنهاء الحصة"
        message="هل أنت متأكد من إنهاء الحصة؟ سيتم إغلاق الغرفة وإيداع الأرباح في محفظتك."
        confirmText="إنهاء وتحصيل"
        variant="danger"
        isLoading={isEnding}
        onConfirm={handleCompleteClass}
        onCancel={() => setShowEndConfirm(false)}
      />
    </div>
  );
}
