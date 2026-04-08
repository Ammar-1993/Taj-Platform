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
    return (
        <div className="w-full h-full flex items-center justify-center">
            <AgoraUIKit rtcProps={rtcProps} callbacks={callbacks} />
        </div>
    );
}