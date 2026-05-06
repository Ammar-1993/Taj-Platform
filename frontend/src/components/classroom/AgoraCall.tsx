"use client";

import React from 'react';
import AgoraUIKit from 'agora-react-uikit';

type AgoraCallProps = {
  rtcProps: {
    appId: string;
    channel: string;
    token: string | null;
    uid: number;
    role: 'host' | 'audience';
    layout: number;
    disableRtm: boolean;
  };
  callbacks: {
    EndCall: () => void;
  };
};

export default function AgoraCall({ rtcProps, callbacks }: AgoraCallProps) {
    const styleProps = {
        videoMode: {
            max: 'contain' as const,
            min: 'cover' as const,
        },
        UIKitContainer: {
            height: '100%',
            width: '100%',
            backgroundColor: '#0f172a',
        },
        localBtnContainer: {
            backgroundColor: 'transparent',
            bottom: '20px',
        },
        maxViewContainer: {
            backgroundColor: '#0f172a',
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
            <AgoraUIKit 
                rtcProps={rtcProps} 
                callbacks={callbacks} 
                styleProps={styleProps}
            />
        </div>
    );
}