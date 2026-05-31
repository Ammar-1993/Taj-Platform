"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import AgoraRTC, { 
    IAgoraRTCClient, 
    IAgoraRTCRemoteUser,
    ILocalVideoTrack,
    ILocalAudioTrack
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
  /** Pass the stream already acquired in the lobby to avoid device-busy errors. */
  lobbyMediaStream?: MediaStream | null;
  /** When provided, screen content is rendered into this external div instead of
   *  AgoraCall's internal screen-share layout, enabling Focus Mode in page.tsx. */
  externalScreenRef?: React.RefObject<HTMLDivElement>;
  /** Fires true when a remote screen-share starts, false when it stops. */
  onScreenShareActive?: (active: boolean) => void;
};

const AgoraCall = React.memo(({ 
    rtcProps, 
    isCameraEnabled, 
    isMicEnabled,
    isSharing,
    localScreenTrack,
    lobbyMediaStream,
    externalScreenRef,
    onScreenShareActive,
}: AgoraCallProps) => {
    // ✅ VP9: ~20% better compression than VP8 at the same quality — frees bandwidth for whiteboard WS traffic
    const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp9" }));
    const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(0);
    const [remoteNetworkStats, setRemoteNetworkStats] = useState<Record<string, number>>({});

    const localVideoRef = useRef<HTMLDivElement>(null);
    const localScreenRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(rtcProps);
    propsRef.current = rtcProps;

    const lobbyStreamRef = useRef(lobbyMediaStream);
    lobbyStreamRef.current = lobbyMediaStream;

    useEffect(() => {
        let isMounted = true;
        let vTrack: ILocalVideoTrack | null = null;
        let aTrack: ILocalAudioTrack | null = null;
        let qualityInterval: NodeJS.Timeout;

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
                        setRemoteUsers(prev => {
                            const filtered = prev.filter(u => u.uid !== user.uid);
                            return [...filtered, user];
                        });
                    }
                });

                client.on("user-left", (user) => {
                    if (isMounted) {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                    }
                });

                client.on("network-quality", (stats) => {
                    if (isMounted) {
                        const down = stats.downlinkNetworkQuality;
                        setNetworkQuality(down);

                        // ✅ Manual Dual-Stream Fallback (Task 2): Switch to low-quality stream if downlink is poor
                        client.remoteUsers.forEach(user => {
                            if (user.hasVideo) {
                                if (down >= 3) {
                                    client.setRemoteVideoStreamType(user.uid, 1); // 1: Low stream
                                } else {
                                    client.setRemoteVideoStreamType(user.uid, 0); // 0: High stream
                                }
                            }
                        });
                    }
                });

                // Poll remote network qualities every 2s
                qualityInterval = setInterval(() => {
                    if (isMounted && client.connectionState === "CONNECTED") {
                        const stats = client.getRemoteNetworkQuality();
                        const newStats: Record<string, number> = {};
                        Object.keys(stats).forEach(uid => {
                            newStats[uid] = stats[uid].downlinkNetworkQuality;
                        });
                        setRemoteNetworkStats(newStats);
                    }
                }, 2000);

                const { appId, channel, token, uid } = propsRef.current;
                await client.join(appId, channel, token, uid);

                // ✅ Dual-stream & Performance: Drastically reduce bandwidth and handle poor connections.
                try {
                    // Enable dual-stream mode (simulcast)
                    await client.enableDualStream();
                    client.setLowStreamParameter({
                        width: 320,
                        height: 240,
                        framerate: 15,
                        bitrate: 150, // Highly optimized for weak student connections
                    });
                } catch (dualStreamErr) {
                    // Non-fatal — dual-stream is a quality-of-service enhancement only
                    console.warn('[AgoraCall] Performance optimizations skipped:', dualStreamErr);
                }

                // ✅ الاشتراك في مستخدمين موجودين مسبقاً في الغرفة
                // (يحل مشكلة: المعلم لا يرى الطالب الذي انضم قبله)
                for (const remoteUser of client.remoteUsers) {
                    if (remoteUser.hasVideo) {
                        await client.subscribe(remoteUser, 'video');
                        // Apply initial fallback check
                        if (networkQuality >= 3) client.setRemoteVideoStreamType(remoteUser.uid, 1);
                    }
                    if (remoteUser.hasAudio) await client.subscribe(remoteUser, 'audio');
                    if (isMounted) {
                        setRemoteUsers(prev => [...prev.filter(u => u.uid !== remoteUser.uid), remoteUser]);
                    }
                }
                
                try {
                    // فقط إذا كان الدور host، نقوم بفتح الكاميرا والمايكروفون
                    if (propsRef.current.role === 'host') {
                        const lobbyStream = lobbyStreamRef.current;

                        if (lobbyStream) {
                            // 🚀 Hardware Track Reusability (Task 4): Use tracks from lobby directly
                            const videoTrackObj = lobbyStream.getVideoTracks()[0];
                            const audioTrackObj = lobbyStream.getAudioTracks()[0];

                            if (videoTrackObj) {
                                vTrack = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrackObj });
                            }
                            if (audioTrackObj) {
                                aTrack = await AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: audioTrackObj });
                            }
                        }

                        // Fallback if lobby stream was missing or partial
                        if (!vTrack || !aTrack) {
                            const [fallbackAudio, fallbackVideo] = await AgoraRTC.createMicrophoneAndCameraTracks(
                                { encoderConfig: "music_standard", AEC: true, ANS: true, AGC: true },
                                { encoderConfig: "360p_1", optimizationMode: "motion" }
                            );
                            if (!vTrack) vTrack = fallbackVideo; else fallbackVideo.close();
                            if (!aTrack) aTrack = fallbackAudio; else fallbackAudio.close();
                        }
                        
                        if (isMounted) {
                            setLocalAudioTrack(aTrack);
                            setLocalVideoTrack(vTrack);
                            
                            await client.publish([aTrack, vTrack]);
                            aTrack.setEnabled(isMicEnabled);
                            vTrack.setEnabled(isCameraEnabled);
                            setIsJoined(true);
                        } else {
                            if (aTrack) aTrack.close();
                            if (vTrack) vTrack.close();
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
            // The interval is captured in the closure of init, but to clean it up reliably 
            // without defining it outside, we can rely on isMounted = false stopping state updates.
            // However, to be totally clean, let's just let it run one last time and die, or:
            clearInterval(qualityInterval);
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
        if (!localScreenTrack) return;
        // When externalScreenRef is supplied, play screen into external container
        const target = externalScreenRef?.current ?? localScreenRef.current;
        if (target) localScreenTrack.play(target, { fit: 'contain' });
    }, [localScreenTrack, externalScreenRef]);

    // Notify parent when a remote screen-share starts or stops
    useEffect(() => {
        const hasRemoteScreen = remoteUsers.some(u => Number(u.uid) >= 1000000000);
        onScreenShareActive?.(hasRemoteScreen);
    }, [remoteUsers, onScreenShareActive]);

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
            {networkQuality > 3 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-xs font-bold animate-bounce shadow-xl border border-red-500/20">
                    <WifiOff className="w-4 h-4" />
                    اتصال الإنترنت لديك ضعيف حالياً
                </div>
            )}

            {/* Portal: render remote screen share into external container (Focus Mode) */}
            {externalScreenRef?.current && remoteScreenUser && (
                createPortal(
                    <RemotePlayer user={remoteScreenUser} isPrimary />,
                    externalScreenRef.current
                )
            )}

            {isScreenSharingActive && !externalScreenRef ? (
                /* 🖥️ Internal Screen Share Layout (no externalScreenRef) */
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
                                <div ref={localVideoRef} className="w-full h-full [&>video]:object-cover relative">
                                    <StatusOverlay isMuted={!isMicEnabled} networkQuality={networkQuality} />
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
                                <RemotePlayer user={user} networkQuality={remoteNetworkStats[user.uid] || 0} />
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
                                <RemotePlayer user={visibleRemoteUsers[0]} networkQuality={remoteNetworkStats[visibleRemoteUsers[0].uid] || 0} />
                            </div>
                            <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-lg px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-1.5 shadow-xl text-white">
                                مشارك
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
                            <div ref={localVideoRef} className="w-full h-full [&>video]:object-cover relative">
                                <StatusOverlay isMuted={!isMicEnabled} networkQuality={networkQuality} />
                            </div>

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
                                </div>
                            ) : (
                                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-xl text-sm font-bold border border-white/10 flex items-center gap-2 shadow-xl text-white">
                                    أنت
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
});

