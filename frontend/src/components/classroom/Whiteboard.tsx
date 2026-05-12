"use client";

import "regenerator-runtime/runtime";
import React, { useEffect, useRef, useState } from 'react';
import { WhiteWebSdk, Room, DeviceType, ViewMode } from "white-web-sdk";
import { WindowManager } from "@netless/window-manager";
import "@netless/window-manager/dist/style.css";
import { Loader2, Pencil, Eraser, Square, Circle, Type, MousePointer2, Trash2 } from 'lucide-react';

interface WhiteboardProps {
    appIdentifier: string;
    roomUuid: string;
    roomToken: string;
    isTeacher: boolean;
}

interface ToolButtonProps {
    icon: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    label: string;
    variant?: 'primary' | 'danger';
}

const Whiteboard: React.FC<WhiteboardProps> = ({ appIdentifier, roomUuid, roomToken, isTeacher }) => {
    const whiteboardRef = useRef<HTMLDivElement>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTool, setActiveTool] = useState('pencil');

    useEffect(() => {
        if (!whiteboardRef.current) return;

        const sdk = new WhiteWebSdk({
            appIdentifier: appIdentifier,
            deviceType: DeviceType.Surface,
        });

        let roomInstance: Room | null = null;

        const joinRoom = async () => {
            try {
                roomInstance = await sdk.joinRoom({
                    uuid: roomUuid,
                    roomToken: roomToken,
                    isWritable: isTeacher, // Only teachers can draw by default
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    invisiblePlugins: [WindowManager as any],
                    useMultiViews: true,
                });

                setRoom(roomInstance);
                if (whiteboardRef.current) {
                    roomInstance.bindHtmlElement(whiteboardRef.current);
                }
                
                if (isTeacher) {
                    roomInstance.setMemberState({ currentApplianceName: "pencil" });
                } else {
                    roomInstance.setViewMode(ViewMode.Follower);
                }

                setLoading(false);
            } catch (error) {
                console.error("Whiteboard join error:", error);
                setLoading(false);
            }
        };

        joinRoom();

        return () => {
            if (roomInstance) {
                roomInstance.disconnect();
            }
        };
    }, [appIdentifier, roomUuid, roomToken, isTeacher]);

    const setTool = (tool: string) => {
        if (!room || !isTeacher) return;
        setActiveTool(tool);
        
        switch (tool) {
            case 'selector':
                room.setMemberState({ currentApplianceName: "selector" });
                break;
            case 'pencil':
                room.setMemberState({ currentApplianceName: "pencil" });
                break;
            case 'rectangle':
                room.setMemberState({ currentApplianceName: "rectangle" });
                break;
            case 'ellipse':
                room.setMemberState({ currentApplianceName: "ellipse" });
                break;
            case 'eraser':
                room.setMemberState({ currentApplianceName: "eraser" });
                break;
            case 'text':
                room.setMemberState({ currentApplianceName: "text" });
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

            {/* The Drawing Canvas */}
            <div ref={whiteboardRef} className="flex-1 w-full h-full touch-none" style={{ minHeight: '400px' }} />
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
