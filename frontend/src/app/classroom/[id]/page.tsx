"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { bookingService } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PermissionModal from '@/components/classroom/PermissionModal';
import MicLevelMeter from '@/components/classroom/MicLevelMeter';
import { showApiError } from '@/hooks/useApiError';
import type { IAgoraRTCClient, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
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
    CheckCircle2,
    Settings,
    X
} from 'lucide-react';

const AGORA_APP_ID = (process.env.NEXT_PUBLIC_AGORA_APP_ID || '').trim();
const WHITEBOARD_APP_ID = (process.env.NEXT_PUBLIC_WHITEBOARD_APP_IDENTIFIER || '').trim();
const WHITEBOARD_REGION = (process.env.NEXT_PUBLIC_WHITEBOARD_REGION || 'eu').trim();

// استدعاء مكون الكاميرا الآمن من SSR
const AgoraCall = dynamic(() => import('@/components/classroom/AgoraCall'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-white font-bold animate-pulse flex items-center gap-2">جاري تشغيل الكاميرا وإعداد الاتصال... <Video className="w-5 h-5" /></p>
        </div>
    )
});

// استدعاء السبورة التفاعلية من SSR
const Whiteboard = dynamic(() => import('@/components/classroom/Whiteboard'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full space-y-4 bg-white/5 backdrop-blur-md rounded-xl">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-blue-100 font-medium">جاري إعداد السبورة التفاعلية...</p>
        </div>
    )
});

