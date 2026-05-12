"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface MicLevelMeterProps {
    stream: MediaStream | null;
    enabled: boolean;
}

export default function MicLevelMeter({ stream, enabled }: MicLevelMeterProps) {
    const [level, setLevel] = useState(0);
    const requestRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode>();

    useEffect(() => {
        if (!stream || !enabled) {
            setLevel(0);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Scale and smooth the level
            setLevel(Math.min(100, Math.floor((average / 128) * 100)));
            requestRef.current = requestAnimationFrame(updateLevel);
        };

        requestRef.current = requestAnimationFrame(updateLevel);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            audioContext.close();
        };
    }, [stream, enabled]);

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
