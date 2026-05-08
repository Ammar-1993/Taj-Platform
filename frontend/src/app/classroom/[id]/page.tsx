"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingService } from '@/services/api';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PermissionModal from '@/components/classroom/PermissionModal';
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
    Coins 
} from 'lucide-react';

const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '039c4b2d111b488f8069bb00c583aa04';

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

export default function ClassroomPage({ params }: { params: { id: string } }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    
    const [channelName, setChannelName] = useState('');
    const [agoraToken, setAgoraToken] = useState<string | null>(null);
    const [uid, setUid] = useState<number>(0);
    const [userRole, setUserRole] = useState<'host' | 'audience'>('audience');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inCall, setInCall] = useState(false);
    const [isEnding, setIsEnding] = useState(false);

    // 🔐 حالات صلاحيات الميديا
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isMicEnabled, setIsMicEnabled] = useState(true);

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
                
                setLoading(false);
            } catch {
                setError('فشل الاتصال بالغرفة الافتراضية أو غير مصرح لك.');
                setLoading(false);
            }
        };

        if (user) fetchAccess();
    }, [params.id, user]);

    // 🚪 دالة المغادرة المؤقتة / العادية
    const handleLeave = async () => {
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

    // 🔐 طلب الصلاحيات
    const handleJoinRequest = () => {
        setShowPermissionModal(true);
    };

    const requestMediaPermissions = async () => {
        setShowPermissionModal(false);
        try {
            // محاولة الحصول على الميديا
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            
            // نجاح الوصول
            setCameraStatus('granted');
            setMicStatus('granted');
            
            // إغلاق التراكات المؤقتة فوراً، Agora سيتولى فتحها
            stream.getTracks().forEach(track => track.stop());
            
            setInCall(true);
        } catch (err: unknown) {
            console.error("Permission request failed:", err);
            
            const errorName = err instanceof Error ? err.name : '';

            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
                setCameraStatus('denied');
                setMicStatus('denied');
                setIsCameraEnabled(false);
                setIsMicEnabled(false);
                
                // حتى لو رفض، نسمح له بالدخول لمشاهدة الآخرين
                setInCall(true);
                toast.error("تم رفض الوصول للكاميرا والميكروفون.");
            } else {
                toast.error("حدث خطأ أثناء محاولة الوصول للكاميرا والميكروفون.");
            }
        }
    };

    // 🛠 التعامل مع النقر على الأزرار المحظورة
    const handleDeniedClick = (type: 'camera' | 'mic') => {
        toast((t) => (
            <div className="text-right" dir="rtl">
                <p className="font-bold mb-1">عذراً، لقد تم حظر الوصول {type === 'camera' ? 'للكاميرا' : 'للميكروفون'}.</p>
                <p className="text-sm">يرجى النقر على أيقونة القفل 🔒 في شريط عنوان المتصفح (URL) لاختيار &apos;سماح&apos; (Allow) ثم تحديث الصفحة.</p>
                <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded"
                >
                    حسناً
                </button>
            </div>
        ), { duration: 6000, icon: '🔒' });
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
            const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            
            // نعطي شاشة المعلم ID مختلف (مثلاً رقم المعلم + 10000) لكي لا يتعارض مع كاميرته
            const screenUid = uid + 10000; 

            await client.join(AGORA_APP_ID, channelName, agoraToken, screenUid);

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
            
            {/* 1. Floating Header (Room Info) */}
            <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-50 flex justify-between items-center pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className={`w-2.5 h-2.5 rounded-full ${inCall ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                    <div className="text-right">
                        <h1 className="font-bold text-sm leading-tight drop-shadow-md">
                            {isTeacher ? 'لوحة تحكم المعلم' : 'الفصل الافتراضي'}
                        </h1>
                        <p className="text-[10px] text-slate-300 font-medium opacity-80 mt-0.5 drop-shadow-md">حصة رقم #{params.id}</p>
                    </div>
                </div>

                {isTeacher && inCall && (
                    <button 
                        onClick={toggleScreenShare} 
                        className={`pointer-events-auto p-2 rounded-xl transition border ${isSharing ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900/60 backdrop-blur-md border-slate-700 text-slate-200'}`}
                    >
                        <MonitorUp className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 h-full w-full relative">
                {!inCall ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 p-8 text-center animate-fade-in-up bg-slate-900">
                        <div className="w-20 h-20 bg-blue-900/50 rounded-full flex items-center justify-center mb-2 text-blue-400">
                            <Video className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-3">هل أنت مستعد لبدء الحصة؟</h2>
                            <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">تأكد من إضاءة الغرفة وعمل الميكروفون بشكل جيد قبل الدخول.</p>
                        </div>
                        <button 
                            onClick={handleJoinRequest} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 text-lg ring-4 ring-blue-600/30"
                        >
                            انضمام الآن
                        </button>
                    </div>
                ) : (
                    <AgoraCall 
                        rtcProps={rtcProps} 
                        isCameraEnabled={isCameraEnabled}
                        isMicEnabled={isMicEnabled}
                        isSharing={isSharing}
                        localScreenTrack={screenTrack}
                    />
                )}
            </div>

            {/* 3. Floating Control Dock */}
            {inCall && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl px-6 py-4 rounded-full z-50 shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/10 scale-90 sm:scale-100 transition-transform">
                    {/* Mic Toggle */}
                    <button
                        onClick={micStatus === 'denied' ? () => handleDeniedClick('mic') : () => setIsMicEnabled(!isMicEnabled)}
                        className={`p-3 rounded-full transition-all ${
                            micStatus === 'denied' 
                                ? 'bg-red-900/30 text-red-500' 
                                : !isMicEnabled 
                                    ? 'bg-red-500/20 text-red-500' 
                                    : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                    >
                        {micStatus === 'denied' || !isMicEnabled ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    {/* End Call Button */}
                    <button 
                        onClick={isTeacher ? () => setShowEndConfirm(true) : handleLeave} 
                        className="bg-red-600 hover:bg-red-700 p-4 rounded-full text-white shadow-lg transition transform hover:scale-110 active:scale-90"
                    >
                        {isTeacher ? <PowerOff className="w-7 h-7" /> : <LogOut className="w-7 h-7" />}
                    </button>

                    {/* Camera Toggle */}
                    <button
                        onClick={cameraStatus === 'denied' ? () => handleDeniedClick('camera') : () => setIsCameraEnabled(!isCameraEnabled)}
                        className={`p-3 rounded-full transition-all ${
                            cameraStatus === 'denied' 
                                ? 'bg-red-900/30 text-red-500' 
                                : !isCameraEnabled 
                                    ? 'bg-red-500/20 text-red-500' 
                                    : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                    >
                        {cameraStatus === 'denied' || !isCameraEnabled ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </button>
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
