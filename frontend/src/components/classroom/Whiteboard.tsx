"use client";

import "@/lib/react19-legacy-compat";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames, RoomPhase } from "white-web-sdk";
import {
    Loader2, Pencil, Eraser, Square, Circle, Type,
    MousePointer2, Trash2, Undo2, Redo2, ChevronLeft, ChevronRight, Plus,
    WifiOff, RefreshCw, Eye, ChevronDown, Maximize, Minimize,
} from 'lucide-react';
import { bookingService } from '@/services/api';
import { useAgoraRTM, RTMMessage } from '@/hooks/useAgoraRTM';
import * as Sentry from "@sentry/nextjs";

// ─── Local types ─────────────────────────────────────────────────────────────

// Note: 'gb-lon' (London) region has been deprecated by Agora/Netless. 
// Any requests for 'gb-lon' will correctly fallback to 'eu' (Frankfurt) in the validation logic.
type WhiteboardRegion = "cn-hz" | "us-sv" | "sg" | "in-mum" | "eu";

interface SceneState {
    index: number;
    scenes: unknown[];
}

interface WhiteboardRoomState {
    sceneState?: SceneState;
    globalState?: Record<string, unknown>;
}

interface WhiteboardProps {
    appIdentifier: string;
    roomUuid: string;
    roomToken: string;
    uid: string;
    isTeacher: boolean;
    bookingId: string;
    region?: string;
    agoraChannel?: string;
    rtmToken?: string | null;
    isAbsoluteFocusMode?: boolean;
    onToggleFocusMode?: (targetState?: boolean) => void;
    onRemoteFocusModeToggle?: (focus: boolean) => void;
    onInteract?: () => void;
    showWhiteboard?: boolean;
    onRemoteToggle?: (show: boolean) => void;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    label: string;
    variant?: 'primary' | 'danger';
    disabled?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STROKE_COLORS = [
    { hex: '#000000', label: 'أسود' },
    { hex: '#2563EB', label: 'أزرق' },
    { hex: '#DC2626', label: 'أحمر' },
    { hex: '#16A34A', label: 'أخضر' },
    { hex: '#D97706', label: 'برتقالي' },
    { hex: '#7C3AED', label: 'بنفسجي' },
    { hex: '#DB2777', label: 'وردي' },
    { hex: '#FFFFFF', label: 'أبيض' },
];

const STROKE_WIDTHS = [2, 4, 8, 14];
const JOIN_ROOM_TIMEOUT_MS = 30000;

const TOOL_HOTKEYS: Record<string, string> = {
    p: 'pencil',
    e: 'eraser',
    s: 'selector',
    r: 'rectangle',
    c: 'ellipse',
    t: 'text',
};

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [0, 0, 0];
}

/**
 * Detect if the current device is a touch-primary device (tablet / phone).
 * We use this to pick the correct Netless DeviceType so that:
 *  - Desktop → pointer events, standard cursor UX
 *  - Touch   → touch events, pressure-sensitive drawing, pinch-zoom
 */
function detectDeviceType(): DeviceType {
    if (typeof window === 'undefined') return DeviceType.Desktop;
    return ('ontouchstart' in window || navigator.maxTouchPoints > 0)
        ? DeviceType.Touch
        : DeviceType.Desktop;
}

interface LockableScreenOrientation {
    lock?: (orientation: string) => Promise<void>;
    unlock?: () => void;
}

interface CustomScreen {
    orientation?: LockableScreenOrientation;
}

async function lockLandscapeOrientation(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        if (window.innerWidth < 768 && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            const screenObj = window.screen as unknown as CustomScreen;
            if (screenObj?.orientation && typeof screenObj.orientation.lock === 'function') {
                await screenObj.orientation.lock('landscape').catch(() => {});
            }
        }
    } catch {
        // Fullscreen or orientation lock may fail due to browser security restrictions
    }
}

