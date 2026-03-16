"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import dynamic from 'next/dynamic';

const AgoraUIKit = dynamic(() => import('agora-react-uikit'), { ssr: false });

export default function ClassroomPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [channelName, setChannelName] = useState('');
    const [uid, setUid] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inCall, setInCall] = useState(false);

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                const res = await api.get(`/bookings/${params.id}/classroom`);
                setChannelName(res.data.data.channel_name);
                setUid(res.data.data.uid);
                setLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.message || 'فشل في الاتصال بالغرفة');
                setLoading(false);
            }
        };
        fetchAccess();
    }, [params.id]);

    // 🌟 دالة المغادرة الآمنة (Graceful Leave)
    const handleLeave = () => {
        // 1. إخفاء المكون فوراً ليقوم بإغلاق الكاميرا والـ WebSockets بنفسه
        setInCall(false); 
        
        // 2. الانتظار قليلاً حتى تكتمل عملية التنظيف في الخلفية، ثم التوجيه
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
    };

    const rtcProps = {
        appId: '039c4b2d111b488f8069bb00c583aa04', 
        channel: channelName,
        uid: uid,
        layout: 1,
        disableRtm: true, // تعطيل الشات لمنع أخطاء الخروج
    };

    const callbacks = {
        EndCall: () => handleLeave(),
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-xl animate-pulse">جاري تجهيز الفصل الافتراضي...</div>;
    if (error) return <div className="h-screen flex items-center justify-center text-red-500 font-bold text-xl">{error}</div>;

    return (
        <div className="h-screen w-full bg-gray-900 flex flex-col">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
                <h1 className="font-bold">منصة تاج - غرفة الحصة (معرف: {channelName})</h1>
                <button 
                    onClick={handleLeave} 
                    className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm font-semibold transition"
                >
                    مغادرة
                </button>
            </div>
            
            <div className="flex-1 w-full relative">
                {!inCall ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="text-white text-center mb-4">
                            <h2 className="text-2xl font-bold mb-2">هل أنت مستعد لبدء الحصة؟</h2>
                            <p className="text-gray-400">تأكد من إضاءة الغرفة وعمل المايكروفون.</p>
                        </div>
                        <button 
                            onClick={() => setInCall(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
                        >
                            الانضمام للفيديو 📹
                        </button>
                    </div>
                ) : (
                    <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
                )}
            </div>
        </div>
    );
}