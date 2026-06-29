"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import AgoraRTC, { 
    AREAS,
    IAgoraRTCClient, 
    IAgoraRTCRemoteUser,
    ILocalVideoTrack,
    ILocalAudioTrack
} from 'agora-rtc-sdk-ng';
import { bookingService } from '@/services/api/bookingService';
import { NetworkBar } from './LobbyPreview';
import { Loader2, User, MicOff, WifiOff } from 'lucide-react';

type AgoraCallProps = {
  bookingId: number | string;
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
  /**
   * 3.4: Called when the Agora SDK fires token-privilege-will-expire.
   * The main token is renewed internally; this callback lets the parent
   * (page.tsx) renew any additional client tokens (e.g. the screen-share
   * client) using the fresh tokens it already has.
   */
  onTokenWillExpire?: (freshToken: string, freshScreenToken: string | null) => void;
};

const AgoraCall = React.memo(({ 
    bookingId,
    rtcProps, 
    isCameraEnabled, 
    isMicEnabled,
    isSharing,
    localScreenTrack,
    lobbyMediaStream,
    externalScreenRef,
    onScreenShareActive,
    onTokenWillExpire,
}: AgoraCallProps) => {
    // ── 3.5: Client instance ref ──────────────────────────────────────────────
    // ✅ VP9: ~20% better compression than VP8 at the same quality
    // We use a lazily-initialized ref rather than useState to ensure the
    // client survives any parent re-renders without risking a remount loop.
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    if (!clientRef.current) {
        // ── Phase 1.3: Geofencing ─────────────────────────────────────
        // Route media to the nearest Agora server edge.
        // EUROPE covers the nearest cluster for Arab-region users (Saudi Arabia,
        // UAE, Egypt). ASIA covers the Gulf subregion as secondary fallback.
        // This replaces the SDK default which routes to US East, adding ~80-120ms.
        // Valid values: AREAS.CHINA | AREAS.ASIA | AREAS.NORTH_AMERICA
        //             | AREAS.EUROPE | AREAS.JAPAN | AREAS.INDIA
        AgoraRTC.setArea({ areaCode: [AREAS.EUROPE, AREAS.ASIA] });
        clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp9" });
    }
    const client = clientRef.current;
    const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [isJoined, setIsJoined] = useState(false);
    const [networkQuality, setNetworkQuality] = useState(0);
    const [remoteNetworkStats, setRemoteNetworkStats] = useState<Record<string, number>>({});
    const [forceDisabledVideos, setForceDisabledVideos] = useState<Set<number | string>>(new Set());
    const [isReconnecting, setIsReconnecting] = useState(false);

    const localVideoRef = useRef<HTMLDivElement>(null);
    const localScreenRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(rtcProps);
    // ── Phase 1.2: Quality smoothing history ──────────────────────────
    // Stores the last 5 uplink quality readings (~5 seconds of history).
    // This prevents a single momentary spike in jitter/loss from instantly
    // triggering the "weak connection" banner. The warning only fires when
    // the *average* of the last 5 readings is degraded, matching how Zoom
    // behaves — it absorbs short bursts silently.
    const qualityHistoryRef = useRef<number[]>([]);
    propsRef.current = rtcProps;

    const lobbyStreamRef = useRef(lobbyMediaStream);
    lobbyStreamRef.current = lobbyMediaStream;

    // ── 3.1: createAndPublishVideoTrack ──────────────────────────────────────
    // Only called once on join. After that, toggling the camera ONLY calls
    // localVideoTrack.setEnabled(true/false) — never close+republish —
    // so we avoid 300–800 ms WebRTC renegotiation on every toggle.
    const createAndPublishVideoTrack = async () => {
        if (!client || !isJoined || client.connectionState !== "CONNECTED") return null;

        let vTrack: ILocalVideoTrack | null = null;
        try {
            const lobbyStream = lobbyStreamRef.current;
            if (lobbyStream) {
                const videoTrackObj = lobbyStream.getVideoTracks()[0];
                if (videoTrackObj) {
                    vTrack = await AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrackObj });
                }
            }

            if (!vTrack) {
                vTrack = await AgoraRTC.createCameraVideoTrack(
                    { encoderConfig: "360p_1", optimizationMode: "motion" },
                );
            }

            await client.publish([vTrack]);
            vTrack.setEnabled(true);
            setLocalVideoTrack(vTrack);
            return vTrack;
        } catch (err) {
            console.error("[AgoraCall] Failed to create/publish video track:", err);
            if (vTrack) vTrack.close();
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;
        let vTrack: ILocalVideoTrack | null = null;
        let aTrack: ILocalAudioTrack | null = null;
        let qualityInterval: NodeJS.Timeout;

        const init = async () => {
            try {
                // ── 3.4: Token renewal ────────────────────────────────────────────────
                // Renews BOTH the main channel token and, via the onTokenWillExpire
                // callback, the screen-share client token in page.tsx — so neither
                // a camera/mic stream nor an active screen share silently disconnects.
                client.on("token-privilege-will-expire", async () => {
                    console.log("[Agora] Token is about to expire, refreshing...");
                    try {
                        const res = await bookingService.refreshClassroomToken(Number(bookingId));
                        const freshToken       = res.data?.token ?? null;
                        const freshScreenToken = res.data?.screen_token ?? null;

                        if (freshToken) {
                            await client.renewToken(freshToken);
                            console.log("[Agora] Main token renewed successfully.");
                        }
                        // Notify page.tsx so it can renew the screen-share client.
                        // This keeps the renewal logic co-located with the screen client
                        // instance instead of using brittle global references.
                        onTokenWillExpire?.(freshToken ?? '', freshScreenToken);
                    } catch (err) {
                        console.error("[Agora] Failed to refresh token:", err);
                    }
                });

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
                            const existing = prev.find(u => u.uid === user.uid);
                            if (!existing) return prev;

                            // If the participant still has at least one active track,
                            // update the object reference so React re-renders their tile
                            // with the correct track state (e.g., video gone, audio remains).
                            if (user.hasVideo || user.hasAudio) {
                                return [...prev.filter(u => u.uid !== user.uid), user];
                            }

                            // Both tracks are gone — remove the participant tile entirely
                            // to avoid phantom/frozen tiles in the UI.
                            return prev.filter(u => u.uid !== user.uid);
                        });
                    }
                });

                client.on("user-left", (user) => {
                    if (isMounted) {
                        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                        setForceDisabledVideos(prev => {
                            const next = new Set(prev);
                            next.delete(user.uid);
                            return next;
                        });
                    }
                });

                client.on("network-quality", (stats) => {
                    if (isMounted) {
                        // ── 3.3: Use UPLINK quality for the local publisher tile ───────
                        // Downlink measures how well we receive data (relevant for students
                        // watching a remote stream). The local publisher’s network badge
                        // should reflect UPLINK — how well our own stream is being sent.
                        // We still use downlink for the bandwidth-degradation logic below,
                        // because that controls whether we subscribe to remote video.
                        const up   = stats.uplinkNetworkQuality;
                        const down = stats.downlinkNetworkQuality;

                        // ── Phase 1.2: Smoothing with a 5-reading moving average ──────
                        // Keep only the last 5 readings (sliding window).
                        const history = qualityHistoryRef.current;
                        qualityHistoryRef.current = [...history.slice(-4), up];
                        const smoothedQuality = Math.round(
                            qualityHistoryRef.current.reduce((a, b) => a + b, 0) /
                            qualityHistoryRef.current.length
                        );
                        setNetworkQuality(smoothedQuality);

                        // 🚫 Strict Bandwidth Profiles (Task 4): If quality is 5 (Very Bad) or 6 (Down)
                        // automatically stop receiving video to preserve audio.
                        setForceDisabledVideos(prev => {
                            const next = new Set(prev);
                            let changed = false;

                            client.remoteUsers.forEach(user => {
                                if (user.hasVideo) {
                                    if (down >= 5) {
                                        if (!next.has(user.uid)) {
                                            next.add(user.uid);
                                            changed = true;
                                        }
                                    } else {
                                        if (next.has(user.uid)) {
                                            next.delete(user.uid);
                                            changed = true;
                                        }
                                        
                                        // ── Phase 1.2: Activate Low Stream earlier (down >= 2) ──
                                        // Previously this was >= 3. By triggering simulcast
                                        // fallback one level earlier, we reduce the risk of
                                        // bufferbloat before quality visibly degrades.
                                        if (down >= 2) {
                                            client.setRemoteVideoStreamType(user.uid, 1); // 1: Low stream
                                        } else {
                                            client.setRemoteVideoStreamType(user.uid, 0); // 0: High stream
                                        }
                                    }
                                }
                            });

                            return changed ? next : prev;
                        });
                    }
                });

                // ── 4.2: Handle network disconnects ────────────────────────────────────
                client.on("connection-state-change", (curState, revState, reason) => {
                    console.log(`[Agora] Connection state changed: ${revState} -> ${curState} (${reason})`);
                    if (isMounted) {
                        if (curState === "RECONNECTING" || curState === "DISCONNECTED") {
                            // Only show reconnecting UI if we were previously joined.
                            // DISCONNECTED can mean a permanent drop or just before reconnect.
                            setIsReconnecting(true);
                        } else if (curState === "CONNECTED") {
                            setIsReconnecting(false);
                        }
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
                if (!isMounted) return;

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
                // Ignore OPERATION_ABORTED which happens in React Strict Mode 
                // when the component unmounts before join() finishes.
                const e = err as { message?: string; code?: string };
                if (
                    e?.message?.includes("OPERATION_ABORTED") || e?.code === "OPERATION_ABORTED" ||
                    e?.message?.includes("WS_ABORT")           || e?.code === "WS_ABORT"
                ) {
                    console.warn("[AgoraCall] Join aborted — component unmounted during WebSocket connection.");
                } else {
                    console.error("Agora Init Error:", err);
                }
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
            void client.leave().catch(() => {});
            client.removeAllListeners();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client]);

    // ── 3.1: Camera toggle — setEnabled() only, zero renegotiation ───────────
    // The track is published once on join and stays published permanently.
    // Toggling the camera just mutes/unmutes the video encoder — no
    // ICE restart, no WebRTC renegotiation, no 300-800 ms freeze.
    // createAndPublishVideoTrack() is only called if the track was never
    // created at all (e.g. the user denied camera in the lobby and then
    // grants it mid-session).
    useEffect(() => {
        if (!isJoined) return;

        if (localVideoTrack) {
            // Fast path: track already exists → just flip the encoder mute flag
            localVideoTrack.setEnabled(isCameraEnabled);
        } else if (isCameraEnabled) {
            // Slow path: track never created (lobby camera denial, then mid-session grant)
            void createAndPublishVideoTrack();
        }
        // When !isCameraEnabled and there is no track, nothing to do.
    }, [isCameraEnabled, localVideoTrack, isJoined]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (localAudioTrack) localAudioTrack.setEnabled(isMicEnabled);
    }, [isMicEnabled, localAudioTrack]);

    // ── Phase 2.1: Adaptive Encoder Configuration ───────────────────────────────
    // Dynamically adjusts the outgoing video encoder based on the smoothed
    // network quality score (updated every ~1s by the network-quality event).
    //
    // Quality scale (Agora):
    //   0 = Unknown  1 = Excellent  2 = Good  3 = Poor  4 = Bad  5 = Very Bad  6 = Down
    //
    // Encoder presets chosen to stay within upload budget at each quality level:
    //   quality 1-2 (Good)    : 720p_2  → ~1 Mbps  (full quality)
    //   quality 3   (Poor)    : 360p_7  → ~500 Kbps (slight downgrade, imperceptible)
    //   quality 4   (Bad)     : 240p_4  → ~200 Kbps (clear degradation, but video survives)
    //   quality 5+  (Very Bad): 120p_1  → ~80 Kbps  (survive on audio; Phase 2.2 will mute camera)
    //
    // This mirrors how Zoom adapts its encoder instead of letting the SDK
    // overflow the upload pipe and trigger packet-loss spikes.
    useEffect(() => {
        if (!localVideoTrack || !isJoined || !isCameraEnabled) return;

        const getEncoderConfig = (q: number) => {
            if (q <= 2) return "720p_2";   // Excellent / Good  → ~1 Mbps
            if (q === 3) return "360p_7";  // Poor              → ~500 Kbps
            if (q === 4) return "240p_4";  // Bad               → ~200 Kbps
            return "120p_1";               // Very Bad / Down   → ~80 Kbps
        };

        const config = getEncoderConfig(networkQuality);
        localVideoTrack.setEncoderConfiguration(config).catch((err) => {
            // Non-fatal: encoder config changes can fail if the track is being
            // renegotiated. The current config stays active until the next cycle.
            console.warn("[AgoraCall] Adaptive encoder update failed:", err);
        });
    }, [networkQuality, localVideoTrack, isJoined]);

    // ── Phase 2.2: Audio-First Strategy ────────────────────────────────────────
    // When network quality hits 5+ (Very Bad), mute the local camera track to
    // free the ~750 Kbps upload budget for audio (which only needs ~50 Kbps).
    // When quality recovers to ≤2 (Good), restore the camera if the user had it on.
    //
    // Critically: this uses setEnabled() (not close/republish), so the ICE
    // connection is preserved and the camera resumes in <200ms when quality improves.
    //
    // A ref tracks whether WE disabled the camera (vs. the user choosing to turn
    // it off themselves), so we never auto-restore a camera the user deliberately
    // disabled.
    const autoDisabledCameraRef = useRef(false);

    useEffect(() => {
        if (!localVideoTrack || !isJoined) return;

        if (networkQuality >= 5 && isCameraEnabled && !autoDisabledCameraRef.current) {
            // Auto-mute: quality is Very Bad and the user’s camera is currently on
            autoDisabledCameraRef.current = true;
            localVideoTrack.setEnabled(false);
            console.info("[AgoraCall] Audio-First: camera muted automatically (quality=", networkQuality, ")");
        } else if (networkQuality <= 2 && autoDisabledCameraRef.current) {
            // Auto-restore: quality has recovered to Good or better
            autoDisabledCameraRef.current = false;
            localVideoTrack.setEnabled(true);
            console.info("[AgoraCall] Audio-First: camera restored (quality=", networkQuality, ")");
        }
    }, [networkQuality, localVideoTrack, isJoined, isCameraEnabled]);


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
            {/* ── 4.2: Reconnecting Overlay ── */}
            {isReconnecting && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-white font-bold text-lg">انقطع الاتصال بالإنترنت</p>
                    <p className="text-slate-300 text-sm mt-1">جاري محاولة إعادة الاتصال تلقائياً...</p>
                </div>
            )}

            {/* ── Phase 3.2: Network quality indicator (non-intrusive) ──────────────
             * Replaces the red bounce banner from Phase 1.1 with a compact
             * NetworkBar widget. It appears only when quality >= 4 (Bad+),
             * positioned top-left where it doesn’t block main content.
             * At quality >= 5 a "weak" label is shown alongside the bars
             * so the user understands the degradation without feeling alarmed. ── */}
            {networkQuality >= 4 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-md bg-slate-900/80 px-3 py-2 rounded-full border border-white/10 shadow-lg flex items-center gap-2">
                    <NetworkBar
                        quality={networkQuality >= 5 ? "weak" : "fair"}
                    />
                    {networkQuality >= 5 && (
                        <span className="text-[11px] text-red-300 font-semibold flex items-center gap-1">
                            <WifiOff className="w-3 h-3" />
                            قد يتأثر الصوت
                        </span>
                    )}
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
                            <RemotePlayer 
                                user={remoteScreenUser} 
                                isPrimary 
                                isForceDisabled={forceDisabledVideos.has(remoteScreenUser.uid)}
                            />
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
                                <RemotePlayer 
                                    user={user} 
                                    networkQuality={remoteNetworkStats[user.uid] || 0} 
                                    isForceDisabled={forceDisabledVideos.has(user.uid)}
                                />
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
                                <RemotePlayer 
                                    user={visibleRemoteUsers[0]} 
                                    networkQuality={remoteNetworkStats[visibleRemoteUsers[0].uid] || 0} 
                                    isForceDisabled={forceDisabledVideos.has(visibleRemoteUsers[0].uid)}
                                />
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

AgoraCall.displayName = 'AgoraCall';

export default AgoraCall;

function RemotePlayer({ user, isPrimary, networkQuality = 0, isForceDisabled = false }: { user: IAgoraRTCRemoteUser, isPrimary?: boolean, networkQuality?: number, isForceDisabled?: boolean }) {
    const videoRef = useRef<HTMLDivElement>(null);

    // ── 3.2: RemotePlayer play guard ──────────────────────────────────────────
    // `audioTrack.play()` called on an already-playing track opens a second
    // Web Audio output node, doubling the volume and causing an echo.
    // Guard both video and audio so re-renders never call play() redundantly.
    useEffect(() => {
        if (user.videoTrack && videoRef.current && !isForceDisabled) {
            if (!user.videoTrack.isPlaying) {
                const fitMode = isPrimary ? 'contain' : 'cover';
                user.videoTrack.play(videoRef.current, { fit: fitMode });
            }
        } else if (isForceDisabled && user.videoTrack?.isPlaying) {
            user.videoTrack.stop();
        }
        // Only call play() if the audio track exists but is not yet playing.
        if (user.audioTrack && !user.audioTrack.isPlaying) {
            user.audioTrack.play();
        }
    }, [user.videoTrack, user.audioTrack, isPrimary, isForceDisabled]);

    return (
        <div ref={videoRef} className="w-full h-full relative transition-opacity duration-500">
            {!isPrimary && <StatusOverlay isMuted={!user.hasAudio} networkQuality={networkQuality} />}
            {(!user.hasVideo || isForceDisabled) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-4 text-center">
                    <User className="w-16 h-16 opacity-10 mb-4" />
                    {isForceDisabled && (
                        <div className="animate-pulse">
                            <p className="text-xs font-bold text-amber-500">اتصال ضعيف جداً</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto">تم إيقاف استقبال الفيديو مؤقتاً للحفاظ على استقرار الصوت</p>
                        </div>
                    )}
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