async function unlockScreenOrientation(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
        if (document.fullscreenElement) {
            const screenObj = window.screen as unknown as CustomScreen;
            if (screenObj?.orientation && typeof screenObj.orientation.unlock === 'function') {
                screenObj.orientation.unlock();
            }
            await document.exitFullscreen().catch(() => {});
        }
    } catch {
        // Exit fullscreen may fail if not active or permitted
    }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Whiteboard: React.FC<WhiteboardProps> = React.memo(({
    appIdentifier,
    roomUuid,
    roomToken,
    uid,
    isTeacher,
    bookingId,
    region = 'sg',
    agoraChannel,
    rtmToken,
    isAbsoluteFocusMode,
    onToggleFocusMode,
    onRemoteFocusModeToggle,
    onInteract,
    showWhiteboard,
    onRemoteToggle
}) => {
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const roomRef       = useRef<Room | null>(null);
    const sdkRef        = useRef<WhiteWebSdk | null>(null);

    // Keep init props current for SDK and reconnects
    const initProps = useRef({
        appIdentifier,
        roomUuid,
        roomToken,
        uid,
        isTeacher,
        region,
        bookingId,
        showWhiteboard,
        isAbsoluteFocusMode,
        onRemoteToggle,
        onRemoteFocusModeToggle,
    });
    initProps.current = {
        appIdentifier,
        roomUuid,
        roomToken,
        uid,
        isTeacher,
        region,
        bookingId,
        showWhiteboard,
        isAbsoluteFocusMode,
        onRemoteToggle,
        onRemoteFocusModeToggle,
    };

    // ── UI State ──────────────────────────────────────────────────────────────
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState<string | null>(null);
    const [retryTrigger, setRetryTrigger]     = useState(0);

    const handleRetryJoin = useCallback(() => {
        setError(null);
        setLoading(true);
        setRetryTrigger(prev => prev + 1);
    }, []);
    const [activeTool, setActiveTool]         = useState('pencil');
    const [strokeColor, setStrokeColor]       = useState('#000000');
    const [strokeWidth, setStrokeWidth]       = useState(4);
    const [pageState, setPageState]           = useState({ current: 0, total: 1 });
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [pageFlash, setPageFlash]           = useState(false);     // 2.5: animate page change for students
    const [undoSteps, setUndoSteps]           = useState(0);
    const [redoSteps, setRedoSteps]           = useState(0);

    // ── 2.2f / 2.3: Connection phase state ───────────────────────────────────
    const [phase, setPhase]           = useState<RoomPhase>(RoomPhase.Connecting);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const reconnectTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRefreshingTokenRef        = useRef(false);

    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── 2.4: Detect touch device once on mount ───────────────────────────────
    const [deviceTypeState, setDeviceTypeState] = useState<DeviceType>(DeviceType.Desktop);

    // ── RTM Cursor State ─────────────────────────────────────────────────────
    const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number, y: number }>>({});
    const lastCursorRef = useRef<number>(0);

    const handleMessageReceived = useCallback((senderUid: string, msg: RTMMessage) => {
        if (msg.type === "cursor") {
            setRemoteCursors(prev => ({
                ...prev,
                [senderUid]: { x: msg.x, y: msg.y }
            }));
        } else if (msg.type === "whiteboard_toggle" && !isTeacher) {
            if (onRemoteToggle) {
                onRemoteToggle(msg.show);
            }
            if (roomRef.current && msg.show) {
                try {
                    roomRef.current.refreshViewSize();
                    roomRef.current.setViewMode(ViewMode.Follower);
                    roomRef.current.disableDeviceInputs = true;
                } catch (e) {
                    console.error("[Whiteboard] Error setting follower mode on RTM toggle:", e);
                }
            }
        } else if (msg.type === "focus_mode_toggle" && !isTeacher) {
            if (onRemoteFocusModeToggle) {
                onRemoteFocusModeToggle(msg.focus);
            }
            if (msg.focus && onRemoteToggle) {
                onRemoteToggle(true);
            }
            if (msg.focus) {
                void lockLandscapeOrientation();
                if (roomRef.current) {
                    try {
                        roomRef.current.refreshViewSize();
                        roomRef.current.setViewMode(ViewMode.Follower);
                        roomRef.current.disableDeviceInputs = true;
                    } catch (e) {
                        console.error("[Whiteboard] Error setting follower mode on focus mode toggle:", e);
                    }
                }
            } else {
                void unlockScreenOrientation();
            }
        }
    }, [isTeacher, onRemoteToggle, onRemoteFocusModeToggle]);

    const handleMemberLeft = useCallback((senderUid: string) => {
        setRemoteCursors(prev => {
            const next = { ...prev };
            delete next[senderUid];
            return next;
        });
    }, []);

    const agoraAppId = (process.env.NEXT_PUBLIC_AGORA_APP_ID || "").trim();

    const { sendCursorPosition, sendCustomMessage } = useAgoraRTM({
        appId: agoraAppId, // Use Agora RTC App ID for RTM too
        channel: agoraChannel || "",
        uid,
        token: rtmToken || null,
        onMessageReceived: handleMessageReceived,
        onMemberLeft: handleMemberLeft,
        enabled: !!agoraChannel && !!rtmToken
    });

    const lastLocalShowRef = useRef(showWhiteboard);
    useEffect(() => {
        if (showWhiteboard === undefined) return;

        // When whiteboard is visible, ensure canvas dimensions are updated and student follows teacher
        if (showWhiteboard && roomRef.current) {
            try {
                roomRef.current.refreshViewSize();
            } catch (e) {
                console.error("[Whiteboard] Error refreshing view size:", e);
            }

            if (!isTeacher) {
                try {
                    roomRef.current.setViewMode(ViewMode.Follower);
                    roomRef.current.disableDeviceInputs = true;
                } catch (e) {
                    console.error("[Whiteboard] Error setting Follower view mode:", e);
                }
            }
        }

        // If teacher changed the toggle, synchronize via Netless GlobalState & Agora RTM
        if (isTeacher && showWhiteboard !== lastLocalShowRef.current) {
            lastLocalShowRef.current = showWhiteboard;

            // 1. Sync through Netless room globalState (persistent WebSocket room state)
            if (roomRef.current && roomRef.current.isWritable) {
                try {
                    roomRef.current.setGlobalState({ isWhiteboardOpen: showWhiteboard });
                } catch (e) {
                    console.error("[Whiteboard] Failed to sync globalState:", e);
                }
            }

            // 2. Broadcast through Agora RTM (real-time channel broadcast)
            sendCustomMessage({ type: 'whiteboard_toggle', show: showWhiteboard });
        }
    }, [showWhiteboard, isTeacher, sendCustomMessage]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!whiteboardRef.current) return;

        // Throttle cursor broadcasts to max 10/sec to avoid microtask queue starvation
        const now = Date.now();
        if (now - lastCursorRef.current < 100) return;
        lastCursorRef.current = now;

        const rect = whiteboardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        sendCursorPosition({ x, y });
    }, [sendCursorPosition]);



    const clearCanvas = useCallback(() => {
        if (!roomRef.current || !isTeacher) return;
        roomRef.current.cleanCurrentScene();
    }, [isTeacher]);

    // ── Token refresh + reconnect helper (2.2f) ───────────────────────────────
    const reconnectWithFreshToken = useCallback(async () => {
        if (isRefreshingTokenRef.current) return;
        isRefreshingTokenRef.current = true;
        setIsReconnecting(true);

        try {
            const { bookingId: bId, roomUuid: rUuid, isTeacher: rIsTeacher, uid: rUid } = initProps.current;

            // Ask the backend for a brand-new token (bypasses cache)
            const res = await bookingService.refreshWhiteboardToken(Number(bId));
            const freshToken = res.room_token;
            initProps.current.roomToken = freshToken;

            Sentry.addBreadcrumb({
                category: "whiteboard",
                message:  "whiteboard_token_refreshed",
                level:    "info",
                data:     {
                    booking_id: initProps.current.bookingId,
                    room_uuid:  initProps.current.roomUuid,
                    is_teacher: initProps.current.isTeacher,
                },
            });

            // Disconnect the stale room instance first
            if (roomRef.current) {
                try {
                    // Unbind the HTML element to prevent lingering pointer events causing frameGenerator exceptions
                    roomRef.current.bindHtmlElement(null);
                    await roomRef.current.disconnect(); 
                } catch { /* already disconnected */ }
                roomRef.current = null;
            }

            // Rejoin with the new token
            if (sdkRef.current && whiteboardRef.current) {
                const cleanRoomUuid  = String(rUuid).split('#')[0].trim();
                const cleanFreshToken = String(freshToken).split('#')[0].trim();

                let rejoinTimeoutId: NodeJS.Timeout;
                const rejoinTimeoutPromise = new Promise<never>((_, reject) => {
                    rejoinTimeoutId = setTimeout(() => {
                        reject(new Error('استغرق تجديد الاتصال بالسبورة وقتاً أطول من المتوقع.'));
                    }, JOIN_ROOM_TIMEOUT_MS);
                });

                const joinPromise = sdkRef.current.joinRoom({
                    uuid:                           cleanRoomUuid,
                    roomToken:                      cleanFreshToken,
                    uid:                            rUid,
                    isWritable:                     rIsTeacher,
                    useMultiViews:                  false,
                    floatBar:                       false,
                    disableMagixEventDispatchLimit: true,
                    disableEraseImage:              true,
                    // تعطيل تحديد تردد رسم القلم لضمان الاستجابة الفورية
                    disablePencilWrittingLimitFrequency: true,
                    // تفعيل القلم الجديد (بالنعومة والتدرج) مع إلغاء التخزين المؤقت
                    disableNewPencil: true,
                });

                const roomInstance = await Promise.race([joinPromise, rejoinTimeoutPromise]).finally(() => {
                    clearTimeout(rejoinTimeoutId);
                });

                roomRef.current = roomInstance;
                roomInstance.bindHtmlElement(whiteboardRef.current);
                roomInstance.disableDeviceInputs = !rIsTeacher;

                if (!rIsTeacher) {
                    roomInstance.setViewMode(ViewMode.Follower);
                    const currentGlobalState = roomInstance.state.globalState as Record<string, unknown> | undefined;
                    if (currentGlobalState) {
                        const {
                            onRemoteToggle: cbOnRemoteToggle,
                            onRemoteFocusModeToggle: cbOnRemoteFocusModeToggle,
                            showWhiteboard: cbShowWhiteboard,
                            isAbsoluteFocusMode: cbIsAbsoluteFocusMode,
                        } = initProps.current;

                        if (typeof currentGlobalState.isWhiteboardOpen === 'boolean') {
                            if (cbOnRemoteToggle && currentGlobalState.isWhiteboardOpen !== cbShowWhiteboard) {
                                cbOnRemoteToggle(currentGlobalState.isWhiteboardOpen);
                            }
                        }
                        if (typeof currentGlobalState.isAbsoluteFocusMode === 'boolean') {
                            if (cbOnRemoteFocusModeToggle && currentGlobalState.isAbsoluteFocusMode !== cbIsAbsoluteFocusMode) {
                                cbOnRemoteFocusModeToggle(currentGlobalState.isAbsoluteFocusMode);
                            }
                            if (currentGlobalState.isAbsoluteFocusMode && cbOnRemoteToggle) {
                                cbOnRemoteToggle(true);
                            }
                        }
                    }
                } else {
                    // Re-apply tool state after reconnect so the teacher's
                    // active tool/color/width are restored automatically.
                    roomInstance.setMemberState({
                        currentApplianceName: ApplianceNames.pencil,
                        strokeColor: hexToRgb('#000000'),
                        strokeWidth: 4,
                    });
                    
                    roomInstance.disableSerialization = false;
                    roomInstance.callbacks.on('onCanUndoStepsUpdate', (steps: number) => setUndoSteps(steps));
                    roomInstance.callbacks.on('onCanRedoStepsUpdate', (steps: number) => setRedoSteps(steps));

                    const {
                        showWhiteboard: currentShowWhiteboard,
                        isAbsoluteFocusMode: currentIsAbsoluteFocusMode,
                    } = initProps.current;

                    if (currentShowWhiteboard !== undefined || currentIsAbsoluteFocusMode !== undefined) {
                        try {
                            roomInstance.setGlobalState({
                                isWhiteboardOpen: (currentIsAbsoluteFocusMode ? true : currentShowWhiteboard) ?? false,
                                isAbsoluteFocusMode: currentIsAbsoluteFocusMode ?? false,
                            });
                        } catch (e) {
                            console.error("[Whiteboard] Error syncing globalState on reconnect:", e);
                        }
                    }
                }

                // Re-register state listener
                roomInstance.callbacks.on('onRoomStateChanged', (state: WhiteboardRoomState) => {
                    if (!rIsTeacher && state.globalState) {
                        const globalState = state.globalState as Record<string, unknown>;
                        const {
                            onRemoteToggle: cbOnRemoteToggle,
                            onRemoteFocusModeToggle: cbOnRemoteFocusModeToggle,
                        } = initProps.current;

                        if (typeof globalState.isWhiteboardOpen === 'boolean') {
                            const isOpen = globalState.isWhiteboardOpen;
                            if (cbOnRemoteToggle) {
                                cbOnRemoteToggle(isOpen);
                            }
                            if (isOpen && roomRef.current) {
                                try {
                                    roomRef.current.refreshViewSize();
                                    roomRef.current.setViewMode(ViewMode.Follower);
                                    roomRef.current.disableDeviceInputs = true;
                                } catch (e) {
                                    console.error("[Whiteboard] Error updating follower mode on roomStateChanged:", e);
                                }
                            }
                        }

                        if (typeof globalState.isAbsoluteFocusMode === 'boolean') {
                            const isFocus = globalState.isAbsoluteFocusMode;
                            if (cbOnRemoteFocusModeToggle) {
                                cbOnRemoteFocusModeToggle(isFocus);
                            }
                            if (isFocus) {
                                if (cbOnRemoteToggle) cbOnRemoteToggle(true);
                                void lockLandscapeOrientation();
                                if (roomRef.current) {
                                    try {
                                        roomRef.current.refreshViewSize();
                                        roomRef.current.setViewMode(ViewMode.Follower);
                                        roomRef.current.disableDeviceInputs = true;
                                    } catch {}
                                }
                            } else {
                                void unlockScreenOrientation();
                            }
                        }
                    }

                    if (state.sceneState) {
                        setPageState(prev => {
                            const next = { current: state.sceneState!.index, total: state.sceneState!.scenes.length };
                            if (!rIsTeacher && prev.current !== next.current) {
                                setPageFlash(true);
                                setTimeout(() => setPageFlash(false), 800);
                            }
                            return next;
                        });
                    }
                });

                // Re-register phase listener
                roomInstance.callbacks.on('onPhaseChanged', (newPhase: RoomPhase) => {
                    setPhase(newPhase);
                    if (
                        newPhase === RoomPhase.Disconnected ||
                        newPhase === RoomPhase.Reconnecting
                    ) {
                        Sentry.addBreadcrumb({
                            category: "whiteboard",
                            message:  "whiteboard_disconnected",
                            level:    "warning",
                            data:     {
                                phase:      newPhase,
                                booking_id: initProps.current.bookingId,
                                room_uuid:  initProps.current.roomUuid,
                            },
                        });
                    } else if (newPhase === RoomPhase.Connected) {
                        Sentry.addBreadcrumb({
                            category: "whiteboard",
                            message:  "whiteboard_reconnected",
                            level:    "info",
                            data:     {
                                booking_id: initProps.current.bookingId,
                                room_uuid:  initProps.current.roomUuid,
                            },
                        });
                    }
                });

                const sceneState = roomInstance.state.sceneState;
                setPageState({ current: sceneState.index, total: sceneState.scenes.length });
                setPhase(roomInstance.phase);
                setError(null);
            }
        } catch (err) {
            Sentry.captureException(err, {
                tags:  { component: "Whiteboard", action: "reconnect_failed" },
                extra: {
                    booking_id: initProps.current.bookingId,
                    room_uuid:  initProps.current.roomUuid,
                },
            });
            console.error('[Whiteboard] Reconnect failed:', err);
            setError('انقطع الاتصال بالسبورة. حاولنا إعادة الاتصال لكن فشل الأمر. يُرجى إعادة تحميل الصفحة.');
        } finally {
            isRefreshingTokenRef.current = false;
            setIsReconnecting(false);
        }
    }, []);

    // ── Main join effect ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!whiteboardRef.current) return;

        // 2.4: Detect device type before initialising the SDK
        const detected = detectDeviceType();
        setDeviceTypeState(detected);

        const {
            appIdentifier: appId, roomUuid: rUuid, roomToken: rToken,
            uid: rUid, isTeacher: rIsTeacher, region: rRegion,
        } = initProps.current;

        const cleanAppId      = String(appId).split('#')[0].trim();
        const cleanRoomUuid   = String(rUuid).split('#')[0].trim();
        const cleanRoomToken  = String(rToken).split('#')[0].trim();
        const supportedRegions = ['sg', 'us-sv', 'eu', 'cn-hz', 'in-mum'];
        const safeRegion      = (rRegion || 'sg').toLowerCase();
        const finalRegion     = supportedRegions.includes(safeRegion) ? safeRegion : 'sg';

        if (!cleanAppId || !cleanRoomUuid || !cleanRoomToken) {
            setError('بيانات الغرفة غير مكتملة.');
            setLoading(false);
            return;
        }

        let sdk: WhiteWebSdk | null = null;
        try {
            sdk = new WhiteWebSdk({
                appIdentifier: cleanAppId,
                deviceType:    detected,       // 2.4: correct device type
                region:        finalRegion as WhiteboardRegion,
            });
            sdkRef.current = sdk;
        } catch (e: unknown) {
            setError(`فشل تهيئة SDK السبورة: ${e instanceof Error ? e.message : 'خطأ غير معروف'}`);
            setLoading(false);
            return;
        }

        let unmounted = false;
        let attempt = 0;

        const joinRoom = async () => {
            try {
                if (!sdk || !whiteboardRef.current || unmounted) return;

                let joinTimeoutId: NodeJS.Timeout;
                const joinTimeoutPromise = new Promise<never>((_, reject) => {
                    joinTimeoutId = setTimeout(() => {
                        reject(new Error('استغرق الاتصال بالسبورة وقتاً أطول من المتوقع، يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.'));
                    }, JOIN_ROOM_TIMEOUT_MS);
                });

                const joinPromise = sdk.joinRoom({
                    uuid:          cleanRoomUuid,
                    roomToken:     cleanRoomToken,
                    uid:           rUid,
                    isWritable:    rIsTeacher,
                    useMultiViews: false,

                    // ── Fix 1: إيقاف شريط الأدوات العائم ────────────────────
                    // floatBar يعترض أحداث pointerup بين الضربات ويؤخر
                    // ظهور الضربة الأولى حتى تبدأ ضربة منفصلة جديدة.
                    floatBar: false,

                    // ── Fix 2: إيقاف تحديد تردد أحداث Magix ─────────────────
                    // بدون هذا يجمّع SDK الأحداث بحد أقصى 60/ثانية
                    // مما يضيف 16-50ms تأخير لكل ضربة.
                    disableMagixEventDispatchLimit: true,

                    // ── Fix 3: إيقاف تحديد تردد رسم القلم (الإصلاح الجوهري) ─
                    // هذه الخاصية موجودة في نسخة 2.16.54 وتمنع SDK من
                    // تخزين نقاط القلم مؤقتاً وإرسالها دفعةً واحدة.
                    // بتعطيلها يُرسم كل جزء من الكلمة فوراً على canvas.
                    disablePencilWrittingLimitFrequency: true,

                    // ── Fix 4: تفعيل القلم الجديد (مع ضمان عدم التأخير) ──────
                    // disableNewPencil: false يفعّل القلم الحديث الذي يدعم
                    // الرسم الفوري. القيمة الافتراضية true تستخدم القلم
                    // القديم الذي يُجمّع الضربات قبل رسمها.
                    disableNewPencil: true,

                    // ── Fix 5: إيقاف مراقبة الصور عند المسح ─────────────────
                    // يمنع SDK من اعتراض كل pointer event للبحث عن صور،
                    // مما يقلل التأخير قبل بدء كل ضربة خاصة على اللمس.
                    disableEraseImage: true,
                });

                const roomInstance = await Promise.race([joinPromise, joinTimeoutPromise]).finally(() => {
                    clearTimeout(joinTimeoutId);
                });

                if (unmounted) {
                    try { roomInstance.bindHtmlElement(null); } catch {}
                    roomInstance.disconnect().catch(() => {});
                    return;
                }

                roomRef.current = roomInstance;
                roomInstance.bindHtmlElement(whiteboardRef.current);
                roomInstance.disableDeviceInputs = !rIsTeacher;

                if (rIsTeacher) {
                    roomInstance.setMemberState({
                        currentApplianceName: ApplianceNames.pencil,
                        strokeColor: hexToRgb('#000000'),
                        strokeWidth: 4,
                    });
                    
                    // Fix: Enable serialization ONLY for teachers. Doing this for students crashes the SDK!
                    roomInstance.disableSerialization = false;
                    roomInstance.callbacks.on('onCanUndoStepsUpdate', (steps: number) => setUndoSteps(steps));
                    roomInstance.callbacks.on('onCanRedoStepsUpdate', (steps: number) => setRedoSteps(steps));

                    if (showWhiteboard !== undefined || isAbsoluteFocusMode !== undefined) {
                        try {
                            roomInstance.setGlobalState({
                                isWhiteboardOpen: (isAbsoluteFocusMode ? true : showWhiteboard) ?? false,
                                isAbsoluteFocusMode: isAbsoluteFocusMode ?? false,
                            });
                        } catch (e) {
                            console.error("[Whiteboard] Error syncing initial globalState:", e);
                        }
                    }
                } else {
                    // 2.3: Students always follow the teacher's viewport
                    roomInstance.setViewMode(ViewMode.Follower);
                    const currentGlobalState = roomInstance.state.globalState as Record<string, unknown> | undefined;
                    if (currentGlobalState) {
                        const {
                            onRemoteToggle: cbOnRemoteToggle,
                            onRemoteFocusModeToggle: cbOnRemoteFocusModeToggle,
                            showWhiteboard: cbShowWhiteboard,
                            isAbsoluteFocusMode: cbIsAbsoluteFocusMode,
                        } = initProps.current;

                        if (typeof currentGlobalState.isWhiteboardOpen === 'boolean') {
                            if (cbOnRemoteToggle && currentGlobalState.isWhiteboardOpen !== cbShowWhiteboard) {
                                cbOnRemoteToggle(currentGlobalState.isWhiteboardOpen);
                            }
                        }
                        if (typeof currentGlobalState.isAbsoluteFocusMode === 'boolean') {
                            if (cbOnRemoteFocusModeToggle && currentGlobalState.isAbsoluteFocusMode !== cbIsAbsoluteFocusMode) {
                                cbOnRemoteFocusModeToggle(currentGlobalState.isAbsoluteFocusMode);
                            }
                            if (currentGlobalState.isAbsoluteFocusMode && cbOnRemoteToggle) {
                                cbOnRemoteToggle(true);
                            }
                        }
                    }
                }

                // ── Room state listener (page sync & global whiteboard open sync) ──
                roomInstance.callbacks.on('onRoomStateChanged', (state: WhiteboardRoomState) => {
                    if (!rIsTeacher && state.globalState) {
                        const globalState = state.globalState as Record<string, unknown>;
                        const {
                            onRemoteToggle: cbOnRemoteToggle,
                            onRemoteFocusModeToggle: cbOnRemoteFocusModeToggle,
                        } = initProps.current;

                        if (typeof globalState.isWhiteboardOpen === 'boolean') {
                            const isOpen = globalState.isWhiteboardOpen;
                            if (cbOnRemoteToggle) {
                                cbOnRemoteToggle(isOpen);
                            }
                            if (isOpen && roomRef.current) {
                                try {
                                    roomRef.current.refreshViewSize();
                                    roomRef.current.setViewMode(ViewMode.Follower);
                                    roomRef.current.disableDeviceInputs = true;
                                } catch (e) {
                                    console.error("[Whiteboard] Error updating follower mode on roomStateChanged:", e);
                                }
                            }
                        }

                        if (typeof globalState.isAbsoluteFocusMode === 'boolean') {
                            const isFocus = globalState.isAbsoluteFocusMode;
                            if (cbOnRemoteFocusModeToggle) {
                                cbOnRemoteFocusModeToggle(isFocus);
                            }
                            if (isFocus) {
                                if (cbOnRemoteToggle) cbOnRemoteToggle(true);
                                void lockLandscapeOrientation();
                                if (roomRef.current) {
                                    try {
                                        roomRef.current.refreshViewSize();
                                        roomRef.current.setViewMode(ViewMode.Follower);
                                        roomRef.current.disableDeviceInputs = true;
                                    } catch {}
                                }
                            } else {
                                void unlockScreenOrientation();
                            }
                        }
                    }

                    if (state.sceneState) {
                        setPageState(prev => {
                            const next = {
                                current: state.sceneState!.index,
                                total:   state.sceneState!.scenes.length,
                            };
                            // 2.5: Flash the page counter briefly when teacher navigates
                            if (!rIsTeacher && prev.current !== next.current) {
                                setPageFlash(true);
                                setTimeout(() => setPageFlash(false), 800);
                            }
                            return next;
                        });
                    }
                });

                // ── 2.2f: Phase listener — token expiry / disconnect handling ──
                roomInstance.callbacks.on('onPhaseChanged', (newPhase: RoomPhase) => {
                    setPhase(newPhase);

                    if (
                        newPhase === RoomPhase.Disconnected ||
                        newPhase === RoomPhase.Reconnecting
                    ) {
                        Sentry.addBreadcrumb({
                            category: "whiteboard",
                            message:  "whiteboard_disconnected",
                            level:    "warning",
                            data:     {
                                phase:      newPhase,
                                booking_id: initProps.current.bookingId,
                                room_uuid:  initProps.current.roomUuid,
                            },
                        });
                        // Debounce: wait 800ms before attempting reconnect, in case
                        // it is a momentary blip that the SDK self-recovers from.
                        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
                        reconnectTimerRef.current = setTimeout(() => {
                            // Re-check phase; SDK may have recovered on its own
                            const currentPhase = roomRef.current?.phase;
                            if (
                                currentPhase === RoomPhase.Disconnected ||
                                currentPhase === RoomPhase.Reconnecting
                            ) {
                                reconnectWithFreshToken();
                            }
                        }, 800);
                    } else if (newPhase === RoomPhase.Connected) {
                        Sentry.addBreadcrumb({
                            category: "whiteboard",
                            message:  "whiteboard_reconnected",
                            level:    "info",
                            data:     {
                                booking_id: initProps.current.bookingId,
                                room_uuid:  initProps.current.roomUuid,
                            },
                        });
                        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
                        setIsReconnecting(false);
                    }
                });

                const sceneState = roomInstance.state.sceneState;
                setPageState({ current: sceneState.index, total: sceneState.scenes.length });
                setPhase(roomInstance.phase);
                setLoading(false);
                setError(null);
            } catch (joinError: unknown) {
                if (unmounted) return;

                // Auto-retry once after 1.5s if it was an initial timeout or network hiccup
                if (attempt < 1) {
                    attempt++;
                    console.warn(`[Whiteboard] Join attempt ${attempt} failed, retrying automatically in 1.5s...`, joinError);
                    setTimeout(() => {
                        if (!unmounted) {
                            joinRoom();
                        }
                    }, 1500);
                    return;
                }

                Sentry.captureException(joinError, {
                    tags:  { component: "Whiteboard", action: "join_failed" },
                    extra: {
                        booking_id: initProps.current.bookingId,
                        room_uuid:  initProps.current.roomUuid,
                        region:     initProps.current.region,
                    },
                });
                setError(`فشل الانضمام للغرفة: ${joinError instanceof Error ? joinError.message : 'خطأ غير معروف'}`);
                setLoading(false);
            }
        };

        joinRoom();

        return () => {
            unmounted = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (roomRef.current) {
                const room = roomRef.current;
                roomRef.current = null; // Null out ref immediately to prevent any re-entrant calls
                try {
                    // Step 1: Detach DOM listeners BEFORE disconnecting.
                    // This prevents internal pointer/keyboard events from firing
                    // while the room transitions through the 'disconnecting' phase.
                    room.bindHtmlElement(null);
                } catch { /* ignore — room may already be disconnecting */ }
                // Step 2: Disconnect asynchronously, ignoring all teardown errors.
                // white-web-sdk has an internal bug where refreshSyncOperations()
                // fires during phase transition to 'disconnecting' and calls
                // assertRoomIsConnected() — which throws because the room is no
                // longer connected. This is expected and safe to ignore.
                room.disconnect().catch(() => { /* expected during unmount */ });
            }
            sdkRef.current = null;
        };
    }, [retryTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Tool application ──────────────────────────────────────────────────────
    const applyTool = useCallback((tool: string, color?: string, width?: number) => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;
        const resolvedColor = color ?? strokeColor;
        const resolvedWidth = width ?? strokeWidth;
        switch (tool) {
            case 'selector':  room.setMemberState({ currentApplianceName: ApplianceNames.selector }); break;
            case 'pencil':
                room.setMemberState({
                    currentApplianceName: ApplianceNames.pencil,
                    strokeColor: hexToRgb(resolvedColor),
                    strokeWidth: resolvedWidth,
                });
                break;
            case 'rectangle': room.setMemberState({ currentApplianceName: ApplianceNames.rectangle, strokeColor: hexToRgb(resolvedColor), strokeWidth: resolvedWidth }); break;
            case 'ellipse':   room.setMemberState({ currentApplianceName: ApplianceNames.ellipse,   strokeColor: hexToRgb(resolvedColor), strokeWidth: resolvedWidth }); break;
            case 'eraser':    room.setMemberState({ currentApplianceName: ApplianceNames.eraser }); break;
            case 'text':      room.setMemberState({ currentApplianceName: ApplianceNames.text,      strokeColor: hexToRgb(resolvedColor) }); break;
        }
    }, [isTeacher, strokeColor, strokeWidth]);

    const setTool  = useCallback((tool: string)   => { setActiveTool(tool);  applyTool(tool); }, [applyTool]);
    const setColor = useCallback((color: string)  => {
        setStrokeColor(color);
        if (activeTool !== 'selector' && activeTool !== 'eraser') applyTool(activeTool, color, strokeWidth);
    }, [activeTool, strokeWidth, applyTool]);
    const setWidth = useCallback((width: number)  => {
        setStrokeWidth(width);
        if (activeTool !== 'selector' && activeTool !== 'eraser') applyTool(activeTool, strokeColor, width);
    }, [activeTool, strokeColor, applyTool]);

    const undo = useCallback(() => {
        roomRef.current?.undo();
    }, []);

    const redo = useCallback(() => {
        roomRef.current?.redo();
    }, []);

    const showToolbar = useCallback(() => {
        setToolbarVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
    }, []);

    // ── Keyboard shortcuts (teacher only) ────────────────────────────────────
    useEffect(() => {
        if (!isTeacher) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
            const key = e.key.toLowerCase();
            if (!e.ctrlKey && !e.metaKey && TOOL_HOTKEYS[key]) {
                e.preventDefault(); setTool(TOOL_HOTKEYS[key]); return;
            }
            if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
                e.preventDefault(); 
                if (undoSteps > 0) undo(); 
                return;
            }
            if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
                e.preventDefault(); 
                if (redoSteps > 0) redo(); 
                return;
            }
            if (key === 'delete' && e.ctrlKey) {
                e.preventDefault(); clearCanvas(); return;
            }
            if (key === 'arrowright' && !e.ctrlKey) {
                e.preventDefault();
                const room = roomRef.current;
                if (room) {
                    const idx = room.state.sceneState.index;
                    if (idx < room.state.sceneState.scenes.length - 1) room.setSceneIndex(idx + 1);
                }
                return;
            }
            if (key === 'arrowleft' && !e.ctrlKey) {
                e.preventDefault();
                const room = roomRef.current;
                if (room && room.state.sceneState.index > 0) {
                    room.setSceneIndex(room.state.sceneState.index - 1);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTeacher, clearCanvas, setTool, undo, redo, undoSteps, redoSteps]);

    // Auto-hide toolbar after load
    useEffect(() => {
        if (isTeacher && !loading && !error) {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
        }
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    }, [loading, error, isTeacher]);



    // Page navigation helpers
    const addPage = useCallback(() => {
        const room = roomRef.current;
        if (!room) return;

        const dir = room.state.sceneState.scenePath.substring(0, room.state.sceneState.scenePath.lastIndexOf('/')) || '/';
        const newIndex = pageState.total;
        room.putScenes(dir, [{}], newIndex);
        room.setSceneIndex(newIndex);
    }, [pageState.total]);

    const goToPage = useCallback((index: number) => {
        const room = roomRef.current;
        if (!room || index < 0 || index >= pageState.total) return;
        room.setSceneIndex(index);
    }, [pageState.total]);

    // ── Derived phase booleans ────────────────────────────────────────────────
    const isConnected    = phase === RoomPhase.Connected;
    const isDisconnected = phase === RoomPhase.Disconnected;

    // 2.4: On touch devices the whiteboard container must NOT suppress pointer
    // events with `touch-none` — Netless handles them internally via DeviceType.Touch.
    const isTouchDevice = deviceTypeState === DeviceType.Touch;

    const handleToggleFocusMode = useCallback(() => {
        if (!onToggleFocusMode) return;
        
        const willBeAbsolute = !isAbsoluteFocusMode;
        onToggleFocusMode(willBeAbsolute);

        // When teacher toggles focus mode on, ensure local whiteboard is open
        if (isTeacher && willBeAbsolute && onRemoteToggle && !showWhiteboard) {
            onRemoteToggle(true);
        }

        if (willBeAbsolute) {
            void lockLandscapeOrientation();
        } else {
            void unlockScreenOrientation();
        }

        // If teacher, synchronize focus mode to all students via Netless GlobalState & Agora RTM
        if (isTeacher) {
            if (roomRef.current && roomRef.current.isWritable) {
                try {
                    roomRef.current.setGlobalState({
                        isWhiteboardOpen: willBeAbsolute ? true : (showWhiteboard ?? false),
                        isAbsoluteFocusMode: willBeAbsolute,
                    });
                } catch (e) {
                    console.error("[Whiteboard] Failed to sync focus mode in globalState:", e);
                }
            }

            if (willBeAbsolute && !showWhiteboard) {
                sendCustomMessage({ type: 'whiteboard_toggle', show: true });
            }
            sendCustomMessage({ type: 'focus_mode_toggle', focus: willBeAbsolute });
        }
    }, [isAbsoluteFocusMode, onToggleFocusMode, isTeacher, onRemoteToggle, showWhiteboard, sendCustomMessage]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div 
            className="w-full h-full flex flex-col bg-white overflow-hidden relative"
            onPointerDownCapture={onInteract}
        >

            {/* ── Loading overlay ── */}
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                    <p className="text-slate-600 font-bold">جاري تحميل السبورة...</p>
                </div>
            )}

            {/* ── Error overlay (hard failure) ── */}
            {error && !isReconnecting && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-50 p-6 text-center">
                    <div className="bg-red-100 p-3 rounded-full mb-4"><Trash2 className="w-8 h-8 text-red-600" /></div>
                    <h3 className="text-red-800 font-bold text-lg mb-2">حدث خطأ في السبورة</h3>
                    <p className="text-red-600 mb-4 max-w-xs">{error}</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={handleRetryJoin}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            إعادة محاولة الاتصال بالسبورة
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition text-sm"
                        >
                            تحديث الصفحة بالكامل
                        </button>
                    </div>
                </div>
            )}

            {/* ── 2.2f / 2.3: Reconnecting overlay ── */}
            {isReconnecting && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                    <p className="text-white font-bold text-base">جاري إعادة الاتصال بالسبورة...</p>
                    <p className="text-slate-300 text-xs mt-1">انتظر قليلاً، يتم تجديد الجلسة تلقائياً</p>
                </div>
            )}

            {/* ── 2.3: Disconnected banner (non-blocking — user can see board but can't draw) ── */}
            {!loading && !isReconnecting && isDisconnected && !error && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/30 shadow-xl pointer-events-none">
                    <WifiOff className="w-4 h-4 text-red-300 shrink-0" />
                    <span className="text-red-200 text-xs font-bold">السبورة غير متصلة</span>
                </div>
            )}

            {/* ── Top Left Controls (Focus Mode & Status) ── */}
            {!loading && !error && (
                <div className="absolute top-3 left-3 md:left-5 z-50 flex items-center gap-2">
                    
                    {/* Focus Mode Toggle (Available for everyone) */}
                    {onToggleFocusMode && (
                        <button
                            onClick={handleToggleFocusMode}
                            className="p-2 bg-slate-900/60 hover:bg-slate-900/90 text-white rounded-xl backdrop-blur-md transition border border-white/10 shadow-lg pointer-events-auto"
                            title={isAbsoluteFocusMode ? "إنهاء وضع التركيز" : "وضع التركيز المطلق"}
                        >
                            {isAbsoluteFocusMode ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    )}

                    {/* Follower mode & Status badge for students */}
                    {!isTeacher && (
                        <div className="flex items-center gap-2 pointer-events-none">
                            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
                                {isConnected ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-emerald-400 text-[10px] font-bold">متصل</span>
                                    </>
                                ) : isReconnecting ? (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-amber-400 text-[10px] font-bold">جاري الاتصال</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-red-400 text-[10px] font-bold">غير متصل</span>
                                    </>
                                )}
                            </div>
                            {isConnected && (
                                <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
                                    <Eye className="w-3 h-3 text-blue-400 shrink-0" />
                                    <span className="text-slate-300 text-[10px] font-bold">وضع المتابعة</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Teacher: invisible hover target to reveal toolbar ── */}
            {isTeacher && !loading && !error && (
                <div 
                    className={`absolute top-0 left-0 right-0 h-6 z-50 flex items-center justify-center cursor-pointer transition-colors ${
                        isTouchDevice ? 'bg-black/5 hover:bg-black/10' : ''
                    }`} 
                    onMouseEnter={showToolbar}
                    onClick={showToolbar}
                    onTouchStart={showToolbar}
                >
                    <div className={`transition-opacity duration-300 flex items-center justify-center ${toolbarVisible ? 'opacity-0' : 'opacity-100'}`}>
                        {isTouchDevice ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 opacity-70" />
                        ) : (
                            <div className="w-12 h-1 rounded-full bg-black/20 animate-pulse" />
                        )}
                    </div>
                </div>
            )}

            {/* ── Teacher: Drawing toolbar ── */}
            {isTeacher && !loading && !error && (
                <div
                    className={`absolute top-3 left-1/2 -translate-x-1/2 z-40 w-max transition-all duration-300 ease-in-out ${
                        toolbarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
                    }`}
                    onMouseEnter={showToolbar}
                    onMouseLeave={() => {
                        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
                        hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
                    }}
                >
                    <div className="flex items-center gap-0.5 px-2 py-1.5 sm:px-4 sm:py-2 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 max-w-[92vw] overflow-x-auto scrollbar-hide">
                        <ToolButton icon={<MousePointer2 size={16} />} active={activeTool === 'selector'}  onClick={() => { setTool('selector');  showToolbar(); }} label="تحديد (S)" />
                        <ToolButton icon={<Pencil size={16} />}        active={activeTool === 'pencil'}    onClick={() => { setTool('pencil');    showToolbar(); }} label="قلم (P)" />
                        <ToolButton icon={<Square size={16} />}        active={activeTool === 'rectangle'} onClick={() => { setTool('rectangle'); showToolbar(); }} label="مستطيل (R)" />
                        <ToolButton icon={<Circle size={16} />}        active={activeTool === 'ellipse'}   onClick={() => { setTool('ellipse');   showToolbar(); }} label="دائرة (C)" />
                        <ToolButton icon={<Type size={16} />}          active={activeTool === 'text'}      onClick={() => { setTool('text');      showToolbar(); }} label="نص (T)" />
                        <ToolButton icon={<Eraser size={16} />}        active={activeTool === 'eraser'}    onClick={() => { setTool('eraser');    showToolbar(); }} label="ممحاة (E)" />

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        {/* Color swatches */}
                        <div className="flex items-center gap-1 shrink-0">
                            {STROKE_COLORS.map(({ hex, label }) => (
                                <button
                                    key={hex} title={label}
                                    onClick={() => { setColor(hex); showToolbar(); }}
                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shrink-0 ${
                                        strokeColor === hex ? 'border-blue-400 scale-110 ring-2 ring-blue-400/40' : 'border-white/20'
                                    }`}
                                    style={{ backgroundColor: hex }}
                                />
                            ))}
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        {/* Stroke width */}
                        <div className="flex items-center gap-0.5 shrink-0">
                            {STROKE_WIDTHS.map((w) => (
                                <button
                                    key={w} title={`سُمك ${w}`}
                                    onClick={() => { setWidth(w); showToolbar(); }}
                                    disabled={activeTool === 'text'}
                                    className={`w-8 h-7 sm:w-9 sm:h-8 rounded-lg flex items-center justify-center transition-all ${
                                        strokeWidth === w ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'hover:bg-white/5'
                                    } ${activeTool === 'text' ? 'opacity-30 cursor-not-allowed' : ''}`}
                                >
                                    <div className="rounded-full bg-white/80" style={{ width: 22, height: Math.max(1, Math.round(w * 0.55)) }} />
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <ToolButton icon={<Undo2 size={16} />}  disabled={undoSteps === 0} onClick={() => { undo(); showToolbar(); }} label="تراجع (Ctrl+Z)" />
                        <ToolButton icon={<Redo2 size={16} />}  disabled={redoSteps === 0} onClick={() => { redo(); showToolbar(); }} label="إعادة (Ctrl+Y)" />

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <ToolButton icon={<Trash2 size={16} />} onClick={() => { clearCanvas(); showToolbar(); }} label="مسح الكل (Ctrl+Del)" variant="danger" />
                    </div>
                </div>
            )}

            {/* ── 2.5: Page counter — visible ONLY in focus mode ── */}
            {!loading && !error && isAbsoluteFocusMode && (
                <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 bg-slate-900/40 hover:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/10 transition-colors duration-300">
                    <button
                        onClick={() => goToPage(pageState.current - 1)}
                        disabled={pageState.current === 0}
                        className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronRight size={14} />
                    </button>

                    {/* Page indicator — animated flash for students on teacher navigation */}
                    <span
                        className={`text-slate-200 text-xs font-bold min-w-[50px] text-center transition-all duration-300 ${
                            pageFlash && !isTeacher ? 'scale-125 text-blue-300' : 'scale-100'
                        }`}
                    >
                        {pageState.current + 1} / {pageState.total}
                    </span>

                    <button
                        onClick={() => goToPage(pageState.current + 1)}
                        disabled={pageState.current >= pageState.total - 1}
                        className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    
                    {isTeacher && (
                        <>
                            <div className="w-px h-4 bg-white/10" />
                            <button onClick={addPage} title="صفحة جديدة" className="p-1 text-slate-300 hover:text-emerald-400 transition">
                                <Plus size={14} />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Whiteboard canvas ──
             *  2.4: touch-none is only applied on non-touch devices.
             *       On touch devices Netless registers its own touch listeners
             *       internally, so we must NOT suppress the events with CSS.
             */}
            <div
                ref={whiteboardRef}
                className={`flex-1 w-full h-full relative z-10 pointer-events-auto overflow-hidden ${isTouchDevice ? '' : 'touch-none'}`}
                style={{ minHeight: '400px' }}
                onMouseMove={handleMouseMove}
                dir="ltr"
            >


                {/* ── Render remote cursors ── */}
                {Object.entries(remoteCursors).map(([cursorUid, pos]) => (
                    String(cursorUid) !== String(uid) && (
                        <div
                            key={cursorUid}
                            className="absolute pointer-events-none z-50 transition-all duration-75 ease-linear"
                            style={{
                                left: `${pos.x * 100}%`,
                                top: `${pos.y * 100}%`,
                                // Offset so the tip of the cursor is at the exact x,y
                                transform: 'translate(-2px, -2px)'
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 3.21a.5.5 0 0 0-.85.35Z" fill="#3B82F6" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                            </svg>
                            <span className="absolute top-5 left-3 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                                مشارك
                            </span>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
});

Whiteboard.displayName = 'Whiteboard';
export default Whiteboard;

// ─── ToolButton ───────────────────────────────────────────────────────────────

const ToolButton: React.FC<ToolButtonProps> = React.memo(({ icon, active, onClick, label, variant = 'primary', disabled }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTouchStart = () => {
        setShowTooltip(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setShowTooltip(false), 1500);
    };

    useEffect(() => {
        return () => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };
    }, []);

    const handleClick = () => {
        setShowTooltip(false);
        if (onClick) onClick();
    };

    return (
        <button
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            title={label}
            disabled={disabled}
            className={`p-2 rounded-xl transition-all duration-150 group relative disabled:opacity-30 disabled:cursor-not-allowed ${
                active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : variant === 'danger'
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
        >
            {icon}
            <span className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-white/10 ${showTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {label}
            </span>
        </button>
    );
});
ToolButton.displayName = 'ToolButton';