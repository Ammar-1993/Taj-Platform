"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GripHorizontal, Minus, Maximize2 } from 'lucide-react';

interface FloatingVideoWidgetProps {
    focusMode: boolean;
    children: React.ReactNode;
}

const WIDGET_W  = 272;
const WIDGET_H  = 200;
const TITLE_H   = 36;   // height when collapsed — just the drag handle bar
const DOCK_H    = 90;
const PAD       = 16;

/**
 * SINGLE RETURN — children are NEVER unmounted.
 * focusMode=false → fills parent container (normal AgoraCall view).
 * focusMode=true  → draggable floating widget that can be collapsed to a title-bar.
 */
export default function FloatingVideoWidget({ focusMode, children }: FloatingVideoWidgetProps) {
    const [pos, setPos]         = useState({ x: 0, y: 0 });
    const [collapsed, setCollapsed] = useState(false);
    const dragging              = useRef(false);
    const startOffset           = useRef({ x: 0, y: 0 });
    const initialized           = useRef(false);

    // Place widget at top-right when focus mode activates; reset collapse state
    useEffect(() => {
        if (focusMode && !initialized.current) {
            setPos({
                x: PAD,                                                         // left edge
                y: window.innerHeight - WIDGET_H - DOCK_H - PAD,              // above dock
            });
            initialized.current = true;
        }
        if (!focusMode) {
            initialized.current = false;
            setCollapsed(false); // always start expanded when re-entering focus mode
        }
    }, [focusMode]);

    // ── Mouse drag ──────────────────────────────────────────────────────────
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!focusMode) return;
        dragging.current = true;
        startOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        e.preventDefault();
        e.stopPropagation();
    }, [focusMode, pos]);

    useEffect(() => {
        if (!focusMode) return;
        const onMove = (e: MouseEvent) => {
            if (!dragging.current) return;
            const currentH = collapsed ? TITLE_H : WIDGET_H;
            setPos({
                x: Math.max(PAD, Math.min(window.innerWidth  - WIDGET_W - PAD, e.clientX - startOffset.current.x)),
                y: Math.max(PAD, Math.min(window.innerHeight - currentH  - DOCK_H - PAD, e.clientY - startOffset.current.y)),
            });
        };
        const onUp = () => { dragging.current = false; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup',   onUp);
        };
    }, [focusMode, collapsed]);

    // ── Touch drag ──────────────────────────────────────────────────────────
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!focusMode) return;
        const t = e.touches[0];
        dragging.current = true;
        startOffset.current = { x: t.clientX - pos.x, y: t.clientY - pos.y };
        e.stopPropagation();
    }, [focusMode, pos]);

    useEffect(() => {
        if (!focusMode) return;
        const onTouchMove = (e: TouchEvent) => {
            if (!dragging.current) return;
            const t = e.touches[0];
            const currentH = collapsed ? TITLE_H : WIDGET_H;
            setPos({
                x: Math.max(PAD, Math.min(window.innerWidth  - WIDGET_W - PAD, t.clientX - startOffset.current.x)),
                y: Math.max(PAD, Math.min(window.innerHeight - currentH  - DOCK_H - PAD, t.clientY - startOffset.current.y)),
            });
            e.stopPropagation();
            e.preventDefault();
        };
        const onTouchEnd = () => { dragging.current = false; };
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend',  onTouchEnd);
        return () => {
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend',  onTouchEnd);
        };
    }, [focusMode, collapsed]);

    // ── 4.1: Window resize auto-clamp ────────────────────────────────────────
    useEffect(() => {
        if (!focusMode) return;
        const clamp = () => {
            const currentH = collapsed ? TITLE_H : WIDGET_H;
            setPos(prev => ({
                x: Math.max(PAD, Math.min(window.innerWidth  - WIDGET_W - PAD, prev.x)),
                y: Math.max(PAD, Math.min(window.innerHeight - currentH  - DOCK_H - PAD, prev.y)),
            }));
        };
        window.addEventListener('resize', clamp);
        return () => window.removeEventListener('resize', clamp);
    }, [focusMode, collapsed]);

    const toggleCollapse = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsed(prev => !prev);
    }, []);

    // ── SINGLE RETURN ────────────────────────────────────────────────────────
    return (
        <div
            className={`absolute overflow-hidden transition-[height] duration-300 ease-in-out ${
                focusMode
                    ? 'z-30 rounded-2xl border border-white/10 shadow-2xl bg-black cursor-grab active:cursor-grabbing select-none'
                    : 'inset-0 z-10 rounded-3xl bg-black border border-white/5 shadow-2xl'
            }`}
            style={focusMode ? {
                width:     WIDGET_W,
                height:    collapsed ? TITLE_H : WIDGET_H,
                top:       0,
                left:      0,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
            } : undefined}
            onMouseDown={handleMouseDown}
            onMouseMove={focusMode ? (e) => e.stopPropagation() : undefined}
            onMouseUp={  focusMode ? (e) => e.stopPropagation() : undefined}
            onClick={    focusMode ? (e) => e.stopPropagation() : undefined}
            onPointerDown={focusMode ? (e) => e.stopPropagation() : undefined}
            onTouchStart={handleTouchStart}
        >
            {/* ── Drag handle bar (focus mode only) ── */}
            {focusMode && (
                <div className="absolute top-0 left-0 right-0 h-9 z-10 flex items-center justify-between px-2 bg-gradient-to-b from-black/80 to-transparent">
                    {/* Grip icon */}
                    <GripHorizontal className="w-4 h-4 text-white/30 flex-shrink-0" />

                    {/* Collapse / Expand button */}
                    <button
                        onClick={toggleCollapse}
                        title={collapsed ? 'عرض الفيديو' : 'إخفاء الفيديو'}
                        className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        {collapsed
                            ? <Maximize2 className="w-3.5 h-3.5" />
                            : <Minus     className="w-3.5 h-3.5" />
                        }
                    </button>
                </div>
            )}

            {/* ── Video content ─────────────────────────────────────────────
             *  opacity controls visibility; dimensions stay full so Agora SDK
             *  keeps its track alive.  overflow-hidden on the parent clips the
             *  content visually when collapsed without unmounting AgoraCall.
             */}
            <div className={`absolute inset-0 top-9 transition-opacity duration-300 ${
                focusMode && collapsed ? 'opacity-0' : 'opacity-100'
            }`}>
                {children}
            </div>

            {/* Focus-mode label (shown only when expanded) */}
            {focusMode && !collapsed && (
                <div className="absolute bottom-1.5 left-2 z-10 bg-blue-600/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold text-white tracking-wide pointer-events-none">
                    وضع التركيز
                </div>
            )}
        </div>
    );
}
