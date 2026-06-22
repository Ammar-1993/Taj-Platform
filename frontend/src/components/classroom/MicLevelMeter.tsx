"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface MicLevelMeterProps {
    stream: MediaStream | null;
    enabled: boolean;
}

export default function MicLevelMeter({ stream, enabled }: MicLevelMeterProps) {
    const [level, setLevel] = useState(0);

    // Persistent refs for the audio graph — shared across enabled/disabled cycles
    // so toggling the mic never recreates the AudioContext.
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef     = useRef<AnalyserNode | null>(null);
    const rafRef          = useRef<number>(0);
    const dataArrayRef    = useRef<Uint8Array<ArrayBuffer> | null>(null);

    // ── Effect 1: Build/destroy the audio graph when the stream changes ──────
    // This is the ONLY place an AudioContext is created. Toggling `enabled`
    // will NOT trigger this effect, so the browser 6-context limit is safe.
    useEffect(() => {
        if (!stream) {
            setLevel(0);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const ctx      = new AudioCtx();
        const source   = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = ctx;
        analyserRef.current     = analyser;
        dataArrayRef.current    = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

        return () => {
            // Cancel any running animation frame before closing the context
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
            setLevel(0);

            // AudioContext.close() is async — we don't need to await it here.
            // It suspends all associated audio processing and releases hardware.
            void ctx.close().catch(() => {/* ignore close errors on teardown */});
            audioContextRef.current = null;
            analyserRef.current     = null;
            dataArrayRef.current    = null;
        };
    }, [stream]);

    // ── Effect 2: Start/stop the rAF loop when `enabled` changes ─────────────
    // The audio graph built above remains alive; we just control whether we
    // read from it and update the level state.
    useEffect(() => {
        if (!enabled) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
            setLevel(0);
            return;
        }

        const tick = () => {
            const analyser  = analyserRef.current;
            const dataArray = dataArrayRef.current;
            if (!analyser || !dataArray) return;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            const len = dataArray.length;
            for (let i = 0; i < len; i++) sum += dataArray[i];

            setLevel(Math.min(100, Math.floor((sum / len / 128) * 100)));
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        };
    }, [enabled]);

    return (
        <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
            <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    {enabled ? <Mic className="w-3 h-3 text-emerald-500" /> : <MicOff className="w-3 h-3 text-red-500" />}
                    اختبار الميكروفون
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{level}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div
                    className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-400 rounded-full transition-all duration-75 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    style={{ width: `${level}%` }}
                />
            </div>
            {enabled && level > 0 && (
                <p className="text-[10px] text-emerald-500 animate-pulse font-medium">صوتك مسموع بوضوح الآن ✅</p>
            )}
            {enabled && level === 0 && (
                <p className="text-[10px] text-slate-500 font-medium">تحدث للتأكد من الميكروفون...</p>
            )}
        </div>
    );
}
