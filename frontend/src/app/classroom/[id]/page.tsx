"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

// 🟢 التعديل السحري: استدعاء مكوننا المحلي بشكل ديناميكي وإيقاف SSR تماماً
// مع إضافة رسالة تحميل جميلة أثناء فتح الكاميرا
const AgoraCall = dynamic(() => import('@/components/classroom/AgoraCall'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white font-bold animate-pulse">جاري تشغيل الكاميرا وإعداد الاتصال... 🎥</p>
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

    const isTeacher = user?.roles?.some((r) => r.name === 'teacher');

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                const res = await api.get(`/bookings/${params.id}/classroom`);
                const data = res.data.data;
                
                setChannelName(data.channel_name);
                setUid(data.uid);
                setUserRole(data.role === 'host' ? 'host' : 'audience');
                
                if (data.token) {
                    setAgoraToken(data.token);
                }
                
                setLoading(false);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'فشل الاتصال بالغرفة الافتراضية أو غير مصرح لك.');
                } else {
                    setError('حدث خطأ غير متوقع أثناء الاتصال بالغرفة.');
                }
                setLoading(false);
            }
        };

        if (user) fetchAccess();
    }, [params.id, user]);

    const handleLeave = () => {
        setInCall(false); 
        setTimeout(() => {
            router.replace('/dashboard');
        }, 1000);
    };

    const handleCompleteClass = async () => {
        if (!confirm("هل أنت متأكد من إنهاء الحصة؟ سيتم إغلاق الغرفة وإيداع الأرباح في محفظتك.")) return;
        
        setIsEnding(true);
        try {
            await api.patch(`/bookings/${params.id}/complete`);
            alert("تم إنهاء الحصة بنجاح! وتم إيداع الأرباح. 💰");
            
            setInCall(false); 
            setTimeout(() => {
                router.replace('/dashboard');
            }, 1000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || "حدث خطأ أثناء إنهاء الحصة");
            } else {
                alert("حدث خطأ غير متوقع.");
            }
            setIsEnding(false);
        }
    };

    const rtcProps = {
        appId: '3ebe5a81032c4451ab8479d10894cc99',
        channel: channelName,
        token: agoraToken,
        uid: uid,
        role: userRole, 
        layout: 1,
        disableRtm: true,
    };

    const callbacks = {
        EndCall: () => handleLeave(),
    };

    if (authLoading || loading) return (
        <div className="h-screen flex items-center justify-center font-bold text-xl animate-pulse bg-gray-900 text-white" dir="rtl">
            جاري تجهيز الفصل الافتراضي وتشفير الاتصال... 🔒
        </div>
    );
    
    if (error) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white" dir="rtl">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="font-bold text-2xl mb-2">عذراً، حدث خطأ</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={() => router.replace('/dashboard')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition">
                العودة للوحة التحكم
            </button>
        </div>
    );

    return (
        <div className="h-screen w-full bg-gray-900 flex flex-col" dir="rtl">
            <div className="bg-gray-800 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-md border-b border-gray-700 gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${inCall ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <h1 className="font-bold text-lg">
                        {isTeacher ? 'لوحة تحكم المعلم (المضيف)' : 'الفصل الافتراضي'} - {channelName}
                    </h1>
                </div>

                <div className="flex gap-3">
                    {isTeacher ? (
                        <>
                            <button 
                                onClick={handleLeave} 
                                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                خروج مؤقت 🚪
                            </button>
                            <button 
                                onClick={handleCompleteClass} 
                                disabled={isEnding}
                                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition disabled:opacity-50"
                            >
                                {isEnding ? 'جاري الإنهاء...' : 'إنهاء الحصة وتحصيل الأرباح 🔴'}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={handleLeave} 
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                            مغادرة الحصة 🚪
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex-1 w-full relative flex flex-col md:flex-row">
                <div className="flex-1 relative bg-black flex items-center justify-center">
                    {!inCall ? (
                        <div className="flex flex-col items-center justify-center space-y-6 p-8 text-center animate-fade-in-up">
                            <div className="w-20 h-20 bg-blue-900/50 rounded-full flex items-center justify-center text-4xl mb-2">📹</div>
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-3">هل أنت مستعد لبدء الحصة؟</h2>
                                <p className="text-gray-400 text-lg">تأكد من إضاءة الغرفة وعمل الميكروفون بشكل جيد قبل الدخول.</p>
                            </div>
                            <button 
                                onClick={() => setInCall(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transition transform hover:scale-105 hover:-translate-y-1 text-lg ring-4 ring-blue-600/30"
                            >
                                انضمام للمكالمة المرئية
                            </button>
                        </div>
                    ) : (
                        <AgoraCall rtcProps={rtcProps} callbacks={callbacks} />
                    )}
                </div>

                {isTeacher && inCall && (
                    <div className="w-full md:w-72 bg-gray-800 border-r border-gray-700 p-6 flex flex-col gap-5 shadow-inner">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">أدوات التحكم السريعة</h3>
                        
                        <button className="bg-gray-700/50 cursor-not-allowed text-gray-400 p-4 rounded-2xl flex items-center gap-4 transition group" title="قريباً: يتطلب تحديث SDK">
                            <span className="text-3xl group-hover:opacity-50 transition">💻</span>
                            <div className="text-right flex-1">
                                <div className="text-sm font-bold text-gray-300">مشاركة الشاشة</div>
                                <div className="text-xs text-gray-500 mt-1">مشاركة العروض والملفات</div>
                            </div>
                        </button>

                        <button className="bg-gray-700/50 cursor-not-allowed text-gray-400 p-4 rounded-2xl flex items-center gap-4 transition group" title="قريباً: يتطلب تحديث SDK">
                            <span className="text-3xl group-hover:opacity-50 transition">🔇</span>
                            <div className="text-right flex-1">
                                <div className="text-sm font-bold text-gray-300">كتم صوت الطالب</div>
                                <div className="text-xs text-gray-500 mt-1">التحكم في الميكروفون للجميع</div>
                            </div>
                        </button>

                        <div className="mt-auto bg-blue-900/20 border border-blue-800/50 p-4 rounded-xl">
                            <p className="text-xs text-blue-300/80 text-center leading-relaxed font-medium">
                                ℹ️ سيتم تفعيل أدوات التحكم المتقدمة بمجرد ترقية رخصة Agora في التحديث القادم للمنصة.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}