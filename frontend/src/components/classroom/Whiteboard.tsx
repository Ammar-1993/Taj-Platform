"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from "white-web-sdk";
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

const Whiteboard: React.FC<WhiteboardProps> = ({ appIdentifier, roomUuid, roomToken, uid, isTeacher, region = 'eu' }) => {
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const roomRef = useRef<Room | null>(null);

    // نُخزّن المعاملات الأولية في ref لمنع إعادة الاتصال
    const initProps = useRef({ appIdentifier, roomUuid, roomToken, uid, isTeacher, region });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState('pencil');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);

    // حالة الصفحات
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // تحديث حالة الصفحات عند التغيير
    const syncPageState = useCallback((room: Room) => {
        const state = room.state.sceneState;
        setCurrentPage(state.index);
        setTotalPages(state.scenes.length);
    }, []);

    useEffect(() => {
        if (!whiteboardRef.current) return;

        const { appIdentifier: appId, roomUuid: rUuid, roomToken: rToken, uid: rUid, isTeacher: rIsTeacher, region: rRegion } = initProps.current;

        const cleanAppId = appId.split('#')[0].trim();
        const cleanRoomUuid = rUuid.split('#')[0].trim();
        const cleanRoomToken = rToken.split('#')[0].trim();

        const supportedRegions = ['eu', 'us-sv', 'sg', 'cn-hz', 'in-mum'];
        const finalRegion = supportedRegions.includes(rRegion.toLowerCase()) ? rRegion.toLowerCase() : 'eu';

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
            console.log(`[Whiteboard] Init — AppID: ${cleanAppId.substring(0, 8)}... Region: ${finalRegion}`);

            sdk = new WhiteWebSdk({
                appIdentifier: cleanAppId,
                // ✅ Desktop: لا يُضيف تأخير "تخمين اللمس" المصمم للأجهزة اللوحية
                deviceType: DeviceType.Desktop,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                region: finalRegion as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        } catch (e: unknown) {
            console.error("[Whiteboard] SDK Init Error:", e);
            const message = e instanceof Error ? e.message : 'خطأ غير معروف';
            setError(`فشل تهيئة SDK السبورة: ${message}`);
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
                    // الطالب: قراءة فقط — المعلم فقط يملك صلاحية الكتابة
                    isWritable: rIsTeacher,
                    useMultiViews: false,
                });

                roomRef.current = roomInstance;
                roomInstance.bindHtmlElement(whiteboardRef.current);

                if (rIsTeacher) {
                    // ضبط الأداة الأولى للمعلم
                    roomInstance.setMemberState({
                        currentApplianceName: ApplianceNames.pencil,
                        strokeColor: hexToRgb('#000000'),
                        strokeWidth: 4,
                    });
                } else {
                    // الطالب يتبع نظرة المعلم دائماً
                    roomInstance.setViewMode(ViewMode.Follower);
                }

                // الاستماع لتغيير الصفحة
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                roomInstance.callbacks.on('onRoomStateChanged', (state: any) => {
                    if (state.sceneState) {
                        setCurrentPage(state.sceneState.index);
                        setTotalPages(state.sceneState.scenes.length);
                    }
                });

                syncPageState(roomInstance);
                setLoading(false);
                setError(null);

            } catch (joinError: unknown) {
                console.error("[Whiteboard] Join Error:", joinError);
                const message = joinError instanceof Error ? joinError.message : 'خطأ غير معروف';
                setError(`فشل الانضمام للغرفة: ${message}`);
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
    // ✅ تبعيات فارغة: الاتصال يحدث مرة واحدة فقط عند mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── أدوات المعلم ─────────────────────────────────────────

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

    const setTool = (tool: string) => {
        setActiveTool(tool);
        applyTool(tool);
    };

    const setColor = (color: string) => {
        setStrokeColor(color);
        // تطبيق اللون الجديد على الأداة الحالية مباشرة
        if (activeTool !== 'selector' && activeTool !== 'eraser') {
            applyTool(activeTool, color, strokeWidth);
        }
    };

    const setWidth = (width: number) => {
        setStrokeWidth(width);
        if (activeTool !== 'selector' && activeTool !== 'eraser') {
            applyTool(activeTool, strokeColor, width);
        }
    };

    const clearCanvas = () => {
        if (!roomRef.current || !isTeacher) return;
        roomRef.current.cleanCurrentScene();
    };

    const undo = () => roomRef.current?.undo();
    const redo = () => roomRef.current?.redo();

    // ─── إدارة الصفحات ─────────────────────────────────────────

    const addPage = () => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;
        const newIndex = totalPages;
        room.putScenes('/', [{}], newIndex);
        room.setScenePath(`/${newIndex}`);
    };

    const goToPage = (index: number) => {
        const room = roomRef.current;
        if (!room || !isTeacher) return;
        if (index < 0 || index >= totalPages) return;
        room.setScenePath(`/${index}`);
    };

    // ─── الرسم ─────────────────────────────────────────────────

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl relative">

            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
                    <p className="text-slate-600 font-bold">جاري تحميل السبورة...</p>
                </div>
            )}

            {/* Error Overlay */}
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

            {/* ─── شريط أدوات المعلم (يمين السبورة) ─── */}
            {isTeacher && !loading && !error && (
                <div className="absolute top-4 right-4 z-40 flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/10">

                    {/* أدوات الرسم */}
                    <ToolButton icon={<MousePointer2 size={18} />} active={activeTool === 'selector'} onClick={() => setTool('selector')} label="تحديد" />
                    <ToolButton icon={<Pencil size={18} />} active={activeTool === 'pencil'} onClick={() => setTool('pencil')} label="قلم" />
                    <ToolButton icon={<Square size={18} />} active={activeTool === 'rectangle'} onClick={() => setTool('rectangle')} label="مستطيل" />
                    <ToolButton icon={<Circle size={18} />} active={activeTool === 'ellipse'} onClick={() => setTool('ellipse')} label="دائرة" />
                    <ToolButton icon={<Type size={18} />} active={activeTool === 'text'} onClick={() => setTool('text')} label="نص" />
                    <ToolButton icon={<Eraser size={18} />} active={activeTool === 'eraser'} onClick={() => setTool('eraser')} label="ممحاة" />

                    <div className="w-full h-px bg-white/10 my-1" />

                    {/* Undo / Redo */}
                    <ToolButton icon={<Undo2 size={18} />} onClick={undo} label="تراجع" />
                    <ToolButton icon={<Redo2 size={18} />} onClick={redo} label="إعادة" />

                    <div className="w-full h-px bg-white/10 my-1" />

                    {/* سُمك الخط */}
                    <div className="flex flex-col gap-1 items-center px-1">
                        {STROKE_WIDTHS.map((w) => (
                            <button
                                key={w}
                                onClick={() => setWidth(w)}
                                title={`سُمك ${w}`}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${strokeWidth === w ? 'bg-blue-600/30 ring-1 ring-blue-500' : 'hover:bg-white/5'}`}
                            >
                                <div
                                    className="rounded-full bg-white"
                                    style={{ width: Math.min(w * 2, 26), height: Math.min(w * 2, 26) }}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="w-full h-px bg-white/10 my-1" />

                    {/* مسح الكل */}
                    <ToolButton icon={<Trash2 size={18} />} onClick={clearCanvas} label="مسح الكل" variant="danger" />
                </div>
            )}

            {/* ─── لوحة الألوان (أسفل السبورة لليمين) ─── */}
            {isTeacher && !loading && !error && (
                <div className="absolute bottom-16 right-4 z-40 flex flex-col gap-1.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/10">
                    {STROKE_COLORS.map(({ hex, label }) => (
                        <button
                            key={hex}
                            title={label}
                            onClick={() => setColor(hex)}
                            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                                strokeColor === hex
                                    ? 'border-blue-400 scale-110 ring-2 ring-blue-400/40'
                                    : 'border-white/20'
                            }`}
                            style={{ backgroundColor: hex }}
                        />
                    ))}
                </div>
            )}

            {/* ─── شريط التنقل بين الصفحات (أسفل السبورة) ─── */}
            {!loading && !error && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xl border border-white/10">
                    {isTeacher && (
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    )}
                    <span className="text-white text-xs font-bold min-w-[60px] text-center">
                        {currentPage + 1} / {totalPages}
                    </span>
                    {isTeacher && (
                        <>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="w-px h-4 bg-white/10" />
                            <button
                                onClick={addPage}
                                title="صفحة جديدة"
                                className="p-1 text-slate-400 hover:text-emerald-400 transition"
                            >
                                <Plus size={16} />
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ─── لوحة الرسم ─── */}
            <div
                ref={whiteboardRef}
                className="flex-1 w-full h-full touch-none relative z-10 pointer-events-auto"
                style={{ minHeight: '400px' }}
            />
        </div>
    );
};

const ToolButton: React.FC<ToolButtonProps> = ({ icon, active, onClick, label, variant = 'primary', disabled }) => (
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
        <span className="absolute right-full mr-3 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
            {label}
        </span>
    </button>
);

export default Whiteboard;
