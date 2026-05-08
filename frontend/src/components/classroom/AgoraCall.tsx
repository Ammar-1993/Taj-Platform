"use client";

import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { 
    IAgoraRTCClient, 
    ICameraVideoTrack, 
    IMicrophoneAudioTrack, 
    IAgoraRTCRemoteUser,
    ILocalVideoTrack
} from 'agora-rtc-sdk-ng';
import { Loader2, User, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);

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

                const { appId, channel, token, uid } = propsRef.current;
                await client.join(appId, channel, token, uid);
                
                try {
                    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                    
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
        if (localVideoTrack && localVideoRef.current) localVideoTrack.play(localVideoRef.current);
    }, [localVideoTrack]);

    useEffect(() => {
        if (localScreenTrack && localScreenRef.current) localScreenTrack.play(localScreenRef.current);
    }, [localScreenTrack]);

    if (!isJoined) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="animate-pulse">جاري تهيئة الاتصال...</p>
            </div>
        );
    }

    const remoteScreenUser = remoteUsers.find(u => Number(u.uid) > 10000);
    const isScreenSharingActive = isSharing || !!remoteScreenUser;

    return (
        <div className="w-full h-full relative bg-slate-950 overflow-hidden">
            {isScreenSharingActive ? (
                /* 🖥️ Responsive Screen Share Layout */
                <div className="w-full h-full flex flex-col md:flex-row relative">
                    {/* Primary Content (Screen) */}
                    <div className="flex-1 bg-black relative">
                        {isSharing && localScreenTrack ? (
                            <div ref={localScreenRef} className="w-full h-full [&>video]:object-contain" />
                        ) : remoteScreenUser ? (
                            <RemotePlayer user={remoteScreenUser} isPrimary />
                        ) : null}
                    </div>

                    {/* Participant Thumbnails (Horizontal on Mobile, Vertical on Desktop) */}
                    <div className="absolute bottom-28 md:bottom-auto md:top-20 right-4 md:right-6 flex flex-row md:flex-col gap-3 z-10">
                        {/* Local Camera Thumbnail */}
                        <div className="w-24 h-32 md:w-32 md:h-44 bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all hover:scale-105">
                            <div ref={localVideoRef} className="w-full h-full">
                                {!isCameraEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                        <User className="w-8 md:w-12 h-8 md:h-12 opacity-10" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white border border-white/5">أنت</div>
                        </div>

                        {/* Remote Participant Thumbnails */}
                        {remoteUsers.filter(u => Number(u.uid) <= 10000).map(user => (
                            <div key={user.uid} className="w-24 h-32 md:w-32 md:h-44 bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative transition-all hover:scale-105">
                                <RemotePlayer user={user} isCover />
                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white border border-white/5">مشارك</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* 👥 Responsive Grid Layout (Vertical on Mobile, Horizontal on Desktop) */
                <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 p-3 md:p-6 lg:p-8">
                    {/* Local Participant */}
                    <div className="relative bg-slate-900 rounded-3xl overflow-hidden border border-white/5 shadow-inner flex items-center justify-center">
                        <div ref={localVideoRef} className="w-full h-full [&>video]:object-cover" />
                        {!isCameraEnabled && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                                <User className="w-20 h-20 mb-4 opacity-5" />
                                <span className="text-sm font-medium tracking-wide">الكاميرا متوقفة</span>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-2xl text-xs md:text-sm font-bold border border-white/10 flex items-center gap-2 shadow-xl">
                            أنت
                            {!isMicEnabled && <MicOff className="w-4 h-4 text-red-400" />}
                        </div>
                    </div>

                    {/* Remote Participant */}
                    {remoteUsers.length > 0 ? (
                        remoteUsers.filter(u => Number(u.uid) <= 10000).map(user => (
                            <div key={user.uid} className="relative bg-slate-900 rounded-3xl overflow-hidden border border-white/5 shadow-inner">
                                <RemotePlayer user={user} isCover />
                                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-lg px-4 py-2 rounded-2xl text-xs md:text-sm font-bold border border-white/10 flex items-center gap-2 shadow-xl">
                                    مشارك
                                    {!user.hasAudio && <MicOff className="w-4 h-4 text-red-400" />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="relative bg-slate-900/40 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-slate-600">
                            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                                <Loader2 className="w-8 h-8 animate-spin opacity-20" />
                            </div>
                            <p className="text-sm md:text-base font-medium tracking-wide">بانتظار انضمام الطرف الآخر...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function RemotePlayer({ user, isPrimary, isCover }: { user: IAgoraRTCRemoteUser, isPrimary?: boolean, isCover?: boolean }) {
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user.videoTrack && videoRef.current) user.videoTrack.play(videoRef.current);
        if (user.audioTrack) user.audioTrack.play();
    }, [user.videoTrack, user.audioTrack]);

    return (
        <div ref={videoRef} className={cn(
            "w-full h-full transition-opacity duration-500",
            isPrimary ? "[&>video]:object-contain" : isCover ? "[&>video]:object-cover" : "[&>video]:object-cover"
        )}>
            {!user.hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                    <User className="w-20 h-20 opacity-5" />
                </div>
            )}
        </div>
    );
}
