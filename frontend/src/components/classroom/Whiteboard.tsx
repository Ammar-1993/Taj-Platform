"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from "white-web-sdk";
import throttle from 'lodash/throttle';
import {
    Loader2, Pencil, Eraser, Square, Circle, Type,
    MousePointer2, Trash2, Undo2, Redo2, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';

interface WhiteboardProps {
    appIdentifier: string;
    roomUuid: string;
    roomToken: string;
    uid: string;
    isTeacher: boolean;
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

// الألوان المتاحة للمعلم
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

// تحويل hex إلى مصفوفة [r, g, b] التي يقبلها SDK
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [0, 0, 0];
}

const STROKE_WIDTHS = [2, 4, 8, 14];

// Keyboard shortcut map for teacher tools
const TOOL_HOTKEYS: Record<string, string> = {
    p: 'pencil',
    e: 'eraser',
    s: 'selector',
    r: 'rectangle',
    c: 'ellipse',
    t: 'text',
};

const Whiteboard: React.FC<WhiteboardProps> = ({ appIdentifier, roomUuid, roomToken, uid, isTeacher, region = 'in-mum' }) => {
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
    const roomRef = useRef<Room | null>(null);

    // ✅ Task 1: Use useRef for tracking coordinates and drawing state (bypasses React state lag)
    const drawingState = useRef({
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        buffer: [] as { x: number, y: number }[],
    });

    // نُخزّن المعاملات الأولية في ref لمنع إعادة الاتصال
    const initProps = useRef({ appIdentifier, roomUuid, roomToken, uid, isTeacher, region });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState('pencil');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);

    const [pageState, setPageState] = useState({ current: 0, total: 1 });
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Helpers ─────────────────────────────────────────

    const drawBatchOnCanvas = useCallback((points: {x: number, y: number}[], color: string, width: number) => {
        const canvas = canvasOverlayRef.current;
        if (!canvas || points.length < 2) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const clearCanvas = useCallback(() => {
        if (!roomRef.current || !isTeacher) return;
        roomRef.current.cleanCurrentScene();
        // Clear overlay too
        const canvas = canvasOverlayRef.current;
        if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }, [isTeacher]);

    // ─── Task 2: Throttled Coordinate Batching ──────────────────────────

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const emitBatch = useCallback(
        throttle(() => {
            const room = roomRef.current;
            const state = drawingState.current;
            if (!room || state.buffer.length < 2) return;

            room.dispatchMagixEvent("drawing-batch", {
                points: [...state.buffer],
                color: strokeColor,
                width: strokeWidth
            });
            
            state.buffer = [state.buffer[state.buffer.length - 1]];
        }, 60),
        [strokeColor, strokeWidth]
    );

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTeacher || activeTool !== 'pencil') return;
        
        const rect = whiteboardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        drawingState.current = {
            isDrawing: true,
            lastX: x,
            lastY: y,
            buffer: [{ x, y }]
        };
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const state = drawingState.current;
        if (!state.isDrawing || !isTeacher) return;

        const rect = whiteboardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // ✅ Immediate native drawing (No React State)
        const ctx = canvasOverlayRef.current?.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(state.lastX, state.lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        state.lastX = x;
        state.lastY = y;
        state.buffer.push({ x, y });

        emitBatch();
    };

    const handleMouseUp = () => {
        if (!drawingState.current.isDrawing) return;
        emitBatch();
        drawingState.current.isDrawing = false;
        drawingState.current.buffer = [];
    };

    // ─── SDK Init ─────────────────────────────────────────

    useEffect(() => {
        if (!whiteboardRef.current) return;

        const { appIdentifier: appId, roomUuid: rUuid, roomToken: rToken, uid: rUid, isTeacher: rIsTeacher, region: rRegion } = initProps.current;

        const cleanAppId = appId.split('#')[0].trim();
        const cleanRoomUuid = rUuid.split('#')[0].trim();
        const cleanRoomToken = rToken.split('#')[0].trim();

        const supportedRegions = ['eu', 'us-sv', 'sg', 'cn-hz', 'in-mum'];
        const finalRegion = supportedRegions.includes(rRegion.toLowerCase()) ? rRegion.toLowerCase() : 'in-mum';

        if (!cleanAppId) {
            setError("معرف التطبيق (App Identifier) مفقود أو غير صالح.");
            setLoading(false);
            return;
        }

        if (!cleanRoomUuid || !cleanRoomToken) {
            setError("بيانات الغرفة غير مكتملة.");
            setLoading(false);
            return;
        }

        let sdk: WhiteWebSdk | null = null;

        try {
            sdk = new WhiteWebSdk({
                appIdentifier: cleanAppId,
                deviceType: DeviceType.Desktop,
                disableDeviceInputs: !rIsTeacher,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                region: finalRegion as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        } catch (e: unknown) {
            console.error("[Whiteboard] SDK Init Error:", e);
            setError(`فشل تهيئة SDK السبورة: ${e instanceof Error ? e.message : 'خطأ غير معروف'}`);
            setLoading(false);
            return;
        }

        const joinRoom = async () => {
            try {
                if (!sdk || !whiteboardRef.current) return;

                const roomInstance = await sdk.joinRoom({
                    uuid: cleanRoomUuid,
                    roomToken: cleanRoomToken,
                    uid: rUid,
                    isWritable: rIsTeacher,
                    useMultiViews: false,
                    disableEraseImage: true,
                    floatBar: false,
                    hotKeys: rIsTeacher ? undefined : {},
                } as any);

                roomRef.current = roomInstance;
                roomInstance.bindHtmlElement(whiteboardRef.current);

                roomInstance.addMagixEventListener("drawing-batch", (event) => {
                    const { points, color, width } = event.payload;
                    drawBatchOnCanvas(points, color, width);
                });

                if (rIsTeacher) {
                    roomInstance.setMemberState({
                        currentApplianceName: ApplianceNames.pencil,
                        strokeColor: hexToRgb('#000000'),
                        strokeWidth: 4,
                    });
                } else {
                    roomInstance.setViewMode(ViewMode.Follower);
                }

                roomInstance.callbacks.on('onRoomStateChanged', (state: any) => {
                    if (state.sceneState) {
                        setPageState({
                            current: state.sceneState.index,
                            total: state.sceneState.scenes.length,
                        });
                    }
                });

                const sceneState = roomInstance.state.sceneState;
                setPageState({ current: sceneState.index, total: sceneState.scenes.length });

                setLoading(false);
                setError(null);

            } catch (joinError: unknown) {
                console.error("[Whiteboard] Join Error:", joinError);
                setError(`فشل الانضمام للغرفة: ${joinError instanceof Error ? joinError.message : 'خطأ غير معروف'}`);
                setLoading(false);
            }
        };

        joinRoom();

        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
        };
    }, [drawBatchOnCanvas]);

    // ─── Keyboard & UI ─────────────────────────────────────────

    useEffect(() => {
        if (!isTeacher) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
            const key = e.key.toLowerCase();

            if (!e.ctrlKey && !e.metaKey && TOOL_HOTKEYS[key]) {
                e.preventDefault();
                setTool(TOOL_HOTKEYS[key]);
                return;
            }

            if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
                e.preventDefault();
                roomRef.current?.undo();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
                e.preventDefault();
                roomRef.current?.redo();
                return;
            }

            if (key === 'delete' && e.ctrlKey) {
                e.preventDefault();
                clearCanvas();
                return;
            }

            if (key === 'arrowright' && !e.ctrlKey) {
                e.preventDefault();
                const room = roomRef.current;
                if (room) {
                    const idx = room.state.sceneState.index;
                    const total = room.state.sceneState.scenes.length;
                    if (idx < total - 1) room.setScenePath(`/${idx + 1}`);
                }
                return;
            }

            if (key === 'arrowleft' && !e.ctrlKey) {
                e.preventDefault();
                const room = roomRef.current;
                if (room) {
                    const idx = room.state.sceneState.index;
                    if (idx > 0) room.setScenePath(`/${idx - 1}`);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTeacher, clearCanvas]);

    useEffect(() => {
        if (isTeacher && !loading && !error) {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
        }
        return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
    }, [loading, error, isTeacher]);

    const applyTool = useCallback((tool: string, color?: string, width?: number) => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;

        const resolvedColor = color ?? strokeColor;
        const resolvedWidth = width ?? strokeWidth;

        switch (tool) {
            case 'selector':
                room.setMemberState({ currentApplianceName: ApplianceNames.selector });
                break;
            case 'pencil':
                room.setMemberState({
                    currentApplianceName: ApplianceNames.pencil,
                    strokeColor: hexToRgb(resolvedColor),
                    strokeWidth: resolvedWidth,
                });
                break;
            case 'rectangle':
                room.setMemberState({
                    currentApplianceName: ApplianceNames.rectangle,
                    strokeColor: hexToRgb(resolvedColor),
                    strokeWidth: resolvedWidth,
                });
                break;
            case 'ellipse':
                room.setMemberState({
                    currentApplianceName: ApplianceNames.ellipse,
                    strokeColor: hexToRgb(resolvedColor),
                    strokeWidth: resolvedWidth,
                });
                break;
            case 'eraser':
                room.setMemberState({ currentApplianceName: ApplianceNames.eraser });
                break;
            case 'text':
                room.setMemberState({
                    currentApplianceName: ApplianceNames.text,
                    strokeColor: hexToRgb(resolvedColor),
                });
                break;
        }
    }, [isTeacher, strokeColor, strokeWidth]);

    const setTool = useCallback((tool: string) => {
        setActiveTool(tool);
        applyTool(tool);
    }, [applyTool]);

    const setColor = useCallback((color: string) => {
        setStrokeColor(color);
        if (activeTool !== 'selector' && activeTool !== 'eraser') {
            applyTool(activeTool, color, strokeWidth);
        }
    }, [activeTool, strokeWidth, applyTool]);

    const setWidth = useCallback((width: number) => {
        setStrokeWidth(width);
        if (activeTool !== 'selector' && activeTool !== 'eraser') {
            applyTool(activeTool, strokeColor, width);
        }
    }, [activeTool, strokeColor, applyTool]);

    const undo = useCallback(() => roomRef.current?.undo(), []);
    const redo = useCallback(() => roomRef.current?.redo(), []);

    const showToolbar = useCallback(() => {
        setToolbarVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
    }, []);

    const addPage = useCallback(() => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;
        const newIndex = pageState.total;
        room.putScenes('/', [{}], newIndex);
        room.setScenePath(`/${newIndex}`);
    }, [isTeacher, pageState.total]);

    const goToPage = useCallback((index: number) => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;
        if (index < 0 || index >= pageState.total) return;
        room.setScenePath(`/${index}`);
    }, [isTeacher, pageState.total]);

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl relative">

            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                    <p className="text-slate-600 font-bold">جاري تحميل السبورة...</p>
                </div>
            )}

            {error && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-50 p-6 text-center">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
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

            {isTeacher && !loading && !error && (
                <div className="absolute top-0 left-0 right-0 h-4 z-50" onMouseEnter={showToolbar} />
            )}

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
                        <ToolButton icon={<MousePointer2 size={16} />} active={activeTool === 'selector'}  onClick={() => { setTool('selector');   showToolbar(); }} label="تحديد (S)" />
                        <ToolButton icon={<Pencil size={16} />}        active={activeTool === 'pencil'}    onClick={() => { setTool('pencil');     showToolbar(); }} label="قلم (P)" />
                        <ToolButton icon={<Square size={16} />}        active={activeTool === 'rectangle'} onClick={() => { setTool('rectangle');  showToolbar(); }} label="مستطيل (R)" />
                        <ToolButton icon={<Circle size={16} />}        active={activeTool === 'ellipse'}   onClick={() => { setTool('ellipse');    showToolbar(); }} label="دائرة (C)" />
                        <ToolButton icon={<Type size={16} />}          active={activeTool === 'text'}      onClick={() => { setTool('text');       showToolbar(); }} label="نص (T)" />
                        <ToolButton icon={<Eraser size={16} />}        active={activeTool === 'eraser'}    onClick={() => { setTool('eraser');     showToolbar(); }} label="ممحاة (E)" />

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <div className="flex items-center gap-1 shrink-0">
                            {STROKE_COLORS.map(({ hex, label }) => (
                                <button
                                    key={hex}
                                    title={label}
                                    onClick={() => { setColor(hex); showToolbar(); }}
                                    className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shrink-0 ${
                                        strokeColor === hex ? 'border-blue-400 scale-110 ring-2 ring-blue-400/40' : 'border-white/20'
                                    }`}
                                    style={{ backgroundColor: hex }}
                                />
                            ))}
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <div className="flex items-center gap-0.5 shrink-0">
                            {STROKE_WIDTHS.map((w) => (
                                <button
                                    key={w}
                                    onClick={() => { setWidth(w); showToolbar(); }}
                                    title={`سُمك ${w}`}
                                    className={`w-9 h-8 rounded-lg flex items-center justify-center transition-all ${
                                        strokeWidth === w ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="rounded-full bg-white/80" style={{ width: 22, height: Math.max(1, Math.round(w * 0.55)) }} />
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <ToolButton icon={<Undo2 size={16} />} onClick={() => { undo(); showToolbar(); }} label="تراجع (Ctrl+Z)" />
                        <ToolButton icon={<Redo2 size={16} />} onClick={() => { redo(); showToolbar(); }} label="إعادة (Ctrl+Y)" />

                        <div className="w-px h-6 bg-white/10 mx-1.5 shrink-0" />

                        <ToolButton icon={<Trash2 size={16} />} onClick={() => { clearCanvas(); showToolbar(); }} label="مسح الكل (Ctrl+Del)" variant="danger" />
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl border border-white/10">
                    {isTeacher && (
                        <button
                            onClick={() => goToPage(pageState.current - 1)}
                            disabled={pageState.current === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    )}
                    <span className="text-white text-xs font-bold min-w-[60px] text-center">
                        {pageState.current + 1} / {pageState.total}
                    </span>
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

            <div
                ref={whiteboardRef}
                className="flex-1 w-full h-full touch-none relative z-10 pointer-events-auto"
                style={{ minHeight: '400px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            >
                <canvas
                    ref={canvasOverlayRef}
                    className="absolute inset-0 pointer-events-none z-20"
                    width={whiteboardRef.current?.clientWidth || 1920}
                    height={whiteboardRef.current?.clientHeight || 1080}
                />
            </div>
        </div>
    );
};

const ToolButton: React.FC<ToolButtonProps> = React.memo(({ icon, active, onClick, label, variant = 'primary', disabled }) => (
    <button
        onClick={onClick}
        title={label}
        disabled={disabled}
        className={`p-2 rounded-xl transition-all duration-150 group relative disabled:opacity-30 disabled:cursor-not-allowed ${
            active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : variant === 'danger' ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        {icon}
        <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg border border-white/10">
            {label}
        </span>
    </button>
));
ToolButton.displayName = 'ToolButton';

export default Whiteboard;
