"use client";

import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC, { 
    IAgoraRTCClient, 
    ICameraVideoTrack, 
    IMicrophoneAudioTrack, 
    IAgoraRTCRemoteUser 
} from 'agora-rtc-sdk-ng';
import { Loader2, User, MicOff } from 'lucide-react';

type AgoraCallProps = {
  rtcProps: {
    appId: string;
    channel: string;
    token: string | null;
    uid: number;
    role: 'host' | 'audience';
  };
  callbacks?: {
    EndCall: () => void;
  };
  isCameraEnabled: boolean;
  isMicEnabled: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
};

export default function AgoraCall({ 
    rtcProps, 
    isCameraEnabled, 
    isMicEnabled 
}: AgoraCallProps) {
    const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);

    const localVideoRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(rtcProps);
    propsRef.current = rtcProps;

    // 1. Join and Create Tracks
    useEffect(() => {
        let isMounted = true;
        let videoTrackRef: ICameraVideoTrack | null = null;
        let audioTrackRef: IMicrophoneAudioTrack | null = null;

        const init = async () => {
            try {
                // Subscribe to events
                client.on("user-published", async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if (isMounted) {
                        // Force a fresh copy to trigger re-render if user already exists
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

                // Join
                const { appId, channel, token, uid } = propsRef.current;
                await client.join(appId, channel, token, uid);
                
                // Create Tracks
                try {
                    const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                    
                    if (isMounted) {
                        audioTrackRef = audioTrack;
                        videoTrackRef = videoTrack;
                        setLocalAudioTrack(audioTrack);
                        setLocalVideoTrack(videoTrack);
                        
                        await client.publish([audioTrack, videoTrack]);
                        
                        // Set initial enabled state
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
            if (videoTrackRef) videoTrackRef.close();
            if (audioTrackRef) audioTrackRef.close();
            client.leave();
            client.removeAllListeners();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client]); // client is stable

    // 2. Handle Muting (Sync with props)
    useEffect(() => {
        if (localVideoTrack) {
            localVideoTrack.setEnabled(isCameraEnabled);
        }
    }, [isCameraEnabled, localVideoTrack]);

    useEffect(() => {
        if (localAudioTrack) {
            localAudioTrack.setEnabled(isMicEnabled);
        }
    }, [isMicEnabled, localAudioTrack]);

    // 3. Play Local Video
    useEffect(() => {
        if (localVideoTrack && localVideoRef.current) {
            localVideoTrack.play(localVideoRef.current);
        }
    }, [localVideoTrack]);

    if (!isJoined) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="animate-pulse">جاري تهيئة الاتصال...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-slate-950">
            {/* Local Video Panel */}
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 aspect-video md:aspect-auto">
                <div ref={localVideoRef} className="w-full h-full">
                    {!isCameraEnabled && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                            <User className="w-20 h-20 mb-2 opacity-20" />
                            <p className="text-sm font-medium">الكاميرا متوقفة</p>
                        </div>
                    )}
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                    أنت (أنا)
                    {!isMicEnabled && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
            </div>

            {/* Remote Video Panels */}
            {remoteUsers.length > 0 ? (
                remoteUsers.map(user => (
                    <RemotePlayer key={user.uid} user={user} />
                ))
            ) : (
                <div className="relative bg-slate-900/50 rounded-2xl overflow-hidden border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 aspect-video md:aspect-auto">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-20" />
                    <p className="text-sm">بانتظار انضمام الطرف الآخر...</p>
                </div>
            )}
        </div>
    );
}

function RemotePlayer({ user }: { user: IAgoraRTCRemoteUser }) {
    const videoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user.videoTrack && videoRef.current) {
            user.videoTrack.play(videoRef.current);
        }
        if (user.audioTrack) {
            user.audioTrack.play();
        }
    }, [user.videoTrack, user.audioTrack]);

    return (
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 aspect-video md:aspect-auto">
            <div ref={videoRef} className="w-full h-full">
                {!user.hasVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-slate-500">
                        <User className="w-20 h-20 mb-2 opacity-20" />
                        <p className="text-sm font-medium">المستخدم الآخر لا يشارك الفيديو</p>
                    </div>
                )}
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                مشارك #{user.uid}
                {!user.hasAudio && <MicOff className="w-3 h-3 text-red-400" />}
            </div>
        </div>
    );
}