export default AgoraCall;

function RemotePlayer({ user, isPrimary, networkQuality = 0 }: { user: IAgoraRTCRemoteUser, isPrimary?: boolean, networkQuality?: number }) {
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
        <div ref={videoRef} className="w-full h-full relative transition-opacity duration-500">
            {!isPrimary && <StatusOverlay isMuted={!user.hasAudio} networkQuality={networkQuality} />}
            {!user.hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                    <User className="w-20 h-20 opacity-5" />
                </div>
            )}
        </div>
    );
}

function StatusOverlay({ isMuted, networkQuality, className = "top-2 left-2" }: { isMuted: boolean, networkQuality: number, className?: string }) {
    // 1-2: Good (Green), 3-4: Poor (Yellow), 5-6: Bad (Red), 0: Unknown (Gray)
    const color = networkQuality > 0 && networkQuality <= 2 ? 'bg-emerald-500' :
                  networkQuality === 3 || networkQuality === 4 ? 'bg-amber-400' :
                  networkQuality >= 5 ? 'bg-red-500' : 'bg-slate-600';
    
    const bars = networkQuality > 0 && networkQuality <= 2 ? 3 :
                 networkQuality === 3 || networkQuality === 4 ? 2 :
                 networkQuality >= 5 ? 1 : 0;

    return (
        <div className={`absolute flex items-center gap-1.5 z-30 pointer-events-none ${className}`} dir="ltr">
            {isMuted && (
                <div className="bg-black/60 backdrop-blur-md p-1 rounded-full border border-red-500/30 shadow-lg transition-opacity">
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                </div>
            )}
            <div className="bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-md flex items-end gap-[3px] h-[22px] border border-white/5 shadow-lg" title={`Network: ${networkQuality}`}>
                <div className={`w-[3px] rounded-sm h-[8px] transition-colors ${bars >= 1 ? color : 'bg-slate-600'}`} />
                <div className={`w-[3px] rounded-sm h-[12px] transition-colors ${bars >= 2 ? color : 'bg-slate-600'}`} />
                <div className={`w-[3px] rounded-sm h-[16px] transition-colors ${bars >= 3 ? color : 'bg-slate-600'}`} />
            </div>
        </div>
    );
}
