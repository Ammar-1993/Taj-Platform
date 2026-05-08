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

    // 1. Join and Create Tracks
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

    // Muting logic
    useEffect(() => {
        if (localVideoTrack) localVideoTrack.setEnabled(isCameraEnabled);
    }, [isCameraEnabled, localVideoTrack]);

    useEffect(() => {
        if (localAudioTrack) localAudioTrack.setEnabled(isMicEnabled);
    }, [isMicEnabled, localAudioTrack]);

    // Local Video Playback
    useEffect(() => {
        if (localVideoTrack && localVideoRef.current) localVideoTrack.play(localVideoRef.current);
    }, [localVideoTrack]);

    // Local Screen Share Playback
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

    // Determine Layout Mode
    // Screen share detection: either local is sharing or a remote user with UID > 10000 is sharing
    const remoteScreenUser = remoteUsers.find(u => Number(u.uid) > 10000);
    const isScreenSharingActive = isSharing || !!remoteScreenUser;

    return (
        <div className="w-full h-full relative bg-slate-950 overflow-hidden">
            {isScreenSharingActive ? (
                /* 🖥️ Screen Share Layout: Primary view for screen, thumbnails for cameras */
                <div className="w-full h-full flex flex-col relative">
                    {/* Primary Content (Screen) */}
                    <div className="flex-1 bg-black">
                        {isSharing && localScreenTrack ? (
                            <div ref={localScreenRef} className="w-full h-full [&>video]:object-contain" />
                        ) : remoteScreenUser ? (
                            <RemotePlayer user={remoteScreenUser} isPrimary />
                        ) : null}
                    </div>

                    {/* Participant Thumbnails Overlay */}
                    <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-10">
                        {/* Local Camera Thumbnail */}
                        <div className="w-24 h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-xl">
                            <div ref={localVideoRef} className="w-full h-full">
                                {!isCameraEnabled && <div className="absolute inset-0 flex items-center justify-center bg-slate-800"><User className="w-8 h-8 opacity-20" /></div>}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">أنت</div>
                        </div>

                        {/* Remote Participant Thumbnails (excluding screen share) */}
                        {remoteUsers.filter(u => Number(u.uid) <= 10000).map(user => (
                            <div key={user.uid} className="w-24 h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-xl relative">
                                <RemotePlayer user={user} />
                                <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-white">مشارك</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* 👥 1-on-1 Layout: Vertical split */
                <div className="w-full h-full grid grid-rows-2 gap-2 p-2 sm:p-4">
                    {/* Local Participant */}
                    <div className="relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                        <div ref={localVideoRef} className="w-full h-full [&>video]:object-cover" />
                        {!isCameraEnabled && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                <User className="w-16 h-16 mb-2 opacity-10" />
                                <span className="text-xs">الكاميرا متوقفة</span>
                            </div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2">
                            أنت
                            {!isMicEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                        </div>
                    </div>

                    {/* Remote Participant */}
                    {remoteUsers.length > 0 ? (
                        remoteUsers.filter(u => Number(u.uid) <= 10000).map(user => (
                            <div key={user.uid} className="relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                <RemotePlayer user={user} isCover />
                                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold border border-white/10 flex items-center gap-2">
                                    مشارك
                                    {!user.hasAudio && <MicOff className="w-3 h-3 text-red-400" />}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="relative bg-slate-800/50 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-10" />
                            <p className="text-sm font-medium">بانتظار انضمام الطرف الآخر...</p>
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
            "w-full h-full transition-all",
            isPrimary ? "[&>video]:object-contain" : isCover ? "[&>video]:object-cover" : "[&>video]:object-cover"
        )}>
            {!user.hasVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                    <User className="w-16 h-16 opacity-10" />
                </div>
            )}
        </div>
    );
}
