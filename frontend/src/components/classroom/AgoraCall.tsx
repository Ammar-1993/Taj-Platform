"use client";

import React from 'react';
import AgoraUIKit from 'agora-react-uikit';

export default function AgoraCall({ rtcProps, callbacks }: { rtcProps: any, callbacks: any }) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
        </div>
    );
}