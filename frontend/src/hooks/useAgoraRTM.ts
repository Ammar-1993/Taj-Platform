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
    onMemberLeft?: (uid: string) => void;
    enabled: boolean;
};

export function useAgoraRTM({
    appId,
    channel,
    uid,
    token,
    onCursorReceived,
    onMemberLeft,
    enabled,
}: UseAgoraRTMOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientRef = useRef<any>(null);

    // Using a ref for the callback so the effect doesn't re-run on every render
    const onCursorReceivedRef = useRef(onCursorReceived);
    const onMemberLeftRef = useRef(onMemberLeft);

    useEffect(() => {
        onCursorReceivedRef.current = onCursorReceived;
        onMemberLeftRef.current = onMemberLeft;
    }, [onCursorReceived, onMemberLeft]);

    useEffect(() => {
        if (!enabled || !appId || !channel) return;

        let client;
        try {
            // Initialize RTM v2 Client
            client = new AgoraRTM.RTM(appId, String(uid));
            clientRef.current = client;
        } catch (error) {
            console.error("[RTM] Initialization failed (check NEXT_PUBLIC_AGORA_APP_ID):", error);
            return;
        }

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

        // Listen for presence events to detect when members leave
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        client.addEventListener("presence", (event: any) => {
            if (event.channelType === "MESSAGE" && event.channelName === channel) {
                if (event.eventType === "REMOTE_LEAVE" || event.eventType === "REMOTE_TIMEOUT") {
                    if (onMemberLeftRef.current) {
                        onMemberLeftRef.current(event.publisher);
                    }
                }
            }
        });

        const connect = async () => {
            try {
                await client.login({ token: token ?? undefined });
                // Subscribe to the channel to receive messages AND presence events
                await client.subscribe(channel, { withMessage: true, withPresence: true });
                console.log("[RTM] Connected and subscribed to channel:", channel);
            } catch (error) {
                console.error("[RTM] Connection failed:", error);
            }
        };

        connect();

        return () => {
            const cleanup = async () => {
                clientRef.current = null; // Prevent publishes during teardown
                try {
                    await client.unsubscribe(channel);
                    await client.logout();
                } catch (e) {
                    console.error("[RTM] Cleanup error:", e);
                }
            };
            cleanup();
        };
    }, [appId, channel, uid, token, enabled]);

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
