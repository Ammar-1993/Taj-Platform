"use client";

import { useEffect, useRef, useCallback } from "react";
import AgoraRTM from "agora-rtm-sdk";

export type CursorMessage = {
    type: "cursor";
    x: number;
    y: number;
};

type UseAgoraRTMOptions = {
    appId: string;
    channel: string;
    uid: number | string;
    token: string | null;
    onCursorReceived: (uid: string, msg: CursorMessage) => void;
    enabled: boolean;
};

export function useAgoraRTM({
    appId,
    channel,
    uid,
    token,
    onCursorReceived,
    enabled,
}: UseAgoraRTMOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientRef = useRef<any>(null);

    // Using a ref for the callback so the effect doesn't re-run on every render
    const onCursorReceivedRef = useRef(onCursorReceived);
    useEffect(() => {
        onCursorReceivedRef.current = onCursorReceived;
    }, [onCursorReceived]);

    useEffect(() => {
        if (!appId || !channel) return;

        // Initialize RTM v2 Client
        const client = new AgoraRTM.RTM(appId, String(uid));
        clientRef.current = client;

        // Listen for messages on any subscribed channel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.addEventListener("message", (event: any) => {
            if (event.channelType === "MESSAGE" && event.channelName === channel) {
                try {
                    const msg: CursorMessage = JSON.parse(event.message as string);
                    if (msg.type === "cursor") {
                        onCursorReceivedRef.current(event.publisher, msg);
                    }
                } catch {
                    // Ignore malformed messages
                }
            }
        });

        const connect = async () => {
            try {
                await client.login({ token: token ?? undefined });
                // Subscribe to the channel to receive messages
                await client.subscribe(channel);
                console.log("[RTM] Connected and subscribed to channel:", channel);
            } catch (error) {
                console.error("[RTM] Connection failed:", error);
            }
        };

        connect();

        return () => {
            const cleanup = async () => {
                try {
                    await client.unsubscribe(channel);
                    await client.logout();
                } catch (e) {
                    console.error("[RTM] Cleanup error:", e);
                }
            };
            cleanup();
        };
    }, [appId, channel, uid, token]);

    const sendCursorPosition = useCallback(
        (msg: Omit<CursorMessage, "type">) => {
            if (!enabled || !clientRef.current) return;
            const payload = JSON.stringify({ type: "cursor", ...msg });
            
            clientRef.current.publish(channel, payload).catch((e: unknown) => {
                console.error("[RTM] Publish failed:", e);
            });
        },
        [enabled, channel]
    );

    return { sendCursorPosition };
}
