"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';

// Import AgoraUIKit dynamically, disabling SSR (Server-Side Rendering)
// This is critical because WebRTC SDKs require the 'window' object, which isn't available during SSR.
const AgoraUIKit = dynamic(() => import('agora-react-uikit'), { ssr: false });

export default function ClassroomPage({ params }: { params: { id: string } }) {
    const { user } = useAuth(); // Enhanced: Access authenticated user context
    const router = useRouter();
    
    // State management
    const [channelName, setChannelName] = useState('');
    const [uid, setUid] = useState<number>(0);
    const [userRole, setUserRole] = useState<string>('audience'); // Enhanced: Track Agora role
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inCall, setInCall] = useState(false);
    const [isEnding, setIsEnding] = useState(false); // Enhanced: Loading state for ending class

    // Derived State
    const isTeacher = user?.roles?.some((r: any) => r.name === 'teacher');

    useEffect(() => {
        const fetchAccess = async () => {
            try {
                // Enhanced API call gets specific access details including generated token foundation and role
                const res = await api.get(`/bookings/${params.id}/classroom`);
                setChannelName(res.data.data.channel_name);
                setUid(res.data.data.uid);
                setUserRole(res.data.data.role); // Sets 'host' or 'audience' based on backend logic
                setLoading(false);
            } catch (err: any) {
                setError(err.response?.data?.message || 'فشل الاتصال بالغرفة الافتراضية');
                setLoading(false);
            }
        };
        if (user) fetchAccess(); // Enhanced: Only fetch once user context is available
    }, [params.id, user]);

    // 🌟 Enhanced Difiction: Distinct Leave vs. Complete handlers

    // 1. handleLeave: Standard Graceful Leave (Old logic retained and polished)
    // Used by students, or teachers who just want to leave temporarily but keep the class 'in_progress'.
    const handleLeave = () => {
        // Step 1: Immediately hide the AgoraUIKit component. 
        // This triggers its internal cleanup, closing microphone, camera, and WebSockets.
        setInCall(false); 
        
        // Step 2: Wait briefly for the background cleanup to complete, then redirect.
        // This prevents the green camera light from staying on after redirect.
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
    };

    // 2. handleCompleteClass: Teacher-only Finalization (NEW Logic for FR-T-04)
    // Used by teachers to end the call for everyone, update DB status, and trigger payment disbursement.
    const handleCompleteClass = async () => {
        if (!confirm("هل أنت متأكد من إنهاء الحصة؟ سيتم إغلاق الغرفة وإيداع الأرباح في محفظتك.")) return;
        
        setIsEnding(true);
        try {
            // Call the specialized 'complete' API endpoint
            await api.patch(`/bookings/${params.id}/complete`);
            alert("تم إنهاء الحصة بنجاح! وتم إيداع الأرباح. 💰");
            
            // Clean up locally
            setInCall(false); 
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (error: any) {
            alert(error.response?.data?.message || "حدث خطأ أثناء إنهاء الحصة");
            setIsEnding(false);
        }
    };

    const rtcProps = {
        appId: '039c4b2d111b488f8069bb00c583aa04', // Testing App ID (should move to env later)
        channel: channelName,
        uid: uid,
        // Enhanced: Pass the dynamically fetched role
        role: userRole === 'host' ? 'host' : 'audience', 
        layout: 1, // Grid layout
        disableRtm: true, // Chat disabled for simplicity
    };

    const callbacks = {
        EndCall: () => handleLeave(), // EndCall in UIKit triggers standard leave
    };

    // UI Rendering: Loading & Error States
    if (loading) return (
        <div className="h-screen flex items-center justify-center font-bold text-xl animate-pulse bg-gray-900 text-white">
            جاري تجهيز الفصل الافتراضي...
        </div>
    );
    
    if (error) return (
        <div className="h-screen flex items-center justify-center text-red-500 font-bold text-xl bg-gray-900">
            {error}
        </div>
    );

    // Main UI Rendering
    return (
        <div className="h-screen w-full bg-gray-900 flex flex-col">
            
            {/* 🟢 NEW: Enhanced Smart Header */}
            {/* Changes appearance and controls based on whether the user is a Teacher or Student */}
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md border-b border-gray-700">
                <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full animate-pulse ${inCall ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <h1 className="font-bold text-lg">
                        {isTeacher ? 'لوحة تحكم المعلم (المضيف)' : 'الفصل الافتراضي'} - {channelName}
                    </h1>
                </div>

                <div className="flex gap-3">
                    {/* Conditional Buttons based on role */}
                    {isTeacher ? (
                        <>
                            {/* Teachers get temporary leave and final complete buttons */}
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
                        // Students get only the generic leave button (Old UI retained)
                        <button 
                            onClick={handleLeave} 
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                            مغادرة الحصة 🚪
                        </button>
                    )}
                </div>
            </div>
            
            {/* Main Content Area: Video + Sidebar */}
            <div className="flex-1 w-full relative flex flex-col md:flex-row">
                
                {/* 1. Main Video Container */}
                <div className="flex-1 relative bg-black">
                    {!inCall ? (
                        // Pre-call Join Screen (Old UI retained and centered)
                        <div className="h-full flex flex-col items-center justify-center space-y-4 p-8">
                            <div className="text-white text-center mb-4">
                                <h2 className="text-3xl font-bold mb-3">هل أنت مستعد لبدء الحصة؟</h2>
                                <p className="text-gray-400 text-lg">تأكد من إضاءة الغرفة وعمل الميكروفون بشكل جيد.</p>
                            </div>
                            <button 
                                onClick={() => setInCall(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transition transform hover:scale-105 text-lg"
                            >
                                انضمام للمكالمة المرئية 📹
                            </button>
                        </div>
                    ) : (
                        // Active Call Video
                        <AgoraUIKit rtcProps={rtcProps as any} callbacks={callbacks} />
                    )}
                </div>

                {/* 🟢 NEW: Teacher Host Controls Sidebar */}
                {/* Appears only for Teachers when they are actively inside the call */}
                {isTeacher && inCall && (
                    <div className="w-full md:w-72 bg-gray-800 border-l border-gray-700 p-6 flex flex-col gap-5 shadow-inner">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">أدوات التحكم</h3>
                        
                        {/* Control 1: Screen Share Foundation */}
                        <button className="bg-gray-700/50 cursor-not-allowed text-gray-400 p-4 rounded-2xl flex items-center gap-4 transition" title="قريباً: يتطلب تحديث SDK">
                            <span className="text-3xl">💻</span>
                            <div className="text-left">
                                <div className="text-base font-bold text-gray-300">مشاركة الشاشة</div>
                                <div className="text-xs text-gray-500">مشاركة نوافذ التطبيقات أو التبويبات</div>
                            </div>
                        </button>

                        {/* Control 2: Mute Remote Foundation */}
                        <button className="bg-gray-700/50 cursor-not-allowed text-gray-400 p-4 rounded-2xl flex items-center gap-4 transition" title="قريباً: يتطلب تحديث SDK">
                            <span className="text-3xl">🔇</span>
                            <div className="text-left">
                                <div className="text-base font-bold text-gray-300">كتم صوت الطالب</div>
                                <div className="text-xs text-gray-500">إيقاف ميكروفون الطالب</div>
                            </div>
                        </button>

                        {/* Architectural Insight Note */}
                        <div className="mt-auto bg-blue-950/40 border border-blue-800 p-5 rounded-2xl">
                            <p className="text-xs text-blue-300 text-center leading-relaxed">
                                ℹ️ ملاحظة برمجية: أدوات التحكم المتقدمة مثل مشاركة الشاشة وكتم الصوت تتطلب ترقية مكتبة Agora في الإصدار القادم. هذه الواجهة هي واجهة مبدئية للإضافة.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}