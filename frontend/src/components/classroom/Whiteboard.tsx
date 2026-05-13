"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode, ApplianceNames } from "white-web-sdk";
import { Loader2, Pencil, Eraser, Square, Circle, Type, MousePointer2, Trash2 } from 'lucide-react';

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
}

const Whiteboard: React.FC<WhiteboardProps> = ({ appIdentifier, roomUuid, roomToken, uid, isTeacher, region = 'eu' }) => {
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState('pencil');

    useEffect(() => {
        if (!whiteboardRef.current) return;

        // Advanced Sanitization: remove trailing comments (#) and whitespace
        const cleanAppId = appIdentifier.split('#')[0].trim();
        const cleanRoomUuid = roomUuid.split('#')[0].trim();
        const cleanRoomToken = roomToken.split('#')[0].trim();
        
        // Validate Region: fallback to 'eu' (Middle East) if invalid
        const supportedRegions = ['eu', 'us-sv', 'sg', 'cn-hz', 'in-mum'];
        const finalRegion = supportedRegions.includes(region.toLowerCase()) ? region.toLowerCase() : 'eu';

        // Validation to prevent SDK crash
        if (!cleanAppId || cleanAppId === "") {
            console.error("Whiteboard Error: Missing or invalid appIdentifier");
            setError("معرف التطبيق (App Identifier) مفقود أو غير صالح.");
            setLoading(false);
            return;
        }

        if (!cleanRoomUuid || !cleanRoomToken) {
            console.error("Whiteboard Error: Missing roomUuid or roomToken");
            setError("بيانات الغرفة غير مكتملة.");
            setLoading(false);
            return;
        }

        let roomInstance: Room | null = null;
        let sdk: WhiteWebSdk | null = null;

        try {
            // Logging for debug (masked)
            console.log(`Initializing Whiteboard with AppID: ${cleanAppId.substring(0, 8)}... and Region: ${finalRegion}`);
            
            sdk = new WhiteWebSdk({
                appIdentifier: cleanAppId,
                deviceType: DeviceType.Surface,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                region: finalRegion as any,
            });
        } catch (e: unknown) {
            console.error("WhiteWebSdk Init Error:", e);
            const message = e instanceof Error ? e.message : 'Unknown initialization error';
            setError(`فشل تهيئة SDK السبورة: ${message}. يرجى التحقق من معرف التطبيق والمنطقة.`);
            setLoading(false);
            return;
        }

        const joinRoom = async () => {
            try {
                if (!sdk) return;

                roomInstance = await sdk.joinRoom({
                    uuid: cleanRoomUuid,
                    roomToken: cleanRoomToken,
                    uid: uid,
                    isWritable: !!isTeacher,
                    useMultiViews: false,
                });

                setRoom(roomInstance);
                if (whiteboardRef.current) {
                    roomInstance.bindHtmlElement(whiteboardRef.current);
                }
                
                if (isTeacher) {
                    roomInstance.setMemberState({ currentApplianceName: ApplianceNames.pencil });
                } else {
                    roomInstance.setViewMode(ViewMode.Follower);
                }

                setLoading(false);
                setError(null);
            } catch (joinError: unknown) {
                console.error("Whiteboard join error:", joinError);
                const message = joinError instanceof Error ? joinError.message : 'خطأ غير معروف';
                setError(`فشل الانضمام للغرفة: ${message}`);
                setLoading(false);
            }
        };

        joinRoom();

        return () => {
            if (roomInstance) {
                roomInstance.disconnect();
            }
        };
    }, [appIdentifier, roomUuid, roomToken, uid, isTeacher, region]);

    const setTool = (tool: string) => {
        if (!room || !isTeacher) return;
        setActiveTool(tool);
        
        switch (tool) {
            case 'selector':
                room.setMemberState({ currentApplianceName: ApplianceNames.selector });
                break;
            case 'pencil':
                room.setMemberState({ currentApplianceName: ApplianceNames.pencil });
                break;
            case 'rectangle':
                room.setMemberState({ currentApplianceName: ApplianceNames.rectangle });
                break;
            case 'ellipse':
                room.setMemberState({ currentApplianceName: ApplianceNames.ellipse });
                break;
            case 'eraser':
                room.setMemberState({ currentApplianceName: ApplianceNames.eraser });
                break;
            case 'text':
                room.setMemberState({ currentApplianceName: ApplianceNames.text });
                break;
        }
    };

    const clearCanvas = () => {
        if (!room || !isTeacher) return;
        room.cleanCurrentScene();
    };

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl relative">
            {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
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

            {/* Toolbar (Only for Teachers) */}
            {isTeacher && (
                <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/10">
                    <ToolButton 
                        icon={<MousePointer2 size={20} />} 
                        active={activeTool === 'selector'} 
                        onClick={() => setTool('selector')} 
                        label="تحديد"
                    />
                    <ToolButton 
                        icon={<Pencil size={20} />} 
                        active={activeTool === 'pencil'} 
                        onClick={() => setTool('pencil')} 
                        label="قلم"
                    />
                    <ToolButton 
                        icon={<Square size={20} />} 
                        active={activeTool === 'rectangle'} 
                        onClick={() => setTool('rectangle')} 
                        label="مربع"
                    />
                    <ToolButton 
                        icon={<Circle size={20} />} 
                        active={activeTool === 'ellipse'} 
                        onClick={() => setTool('ellipse')} 
                        label="دائرة"
                    />
                    <ToolButton 
                        icon={<Type size={20} />} 
                        active={activeTool === 'text'} 
                        onClick={() => setTool('text')} 
                        label="نص"
                    />
                    <ToolButton 
                        icon={<Eraser size={20} />} 
                        active={activeTool === 'eraser'} 
                        onClick={() => setTool('eraser')} 
                        label="ممحاة"
                    />
                    <div className="w-full h-px bg-white/10 my-1" />
                    <ToolButton 
                        icon={<Trash2 size={20} />} 
                        onClick={clearCanvas} 
                        label="مسح الكل"
                        variant="danger"
                    />
                </div>
            )}

            {/* The Drawing Canvas - elevated with z-index and pointer-events-auto */}
            <div 
                ref={whiteboardRef} 
                className="flex-1 w-full h-full touch-none relative z-10 pointer-events-auto" 
                style={{ minHeight: '400px' }} 
            />
        </div>
    );
};

const ToolButton: React.FC<ToolButtonProps> = ({ icon, active, onClick, label, variant = 'primary' }) => (
    <button
        onClick={onClick}
        title={label}
        className={`p-2.5 rounded-xl transition-all duration-200 group relative ${
            active 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : variant === 'danger'
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        {icon}
        <span className="absolute right-full mr-3 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {label}
        </span>
    </button>
);

export default Whiteboard;
