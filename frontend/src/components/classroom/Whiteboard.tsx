"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames, RoomPhase } from "white-web-sdk";
import {
    Loader2, Pencil, Eraser, Square, Circle, Type,
    MousePointer2, Trash2, Undo2, Redo2, ChevronLeft, ChevronRight, Plus,
    WifiOff, RefreshCw, Eye,
} from 'lucide-react';
import { bookingService } from '@/services/api';

// ─── Local types ─────────────────────────────────────────────────────────────

type WhiteboardRegion = "cn-hz" | "us-sv" | "sg" | "in-mum" | "gb-lon" | "eu";

interface SceneState {
    index: number;
    scenes: unknown[];
}

interface WhiteboardRoomState {
    sceneState?: SceneState;
}

interface WhiteboardProps {
    appIdentifier: string;
    roomUuid: string;
    roomToken: string;
    uid: string;
    isTeacher: boolean;
    bookingId: string;
    region?: string;
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

// ─── Main Component ───────────────────────────────────────────────────────────

const Whiteboard: React.FC<WhiteboardProps> = React.memo(({
    appIdentifier,
    roomUuid,
    roomToken,
    uid,
    isTeacher,
    bookingId,
    region = 'sg',
}) => {
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const roomRef       = useRef<Room | null>(null);
    const sdkRef        = useRef<WhiteWebSdk | null>(null);

    // Freeze init props so the effect only runs once (Netless rooms cannot be
    // cleanly rejoined inside the same effect cycle)
    const initProps = useRef({ appIdentifier, roomUuid, roomToken, uid, isTeacher, region, bookingId });

    // ── UI State ──────────────────────────────────────────────────────────────
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState<string | null>(null);
    const [activeTool, setActiveTool]         = useState('pencil');
    const [strokeColor, setStrokeColor]       = useState('#000000');
    const [strokeWidth, setStrokeWidth]       = useState(4);
    const [pageState, setPageState]           = useState({ current: 0, total: 1 });
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [pageFlash, setPageFlash]           = useState(false);     // 2.5: animate page change for students

    // ── 2.2f / 2.3: Connection phase state ───────────────────────────────────
    const [phase, setPhase]           = useState<RoomPhase>(RoomPhase.Connecting);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const reconnectTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRefreshingTokenRef        = useRef(false);

    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── 2.4: Detect touch device once on mount ───────────────────────────────
    const deviceType = useRef<DeviceType>(DeviceType.Desktop);

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

            // Disconnect the stale room instance first
            if (roomRef.current) {
                try { await roomRef.current.disconnect(); } catch { /* already disconnected */ }
                roomRef.current = null;
            }

            // Rejoin with the new token
            if (sdkRef.current && whiteboardRef.current) {
                const cleanRoomUuid  = String(rUuid).split('#')[0].trim();
                const cleanFreshToken = String(freshToken).split('#')[0].trim();

                const roomInstance = await sdkRef.current.joinRoom({
                    uuid:                           cleanRoomUuid,
                    roomToken:                      cleanFreshToken,
                    uid:                            rUid,
                    isWritable:                     rIsTeacher,
                    useMultiViews:                  true,
                    floatBar:                       false,
                    disableMagixEventDispatchLimit: true,
                    disableEraseImage:              true,
                    // تعطيل تحديد تردد رسم القلم لضمان الاستجابة الفورية
                    disablePencilWrittingLimitFrequency: true,
                    // تفعيل القلم الجديد (بالنعومة والتدرج) مع إلغاء التخزين المؤقت
                    disableNewPencil: true,
                });

                roomRef.current = roomInstance;
                roomInstance.bindHtmlElement(whiteboardRef.current);
                roomInstance.disableDeviceInputs = !rIsTeacher;

                if (!rIsTeacher) {
                    roomInstance.setViewMode(ViewMode.Follower);
                } else {
                    // Re-apply tool state after reconnect so the teacher's
                    // active tool/color/width are restored automatically.
                    roomInstance.setMemberState({
                        currentApplianceName: ApplianceNames.pencil,
                        strokeColor: hexToRgb('#000000'),
                        strokeWidth: 4,
                    });
                }

                // Re-register state listener
                roomInstance.callbacks.on('onRoomStateChanged', (state: WhiteboardRoomState) => {
                    if (state.sceneState) {
                        setPageState(prev => {
                            const next = { current: state.sceneState!.index, total: state.sceneState!.scenes.length };
                            if (!isTeacher && prev.current !== next.current) {
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
                });

                const sceneState = roomInstance.state.sceneState;
                setPageState({ current: sceneState.index, total: sceneState.scenes.length });
                setPhase(roomInstance.phase);
                setError(null);
            }
        } catch (err) {
            console.error('[Whiteboard] Reconnect failed:', err);
            setError('انقطع الاتصال بالسبورة. حاولنا إعادة الاتصال لكن فشل الأمر. يُرجى إعادة تحميل الصفحة.');
        } finally {
            isRefreshingTokenRef.current = false;
            setIsReconnecting(false);
        }
    }, [isTeacher]);

    // ── Main join effect ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!whiteboardRef.current) return;

        // 2.4: Detect device type before initialising the SDK
        deviceType.current = detectDeviceType();

        const {
            appIdentifier: appId, roomUuid: rUuid, roomToken: rToken,
            uid: rUid, isTeacher: rIsTeacher, region: rRegion,
        } = initProps.current;

        const cleanAppId      = String(appId).split('#')[0].trim();
        const cleanRoomUuid   = String(rUuid).split('#')[0].trim();
        const cleanRoomToken  = String(rToken).split('#')[0].trim();
        const supportedRegions = ['sg', 'us-sv', 'eu', 'cn-hz', 'in-mum'];
        const finalRegion     = supportedRegions.includes(rRegion.toLowerCase()) ? rRegion.toLowerCase() : 'eu';

        if (!cleanAppId || !cleanRoomUuid || !cleanRoomToken) {
            setError('بيانات الغرفة غير مكتملة.');
            setLoading(false);
            return;
        }

        let sdk: WhiteWebSdk | null = null;
        try {
            sdk = new WhiteWebSdk({
                appIdentifier: cleanAppId,
                deviceType:    deviceType.current,       // 2.4: correct device type
                region:        finalRegion as WhiteboardRegion,
            });
            sdkRef.current = sdk;
        } catch (e: unknown) {
            setError(`فشل تهيئة SDK السبورة: ${e instanceof Error ? e.message : 'خطأ غير معروف'}`);
            setLoading(false);
            return;
        }

        const joinRoom = async () => {
            try {
                if (!sdk || !whiteboardRef.current) return;
                const roomInstance = await sdk.joinRoom({
                    uuid:          cleanRoomUuid,
                    roomToken:     cleanRoomToken,
                    uid:           rUid,
                    isWritable:    rIsTeacher,
                    useMultiViews: true,

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

                roomRef.current = roomInstance;
                roomInstance.bindHtmlElement(whiteboardRef.current);
                roomInstance.disableDeviceInputs = !rIsTeacher;

                if (rIsTeacher) {
                    roomInstance.setMemberState({
                        currentApplianceName: ApplianceNames.pencil,
                        strokeColor: hexToRgb('#000000'),
                        strokeWidth: 4,
                    });
                } else {
                    // 2.3: Students always follow the teacher's viewport
                    roomInstance.setViewMode(ViewMode.Follower);
                }

                // ── Page state sync ───────────────────────────────────────────
                roomInstance.callbacks.on('onRoomStateChanged', (state: WhiteboardRoomState) => {
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
                setError(`فشل الانضمام للغرفة: ${joinError instanceof Error ? joinError.message : 'خطأ غير معروف'}`);
                setLoading(false);
            }
        };

        joinRoom();

        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (roomRef.current) {
                roomRef.current.disconnect().catch(() => {/* ignore disconnect errors on unmount */});
                roomRef.current = null;
            }
            sdkRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    const undo = useCallback(() => roomRef.current?.undo(), []);
    const redo = useCallback(() => roomRef.current?.redo(), []);

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
                e.preventDefault(); roomRef.current?.undo(); return;
            }
            if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
                e.preventDefault(); roomRef.current?.redo(); return;
            }
            if (key === 'delete' && e.ctrlKey) {
                e.preventDefault(); clearCanvas(); return;
            }
            if (key === 'arrowright' && !e.ctrlKey) {
                e.preventDefault();
                const room = roomRef.current;
                if (room) {
                    const idx = room.state.sceneState.index;
                    if (idx < room.state.sceneState.scenes.length - 1) room.setScenePath(`/${idx + 1}`);
                }
                return;
            }
            if (key === 'arrowleft' && !e.ctrlKey) {
                e.preventDefault();
                const room = roomRef.current;
                if (room && room.state.sceneState.index > 0) {
                    room.setScenePath(`/${room.state.sceneState.index - 1}`);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTeacher, clearCanvas, setTool]);

    // Auto-hide toolbar after load
    useEffect(() => {
        if (isTeacher && !loading && !error) {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
        }
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    }, [loading, error, isTeacher]);

    // Page navigation helpers
    const addPage  = useCallback(() => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;
        const newIndex = pageState.total;
        room.putScenes('/', [{}], newIndex);
        room.setScenePath(`/${newIndex}`);
    }, [isTeacher, pageState.total]);

    const goToPage = useCallback((index: number) => {
        const room = roomRef.current;
        if (!room || !isTeacher || index < 0 || index >= pageState.total) return;
        room.setScenePath(`/${index}`);
    }, [isTeacher, pageState.total]);

    // ── Derived phase booleans ────────────────────────────────────────────────
    const isConnected    = phase === RoomPhase.Connected;
    const isDisconnected = phase === RoomPhase.Disconnected;

    // 2.4: On touch devices the whiteboard container must NOT suppress pointer
    // events with `touch-none` — Netless handles them internally via DeviceType.Touch.
    const isTouchDevice = deviceType.current === DeviceType.Touch;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl relative">

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
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition"
                    >
                        إعادة تحميل الصفحة
                    </button>
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

            {/* ── 2.3: "Follower mode" status badge for students ── */}
            {!loading && !error && !isTeacher && isConnected && (
                <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none">
                    <Eye className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-slate-300 text-[10px] font-bold">وضع المتابعة</span>
                </div>
            )}

            {/* ── Teacher: invisible hover target to reveal toolbar ── */}
            {isTeacher && !loading && !error && (
                <div className="absolute top-0 left-0 right-0 h-4 z-50" onMouseEnter={showToolbar} />
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
                    <div className="flex items-center gap-0.5 px-4 py-2 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10">
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
                                    className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shrink-0 ${
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
                                    className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all ${
                                        strokeWidth === w ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="rounded-full bg-white/80" style={{ width: 22, height: Math.max(1, Math.round(w * 0.55)) }} />
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <ToolButton icon={<Undo2 size={16} />}  onClick={() => { undo(); showToolbar(); }} label="تراجع (Ctrl+Z)" />
                        <ToolButton icon={<Redo2 size={16} />}  onClick={() => { redo(); showToolbar(); }} label="إعادة (Ctrl+Y)" />

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <ToolButton icon={<Trash2 size={16} />} onClick={() => { clearCanvas(); showToolbar(); }} label="مسح الكل (Ctrl+Del)" variant="danger" />
                    </div>
                </div>
            )}

            {/* ── 2.5: Page counter — visible to ALL users ── */}
            {!loading && !error && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl border border-white/10">
                    {/* Prev button (teacher only) */}
                    {isTeacher && (
                        <button
                            onClick={() => goToPage(pageState.current - 1)}
                            disabled={pageState.current === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    )}

                    {/* Page indicator — animated flash for students on teacher navigation */}
                    <span
                        className={`text-white text-xs font-bold min-w-[60px] text-center transition-all duration-300 ${
                            pageFlash && !isTeacher ? 'scale-125 text-blue-300' : 'scale-100'
                        }`}
                    >
                        {pageState.current + 1} / {pageState.total}
                    </span>

                    {/* Next + add page (teacher only) */}
                    {isTeacher && (
                        <>
                            <button
                                onClick={() => goToPage(pageState.current + 1)}
                                disabled={pageState.current >= pageState.total - 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="w-px h-4 bg-white/10" />
                            <button onClick={addPage} title="صفحة جديدة" className="p-1 text-slate-400 hover:text-emerald-400 transition">
                                <Plus size={16} />
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
                className={`flex-1 w-full h-full relative z-10 pointer-events-auto ${isTouchDevice ? '' : 'touch-none'}`}
                style={{ minHeight: '400px' }}
            />
        </div>
    );
});

Whiteboard.displayName = 'Whiteboard';
export default Whiteboard;

// ─── ToolButton ───────────────────────────────────────────────────────────────

const ToolButton: React.FC<ToolButtonProps> = React.memo(({ icon, active, onClick, label, variant = 'primary', disabled }) => (
    <button
        onClick={onClick}
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
        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-white/10">
            {label}
        </span>
    </button>
));
ToolButton.displayName = 'ToolButton';