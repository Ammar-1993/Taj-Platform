"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingService } from '@/services/api';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { showApiError } from '@/hooks/useApiError';
import type { IAgoraRTCClient, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { Video, Lock, AlertTriangle, LogOut, PowerOff, MonitorUp, Info, Loader2, Coins } from 'lucide-react';

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
        layout: 1,
        disableRtm: true,
        mode: 'rtc' as const, // إضافة وضع RTC لتحسين سرعة الاستجابة في الحصص المباشرة
    };

    if (authLoading || loading) return (
        <div className="h-screen flex items-center justify-center font-bold text-xl animate-pulse bg-gray-900 text-white gap-3" dir="rtl">
            جاري تجهيز الفصل الافتراضي وتشفير الاتصال... <Lock className="w-6 h-6" />
        </div>
    );
    
    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white" dir="rtl">
            <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
            <h2 className="font-bold text-2xl mb-2">عذراً، حدث خطأ</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => router.replace('/dashboard')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition">العودة للوحة التحكم</button>
        </div>
    );

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden" dir="rtl">
            {/* الشريط العلوي (تحول لشريط تحكم سفلي احترافي) */}
            <div className="flex-1 w-full relative flex flex-col md:flex-row overflow-hidden">
                {/* 1. حاوية الفيديو */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {!inCall ? (
                        <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-blue-900/50 rounded-full flex items-center justify-center mb-2 text-blue-400">
                                <Video className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-3">هل أنت مستعد لبدء الحصة؟</h2>
                                <p className="text-gray-400 text-lg">تأكد من إضاءة الغرفة وعمل الميكروفون بشكل جيد قبل الدخول.</p>
                            </div>
                            <button onClick={() => setInCall(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transition transform hover:scale-105 hover:-translate-y-1 text-lg ring-4 ring-blue-600/30">
                                انضمام للمكالمة المرئية
                            </button>
                        </div>
                    ) : (
                        <AgoraCall rtcProps={rtcProps} callbacks={{ EndCall: () => handleLeave() }} />
                    )}
                </div>

                {/* 2. شريط أدوات المعلم الجانبي */}
                {isTeacher && inCall && (
                    <div className="w-full md:w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-5 shadow-2xl z-10">
                        <h3 className="text-slate-500 text-xs font-bold mb-2">أدوات التحكم السريعة</h3>
                        
                        {/* 🟢 الزر الفعال الجديد: مشاركة الشاشة */}
                        <button 
                            onClick={toggleScreenShare} 
                            className={`h-12 px-4 rounded-lg flex items-center gap-3 transition group border ${isSharing ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'}`}
                        >
                            <MonitorUp className="w-5 h-5 group-hover:scale-110 transition" />
                            <div className="text-right flex-1">
                                <div className="text-sm font-bold">{isSharing ? 'إيقاف المشاركة' : 'مشاركة الشاشة'}</div>
                            </div>
                        </button>

                        <div className="mt-auto bg-blue-900/10 border border-blue-800/30 p-4 rounded-xl flex gap-2">
                            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-400 text-right leading-relaxed">
                                ميزة كتم صوت الطلاب ستتوفر عند تفعيل WebSocket في الإصدار القادم.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* الشريط السفلي (Control Bar) */}
            <div className="h-24 shrink-0 bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.4)] border-t border-slate-800 gap-4 z-20">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${inCall ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                    <div className="text-right">
                        <h1 className="font-bold text-sm md:text-base leading-tight">
                            {isTeacher ? 'لوحة تحكم المعلم' : 'الفصل الافتراضي'}
                        </h1>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">حصة رقم #{params.id}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {isTeacher ? (
                        <>
                            <button onClick={handleLeave} className="bg-slate-700 hover:bg-slate-600 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold transition flex items-center gap-2 border border-slate-600">خروج مؤقت <LogOut className="w-4 h-4" /></button>
                            <button onClick={() => setShowEndConfirm(true)} disabled={isEnding} className="bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2">
                                {isEnding ? 'جاري الإنهاء...' : <>إنهاء الحصة وتحصيل الأرباح <PowerOff className="w-4 h-4" /></>}
                            </button>
                        </>
                    ) : (
                        <button onClick={handleLeave} className="bg-red-600 hover:bg-red-700 px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold transition flex items-center gap-2 shadow-lg">مغادرة الحصة <LogOut className="w-4 h-4" /></button>
                    )}
                </div>
            </div>

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
