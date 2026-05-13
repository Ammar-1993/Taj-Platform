"use client";

import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { 
    IAgoraRTCClient, 
    ICameraVideoTrack, 
    IMicrophoneAudioTrack, 
    IAgoraRTCRemoteUser,
    ILocalVideoTrack
} from 'agora-rtc-sdk-ng';
import { Loader2, User, MicOff, WifiOff } from 'lucide-react';

type AgoraCallProps = {
  rtcProps: {
    appId: string;
    channel: string;
    token: string | null;
    uid: number;
    role: 'host' | 'audience';
  };
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  isSharing?: boolean;
  localScreenTrack?: ILocalVideoTrack | null;
};

export default function AgoraCall({ 
    rtcProps, 
    isCameraEnabled, 
    isMicEnabled,
    isSharing,
    localScreenTrack
}: AgoraCallProps) {
    // ✅ VP9: ~20% better compression than VP8 at the same quality — frees bandwidth for whiteboard WS traffic
    const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp9" }));
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(0);

    const localVideoRef = useRef<HTMLDivElement>(null);
    const localScreenRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(rtcProps);
    propsRef.current = rtcProps;

    useEffect(() => {
        let isMounted = true;
        let vTrack: ICameraVideoTrack | null = null;
        let aTrack: IMicrophoneAudioTrack | null = null;

        const init = async () => {
            try {
                client.on("user-published", async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (isMounted) {
                        setRemoteUsers(prev => {
                            const filtered = prev.filter(u => u.uid !== user.uid);
                            return [...filtered, user];
                        });
                    }
                });

                client.on("user-unpublished", (user) => {
                    if (isMounted) {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                    }
                });

                client.on("user-left", (user) => {
                    if (isMounted) {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                    }
                });

                client.on("network-quality", (stats) => {
                    if (isMounted) {
                        setNetworkQuality(stats.downlinkNetworkQuality);
                    }
                });

                const { appId, channel, token, uid } = propsRef.current;
                await client.join(appId, channel, token, uid);

                // ✅ Dual-stream: students on weak connections automatically receive a low-res feed,
                // reducing overall bandwidth consumption without disconnecting the session.
                try {
                    await client.enableDualStream();
                    client.setLowStreamParameter({
                        width: 320,
                        height: 240,
                        framerate: 15,
                        bitrate: 200,
                    });
                } catch (dualStreamErr) {
                    // Non-fatal — dual-stream is a quality-of-service enhancement only
                    console.warn('[AgoraCall] Dual-stream setup skipped:', dualStreamErr);
                }

                // ✅ الاشتراك في مستخدمين موجودين مسبقاً في الغرفة
                // (يحل مشكلة: المعلم لا يرى الطالب الذي انضم قبله)
                for (const remoteUser of client.remoteUsers) {
                    if (remoteUser.hasVideo) await client.subscribe(remoteUser, 'video');
                    if (remoteUser.hasAudio) await client.subscribe(remoteUser, 'audio');
                    if (isMounted) {
                        setRemoteUsers(prev => [...prev.filter(u => u.uid !== remoteUser.uid), remoteUser]);
                    }
                }
                
                try {
                    // فقط إذا كان الدور host، نقوم بفتح الكاميرا والمايكروفون
                    if (propsRef.current.role === 'host') {
                        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
                            { 
                                encoderConfig: "music_standard",  // 48kbps stereo — clearer teaching voice
                                AEC: true, 
                                ANS: true, 
                                AGC: true 
                            },
                            { 
                                encoderConfig: "720p_2"  // 720p @ 30fps (vs 720p_1 @ 15fps)
                            }
                        );
                        
                        if (isMounted) {
                            vTrack = videoTrack;
                            aTrack = audioTrack;
                            setLocalAudioTrack(audioTrack);
                            setLocalVideoTrack(videoTrack);
                            
                            await client.publish([audioTrack, videoTrack]);
                            audioTrack.setEnabled(isMicEnabled);
                            videoTrack.setEnabled(isCameraEnabled);
                            setIsJoined(true);
                        } else {
                            audioTrack.close();
                            videoTrack.close();
                        }
                    } else {
                        // إذا كان audience، نعتبره منضماً بمجرد نجاح join العميل
                        if (isMounted) setIsJoined(true);
                    }
                } catch (e) {
                    console.error("Error creating tracks:", e);
                    if (isMounted) setIsJoined(true);
                }
            } catch (err) {
                console.error("Agora Init Error:", err);
            }
        };

        init();

        return () => {
            isMounted = false;
            if (vTrack) vTrack.close();
            if (aTrack) aTrack.close();
            client.leave();
            client.removeAllListeners();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client]);

    useEffect(() => {
        if (localVideoTrack) localVideoTrack.setEnabled(isCameraEnabled);
    }, [isCameraEnabled, localVideoTrack]);

    useEffect(() => {
        if (localAudioTrack) localAudioTrack.setEnabled(isMicEnabled);
    }, [isMicEnabled, localAudioTrack]);

    useEffect(() => {
        if (localVideoTrack && localVideoRef.current) {
            localVideoTrack.play(localVideoRef.current, { fit: 'cover' });
        }
    }, [localVideoTrack]);

    useEffect(() => {
        if (localScreenTrack && localScreenRef.current) {
            localScreenTrack.play(localScreenRef.current, { fit: 'contain' });
        }
    }, [localScreenTrack]);

    if (!isJoined) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="animate-pulse">جاري تهيئة الاتصال...</p>
            </div>
        );
    }

    // الكشف عن مشاركة الشاشة (الـ UID الضخم)
    const remoteScreenUser = remoteUsers.find(u => Number(u.uid) >= 1000000000);
    const isScreenSharingActive = isSharing || !!remoteScreenUser;
    // المستخدمون البعيدون الحقيقيون (بدون شاشة المعلم)
    const visibleRemoteUsers = remoteUsers.filter(u => Number(u.uid) < 1000000000);

    return (
        <div className="w-full h-full relative bg-slate-950 overflow-hidden">
            {/* مؤشر جودة الشبكة */}
            {networkQuality > 2 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-xs font-bold animate-bounce shadow-xl border border-red-500/20">
                    <WifiOff className="w-4 h-4" />
                    اتصال الإنترنت لديك ضعيف حالياً
                </div>
            )}

            {isScreenSharingActive ? (
                /* 🖥️ Responsive Screen Share Layout */
                <div className="w-full h-full flex flex-col relative">
                    {/* Primary Content (Screen) */}
                    <div className="flex-1 bg-black relative">
                        {isSharing && localScreenTrack ? (
                            <div ref={localScreenRef} className="w-full h-full [&>video]:object-contain" />
                        ) : remoteScreenUser ? (
                            <RemotePlayer user={remoteScreenUser} isPrimary />
                        ) : null}
                    </div>

                    {/* Participant Thumbnails (floating bottom-right) */}
                    <div className="absolute bottom-4 right-4 flex flex-row md:flex-col gap-3 z-10">
                        {/* Local Camera Thumbnail (Only for Host) */}
                        {rtcProps.role === 'host' && (
                            <div className="w-24 h-32 rounded-lg shadow-xl border border-slate-700 bg-slate-900 overflow-hidden relative transition-all hover:scale-105">
                                <div ref={localVideoRef} className="w-full h-full [&>video]:object-cover">
                                    {!isCameraEnabled && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                            <User className="w-8 h-8 opacity-10" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/5">أنت</div>
                            </div>
                        )}

                        {/* Remote Participant Thumbnails */}
                        {remoteUsers.filter(u => Number(u.uid) < 1000000000).map(user => (
                            <div key={user.uid} className="w-24 h-32 rounded-lg shadow-xl border border-slate-700 bg-slate-900 overflow-hidden relative transition-all hover:scale-105">
                                <RemotePlayer user={user} />
                                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white border border-white/5">مشارك</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* 🎯 Smart PiP Layout
                 * The local video div is ALWAYS mounted so the Agora track never
                 * needs to re-attach. CSS transition moves it from full-screen
                 * (solo) to a bottom-right PiP window (speaker mode).
                 */
                <div className="relative w-full h-full">

                    {/* ── Remote user: fills the main view when present ── */}
                    {visibleRemoteUsers.length > 0 && (
                        <>
                            <div className="absolute inset-0">
                                <RemotePlayer user={visibleRemoteUsers[0]} />
                            </div>
                            <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-lg px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5 shadow-xl text-white">
                                مشارك
                                {!visibleRemoteUsers[0].hasAudio && <MicOff className="w-3 h-3 text-red-400" />}
                            </div>
                        </>
                    )}

                    {/* ── Audience waiting state (no local track, no remote yet) ── */}
                    {visibleRemoteUsers.length === 0 && rtcProps.role !== 'host' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-5">
                                <Loader2 className="w-10 h-10 animate-spin opacity-20" />
                            </div>
                            <p className="text-sm md:text-base font-medium tracking-wide">بانتظار انضمام المعلم...</p>
                        </div>
                    )}

                    {/* ── Local camera: always mounted, CSS-only position change ──
                     *  Solo  → absolute inset-0 (fills screen)
                     *  Speaker → absolute bottom-4 right-4 (PiP window)
                     */}
                    {rtcProps.role === 'host' && (
                        <div className={`absolute overflow-hidden transition-all duration-500 ease-in-out ${
                            visibleRemoteUsers.length > 0
                                // 📱 PiP mode
                                ? 'bottom-4 right-4 w-36 h-48 md:w-44 md:h-60 rounded-2xl border-2 border-slate-700 shadow-2xl shadow-black/70 z-20 ring-1 ring-white/10'
                                // 🖥️ Solo mode
                                : 'inset-0 z-0'
                        }`}>
                            {/* Video track container — track is played into this ref */}
                            <div ref={localVideoRef} className="w-full h-full [&>video]:object-cover" />

                            {/* Camera-off overlay */}
                            {!isCameraEnabled && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                                    <User className={`${visibleRemoteUsers.length > 0 ? 'w-10 h-10' : 'w-20 h-20'} opacity-10`} />
                                    {visibleRemoteUsers.length === 0 && (
                                        <span className="text-sm font-medium mt-2 tracking-wide">الكاميرا متوقفة</span>
                                    )}
                                </div>
                            )}

                            {/* “أنت” label: compact in PiP, full-size in solo */}
                            {visibleRemoteUsers.length > 0 ? (
                                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                                    أنت
                                    {!isMicEnabled && <MicOff className="w-2.5 h-2.5 text-red-400" />}
                                </div>
                            ) : (
                                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-xl text-sm font-bold border border-white/10 flex items-center gap-2 shadow-xl text-white">
                                    أنت
                                    {!isMicEnabled && <MicOff className="w-4 h-4 text-red-400" />}
                                </div>
                            )}

                            {/* Waiting pulse (solo mode only) */}
                            {visibleRemoteUsers.length === 0 && (
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-slate-300 border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                    بانتظار انضمام الطرف الآخر...
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

function RemotePlayer({ user, isPrimary }: { user: IAgoraRTCRemoteUser, isPrimary?: boolean }) {
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user.videoTrack && videoRef.current) {
            // استخدام 'contain' لمشاركة الشاشة و 'cover' للكاميرا
            const fitMode = isPrimary ? 'contain' : 'cover';
            user.videoTrack.play(videoRef.current, { fit: fitMode });
        }
        if (user.audioTrack) user.audioTrack.play();
    }, [user.videoTrack, user.audioTrack, isPrimary]);

    return (
        <div ref={videoRef} className="w-full h-full transition-opacity duration-500">
            {!user.hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                    <User className="w-20 h-20 opacity-5" />
                </div>
            )}
        </div>
    );
}