export default function ClassroomPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    
    const [channelName, setChannelName] = useState('');
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [screenToken, setScreenToken] = useState<string | null>(null);
    const [whiteboardData, setWhiteboardData] = useState<{ room_uuid: string; room_token: string } | null>(null);
    const [uid, setUid] = useState<number>(0);
    const [userRole, setUserRole] = useState<'host' | 'audience'>('audience');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inCall, setInCall] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [permBannerDismissed, setPermBannerDismissed] = useState(false);
    const [bannerShake, setBannerShake] = useState(false);

    // 🔐 حالات صلاحيات الميديا
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isMicEnabled, setIsMicEnabled] = useState(true);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // 🟢 حالات مشاركة الشاشة (العميل المزدوج)
    const [isSharing, setIsSharing] = useState(false);
    const [screenClient, setScreenClient] = useState<IAgoraRTCClient | null>(null);
    const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);

    const isTeacher = user?.roles?.some((r) => r.name === 'teacher');

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (mediaStream && previewVideoRef.current && cameraStatus === 'granted' && isCameraEnabled) {
            previewVideoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream, cameraStatus, isCameraEnabled]);

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                const res = await bookingService.getClassroomAccess(Number(params.id));
                const data = res.data;
                
                setChannelName(data.channel_name);
                setUid(data.uid);
                setUserRole(data.role === 'host' ? 'host' : 'audience');
                
                if (data.token) {
                    setAgoraToken(data.token);
                }

                if (data.screen_token) {
                    setScreenToken(data.screen_token);
                }

                if (data.whiteboard) {
                    setWhiteboardData(data.whiteboard);
                }
                
                setLoading(false);
            } catch {
                setError('فشل الاتصال بالغرفة الافتراضية أو غير مصرح لك.');
                setLoading(false);
            }
        };

        if (user) fetchAccess();
    }, [params.id, user]);

    // ... (leave and complete class logic)
    // 🚪 دالة المغادرة المؤقتة / العادية
    const handleLeave = async () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        // إغلاق الشاشة إذا كانت تعمل قبل الخروج
        if (screenTrack) {
            screenTrack.close();
            if (screenClient) await screenClient.leave();
        }
        setInCall(false); 
        setTimeout(() => router.replace('/dashboard'), 1000);
    };

    // 🔴 دالة إنهاء الحصة
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    const handleCompleteClass = async () => {
        setShowEndConfirm(false);
        setIsEnding(true);
        try {
            await bookingService.complete(Number(params.id));
            
            // Invalidate queries to refresh dashboard and wallet data
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });

            toast.success(
                <div className="flex items-center gap-2">
                    تم إنهاء الحصة بنجاح! وتم إيداع الأرباح. <Coins className="w-4 h-4" />
                </div>
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
        if (cameraStatus === 'granted' && micStatus === 'granted') {
            // Already have permissions, just enter
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            setInCall(true);
            return;
        }
        setShowPermissionModal(true);
    };

    const requestMediaPermissions = async () => {
        setShowPermissionModal(false);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 1280, height: 720 }, 
                audio: true 
            });
            
            setCameraStatus('granted');
            setMicStatus('granted');
            setMediaStream(stream);
            
            // Note: We DON'T set inCall(true) yet. We let them see the preview first.
            toast.success("تم تفعيل الكاميرا والميكروفون بنجاح.");
        } catch (err: unknown) {
            console.error("Permission request failed:", err);
            const errorName = err instanceof Error ? err.name : '';

            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
                setCameraStatus('denied');
                setMicStatus('denied');
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

    // ... (UI click handlers and screen share)
    // 🛠 التعامل مع النقر على الأزرار المحظورة
    const handleDeniedClick = (type: 'camera' | 'mic') => {
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
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;

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
            // 1. إنشاء عميل (مستخدم) جديد مخصص للشاشة فقط
            // VP9: ضغط أفضل بـ 30% من VP8 بنفس الجودة البصرية
            const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp9" });
            
            // نعطي شاشة المعلم ID مختلف (رقم ضخم جداً) لكي لا يتعارض أبداً مع كاميرته أو أي طالب
            const screenUid = uid + 1000000000; 

            await client.join(AGORA_APP_ID, channelName, screenToken || agoraToken, screenUid);

            // 2. طلب إذن مشاركة الشاشة من المتصفح
            // نمرر "disable" للصوت لتجنب صدى الصوت، سنكتفي بمايكروفون الكاميرا
            const track = await AgoraRTC.createScreenVideoTrack(
                { encoderConfig: "1080p_1", optimizationMode: "detail" },
                "disable" 
            );

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

        } catch (error) {
            console.error("Screen share error:", error);
            toast.error("تم إلغاء مشاركة الشاشة أو حدث خطأ.");
        }
    };

    const rtcProps = {
        appId: AGORA_APP_ID,
        channel: channelName,
        token: agoraToken,
        uid: uid,
        role: userRole, 
    };

    if (authLoading || loading) return (
        <div className="h-[100dvh] flex items-center justify-center font-bold text-xl animate-pulse bg-gray-900 text-white gap-3" dir="rtl">
            جاري تجهيز الفصل الافتراضي... <Lock className="w-6 h-6" />
        </div>
    );
    
    if (error) return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-900 text-white" dir="rtl">
            <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
            <h2 className="font-bold text-2xl mb-2">عذراً، حدث خطأ</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => router.replace('/dashboard')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition">العودة للوحة التحكم</button>
        </div>
    );

    return (
        <div className="h-[100dvh] w-full bg-slate-950 text-white flex flex-col overflow-hidden relative" dir="rtl">
            
            {/* 1. Floating Header — Room Info Badge Only */}
            <div className="absolute top-0 left-0 w-full p-4 md:p-5 z-40 pointer-events-none">
                <div className="inline-flex items-center gap-3 pointer-events-auto bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5 shadow-lg">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${inCall ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <div className="text-right">
                        <h1 className="font-bold text-sm md:text-base leading-tight drop-shadow-lg">
                            {isTeacher ? 'لوحة تحكم المعلم' : 'الفصل الافتراضي'}
                        </h1>
                        <p className="text-[10px] md:text-xs text-slate-300 font-medium opacity-80 mt-0.5">حصة رقم #{params.id}</p>
                    </div>
                </div>
            </div>

            {/* ⚠️ Permission Denied Banner — floats below header when mic/cam are blocked */}
            {inCall && (cameraStatus === 'denied' || micStatus === 'denied') && !permBannerDismissed && (
                <div className="absolute top-14 md:top-[68px] left-0 right-0 flex justify-center px-4 z-[45] pointer-events-none">
                    <div
                        className={`pointer-events-auto flex items-start gap-3 w-full max-w-lg bg-amber-950/90 backdrop-blur-xl border border-amber-500/20 rounded-2xl px-4 py-3 shadow-2xl shadow-black/40 transition-transform ${
                            bannerShake ? 'animate-[shake_0.5s_ease-in-out]' : ''
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
                                انقر على الأيقونة الموجودة بجوار رابط الموقع في شريط العنوان أعلاه،
                                وقم بتفعيل خيار <strong className="text-amber-200 font-bold">«سماح»</strong>، ثم أعد تحميل الصفحة.
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
                    <div className="h-full flex flex-col items-center justify-center space-y-6 md:space-y-8 p-4 md:p-8 text-center animate-fade-in-up bg-slate-950 relative overflow-y-auto">
                        {/* Background subtle glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                        
                        <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
                            {/* Hardware Preview Card */}
                            {cameraStatus === 'granted' && (
                                <div className="w-full aspect-video md:w-[480px] bg-slate-900 rounded-[32px] overflow-hidden border-2 border-white/5 shadow-2xl relative mb-8 group ring-1 ring-white/10">
                                    <video 
                                        ref={previewVideoRef} 
                                        autoPlay 
                                        muted 
                                        playsInline 
                                        className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraEnabled ? 'opacity-100' : 'opacity-0'}`} 
                                    />
                                    {!isCameraEnabled && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                                            <VideoOff className="w-16 h-16 mb-2 opacity-10" />
                                            <span className="text-sm font-bold opacity-30">الكاميرا متوقفة</span>
                                        </div>
                                    )}
                                    {/* Overlay status */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                                            <Settings className="w-3 h-3 text-blue-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">وضع المعاينة</span>
                                        </div>
                                    </div>
                                    
                                    {/* Control Bar in Preview */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                        <button 
                                            onClick={() => setIsMicEnabled(!isMicEnabled)}
                                            className={`p-2 rounded-lg transition-colors ${isMicEnabled ? 'text-white' : 'text-red-500 bg-red-500/10'}`}
                                        >
                                            {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                                        </button>
                                        <div className="w-px h-6 bg-white/10" />
                                        <button 
                                            onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                                            className={`p-2 rounded-lg transition-colors ${isCameraEnabled ? 'text-white' : 'text-red-500 bg-red-500/10'}`}
                                        >
                                            {isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {cameraStatus !== 'granted' && (
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-900/30 rounded-[40px] flex items-center justify-center mb-6 text-blue-400 border border-blue-500/20 shadow-[0_20px_50px_rgba(30,58,138,0.3)] transform -rotate-6">
                                    <Video className="w-12 h-12 md:w-16 md:h-16" />
                                </div>
                            )}

                            <div className="space-y-4 mb-8">
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                    {cameraStatus === 'granted' ? 'تبدو رائعاً!' : 'هل أنت مستعد؟'}
                                </h2>
                                <p className="text-slate-400 text-base md:text-lg max-w-md mx-auto leading-relaxed font-medium">
                                    {cameraStatus === 'granted' 
                                        ? 'تأكد من عمل الميكروفون ثم انضم إلى الحصة التعليمية.'
                                        : 'انضم الآن وباشر رحلتك التعليمية. تأكد من جودة الاتصال وإضاءة المكان.'}
                                </p>
                            </div>

                            {/* Mic Level Visualizer */}
                            {cameraStatus === 'granted' && (
                                <div className="mb-10 w-full flex justify-center">
                                    <MicLevelMeter stream={mediaStream} enabled={isMicEnabled} />
                                </div>
                            )}

                            <button 
                                onClick={handleJoinRequest} 
                                className={`relative z-10 font-black py-4 md:py-5 px-10 md:px-16 rounded-[28px] transition-all transform hover:scale-105 active:scale-95 text-lg md:text-xl tracking-wide flex items-center gap-3 shadow-2xl ${
                                    cameraStatus === 'granted'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-8 ring-emerald-600/20'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white ring-8 ring-blue-600/20'
                                }`}
                            >
                                {cameraStatus === 'granted' ? (
                                    <>دخول الفصل الآن <CheckCircle2 className="w-6 h-6" /></>
                                ) : (
                                    'تجهيز الكاميرا والبدء'
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex gap-4">
                        {/* Area 1: Primary View — كلا المكوّنَين موجودان دائماً لمنع إعادة الاتصال */}
                        <div className="flex-1 relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-black">

                            {/* ✅ AgoraCall — موجود دائماً، يُخفى فقط عند عرض السبورة */}
                            <div className={showWhiteboard ? 'hidden' : 'block w-full h-full'}>
                                <AgoraCall
                                    rtcProps={rtcProps}
                                    isCameraEnabled={isCameraEnabled}
                                    isMicEnabled={isMicEnabled}
                                    isSharing={isSharing}
                                    localScreenTrack={screenTrack}
                                />
                            </div>

                        {/* ✅ Whiteboard — Always mounted for background warm-up once inCall.
                               Using opacity + pointer-events instead of display:none preserves
                               the DOM dimensions the SDK needs for its canvas layout engine. */}
                        <div
                            className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${
                                showWhiteboard && whiteboardData
                                    ? 'opacity-100 pointer-events-auto z-10'
                                    : 'opacity-0 pointer-events-none -z-10'
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
                                    region={WHITEBOARD_REGION}
                                />
                            )}
                        </div>

                        </div>
                    </div>
                )}
            </div>

            {/* 3. Unified Floating Bottom Control Dock — all roles, all controls */}
            {inCall && (
                <div className="shrink-0 flex items-center justify-center px-4 pb-5 pt-2 z-50" dir="ltr">
                    <div className="flex items-center gap-2 md:gap-2.5 px-4 md:px-5 py-3 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/5">

                        {/* ── Mic Toggle (host only) ── */}
                        {userRole === 'host' && (
                            <button
                                id="dock-btn-mic"
                                onClick={micStatus === 'denied' ? () => handleDeniedClick('mic') : () => setIsMicEnabled(!isMicEnabled)}
                                className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                                    micStatus === 'denied'
                                        ? 'bg-red-900/50 text-red-400 border border-red-500/30'
                                        : !isMicEnabled
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-white/8 text-white hover:bg-white/15 border border-white/10'
                                }`}
                            >
                                {micStatus === 'denied' || !isMicEnabled ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
                                    <span className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap" dir="rtl">
                                        <span className="block text-[11px] font-bold text-white">الميكروفون</span>
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                            {micStatus === 'denied' ? '⚠️ يجب منح الإذن أولاً' : !isMicEnabled ? 'اضغط لتشغيل الصوت' : 'اضغط لكتم الصوت'}
                                        </span>
                                    </span>
                                    <span className="border-4 border-transparent border-t-slate-800/95" />
                                </span>
                            </button>
                        )}

                        {/* ── Camera Toggle (host only) ── */}
                        {userRole === 'host' && (
                            <button
                                id="dock-btn-camera"
                                onClick={cameraStatus === 'denied' ? () => handleDeniedClick('camera') : () => setIsCameraEnabled(!isCameraEnabled)}
                                className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                                    cameraStatus === 'denied'
                                        ? 'bg-red-900/50 text-red-400 border border-red-500/30'
                                        : !isCameraEnabled
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-white/8 text-white hover:bg-white/15 border border-white/10'
                                }`}
                            >
                                {cameraStatus === 'denied' || !isCameraEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
                                    <span className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap" dir="rtl">
                                        <span className="block text-[11px] font-bold text-white">الكاميرا</span>
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                            {cameraStatus === 'denied' ? '⚠️ يجب منح الإذن أولاً' : !isCameraEnabled ? 'اضغط لتشغيل الكاميرا' : 'اضغط لإيقاف الكاميرا'}
                                        </span>
                                    </span>
                                    <span className="border-4 border-transparent border-t-slate-800/95" />
                                </span>
                            </button>
                        )}

                        {/* ── Divider: comms / content ── */}
                        {userRole === 'host' && <div className="w-px h-8 bg-white/10 mx-0.5" />}

                        {/* ── Whiteboard Toggle (anyone, when data exists) ── */}
                        {whiteboardData && (
                            <button
                                id="dock-btn-whiteboard"
                                onClick={() => setShowWhiteboard(!showWhiteboard)}
                                className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                                    showWhiteboard
                                        ? 'bg-blue-600 text-white border border-blue-500 shadow-lg shadow-blue-600/30'
                                        : 'bg-white/8 text-white hover:bg-white/15 border border-white/10'
                                }`}
                            >
                                {showWhiteboard ? <LayoutGrid className="w-5 h-5" /> : <Presentation className="w-5 h-5" />}
                                {/* ✅ Warm-up ready pulse indicator */}
                                {!showWhiteboard && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                    </span>
                                )}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
                                    <span className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap" dir="rtl">
                                        <span className="block text-[11px] font-bold text-white">السبورة التفاعلية</span>
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                            {showWhiteboard ? 'اضغط للعودة لعرض الفيديو' : 'اضغط لعرض السبورة'}
                                        </span>
                                    </span>
                                    <span className="border-4 border-transparent border-t-slate-800/95" />
                                </span>
                            </button>
                        )}

                        {/* ── Screen Share (teacher only) ── */}
                        {isTeacher && (
                            <button
                                id="dock-btn-screenshare"
                                onClick={toggleScreenShare}
                                className={`relative group w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                                    isSharing
                                        ? 'bg-emerald-600 text-white border border-emerald-500 shadow-lg shadow-emerald-600/30'
                                        : 'bg-white/8 text-white hover:bg-white/15 border border-white/10'
                                }`}
                            >
                                <MonitorUp className="w-5 h-5" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
                                    <span className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap" dir="rtl">
                                        <span className="block text-[11px] font-bold text-white">مشاركة الشاشة</span>
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                            {isSharing ? 'اضغط لإيقاف المشاركة' : 'اضغط لبدء مشاركة الشاشة'}
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
                            {isTeacher ? <PowerOff className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex flex-col items-center z-[70]">
                                <span className="bg-slate-800/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl px-3 py-2 text-center whitespace-nowrap" dir="rtl">
                                    <span className="block text-[11px] font-bold text-white">
                                        {isTeacher ? 'إنهاء الحصة' : 'مغادرة الغرفة'}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 mt-0.5">
                                        {isTeacher ? 'سيتم إيداع الأرباح فور الإنهاء' : 'اضغط للخروج من الحصة'}
                                    </span>
                                </span>
                                <span className="border-4 border-transparent border-t-slate-800/95" />
                            </span>
                        </button>

                    </div>
                </div>
            )}

            <PermissionModal 
                isOpen={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                onRequest={requestMediaPermissions}
            />

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
