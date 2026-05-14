"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GripHorizontal } from 'lucide-react';

interface FloatingVideoWidgetProps {
    focusMode: boolean;
    children: React.ReactNode;
}

const WIDGET_W = 272;
const WIDGET_H = 200;
const DOCK_H   = 90;
const HEADER_H = 72;
const PAD      = 16;

/**
 * SINGLE RETURN — children are NEVER unmounted when focusMode changes.
 * Only CSS classes / inline styles switch, so AgoraCall keeps its RTC
 * connection alive throughout the whiteboard focus-mode transition.
 */
export default function FloatingVideoWidget({ focusMode, children }: FloatingVideoWidgetProps) {
    const [pos, setPos]   = useState({ x: 0, y: 0 });
    const dragging        = useRef(false);
    const startOffset     = useRef({ x: 0, y: 0 });
    const initialized     = useRef(false);

    // Place widget at top-right on first focus-mode activation
    useEffect(() => {
        if (focusMode && !initialized.current) {
            setPos({
                x: window.innerWidth - WIDGET_W - PAD,
                y: HEADER_H + PAD,
            });
            initialized.current = true;
        }
        if (!focusMode) initialized.current = false;
    }, [focusMode]);

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
            setPos({
                x: Math.max(PAD, Math.min(window.innerWidth  - WIDGET_W - PAD, e.clientX - startOffset.current.x)),
                y: Math.max(PAD, Math.min(window.innerHeight - WIDGET_H - DOCK_H - PAD, e.clientY - startOffset.current.y)),
            });
        };
        const onUp = () => { dragging.current = false; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup',   onUp);
        };
    }, [focusMode]);

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
            setPos({
                x: Math.max(PAD, Math.min(window.innerWidth  - WIDGET_W - PAD, t.clientX - startOffset.current.x)),
                y: Math.max(PAD, Math.min(window.innerHeight - WIDGET_H - DOCK_H - PAD, t.clientY - startOffset.current.y)),
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
    }, [focusMode]);

    // ─── SINGLE RETURN — same DOM node, only CSS changes ──────────────────
    return (
        <div
            className={`absolute overflow-hidden ${
                focusMode
                    ? 'z-30 rounded-2xl border border-white/10 shadow-2xl bg-black cursor-grab active:cursor-grabbing select-none'
                    : 'inset-0 z-10 rounded-3xl bg-black border border-white/5 shadow-2xl'
            }`}
            style={focusMode ? {
                width:     WIDGET_W,
                height:    WIDGET_H,
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
            {/* Drag handle — only visible in focus mode */}
            {focusMode && (
                <div className="absolute top-0 left-0 right-0 h-7 z-10 flex items-center justify-center bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                    <GripHorizontal className="w-4 h-4 text-white/30" />
                </div>
            )}

            {/* Video content — always in same DOM position */}
            <div className="w-full h-full">
                {children}
            </div>

            {/* Focus mode badge */}
            {focusMode && (
                <div className="absolute bottom-1.5 left-2 z-10 bg-blue-600/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold text-white tracking-wide pointer-events-none">
                    وضع التركيز
                </div>
            )}
        </div>
    );
}
