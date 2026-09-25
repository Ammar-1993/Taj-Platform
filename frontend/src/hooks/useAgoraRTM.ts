"use client";

import { useEffect, useRef, useCallback } from "react";
import AgoraRTM from "agora-rtm-sdk";

export type CursorMessage = {
    type: "cursor";
    x: number;
    y: number;
};

export type WhiteboardToggleMessage = {
    type: "whiteboard_toggle";
    show: boolean;
};

export type FocusModeToggleMessage = {
    type: "focus_mode_toggle";
    focus: boolean;
};

export type RTMMessage = CursorMessage | WhiteboardToggleMessage | FocusModeToggleMessage;

type UseAgoraRTMOptions = {
    appId: string;
    channel: string;
    uid: number | string;
    token: string | null;
    onMessageReceived: (uid: string, msg: RTMMessage) => void;
    onMemberLeft?: (uid: string) => void;
    enabled: boolean;
};

export function useAgoraRTM({
    appId,
    channel,
    uid,
    token,
    onMessageReceived,
    onMemberLeft,
    enabled,
}: UseAgoraRTMOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientRef = useRef<any>(null);
    const isConnectedRef = useRef(false);
    const pendingMessagesRef = useRef<RTMMessage[]>([]);

    // Using a ref for the callback so the effect doesn't re-run on every render
    const onMessageReceivedRef = useRef(onMessageReceived);
    const onMemberLeftRef = useRef(onMemberLeft);

    useEffect(() => {
        onMessageReceivedRef.current = onMessageReceived;
        onMemberLeftRef.current = onMemberLeft;
    }, [onMessageReceived, onMemberLeft]);

    useEffect(() => {
        if (!enabled || !appId || !channel) return;

        let client;
        try {
            // Initialize RTM v2 Client.
            // logLevel "none" (or 4) completely disables the SDK's internal logger, preventing
            // it from calling console.error() directly — which Next.js dev mode would
            // intercept and show as a red overlay even if we handle the error gracefully.
            // All meaningful errors are already caught and logged via our own catch blocks.
            client = new AgoraRTM.RTM(appId, String(uid), { logLevel: "none" });
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
                    const msg: RTMMessage = JSON.parse(event.message as string);
                    onMessageReceivedRef.current(event.publisher, msg);
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

        let isCancelled = false;
        let isLoggedIn = false;

        const connect = async () => {
            try {
                await client.login({ token: token ?? undefined });
                if (isCancelled) {
                    try { await client.logout(); } catch {}
                    return;
                }
                isLoggedIn = true;

                // Subscribe to the channel to receive messages AND presence events
                await client.subscribe(channel, { withMessage: true, withPresence: true });
                isConnectedRef.current = true;
                console.log("[RTM] Connected and subscribed to channel:", channel);

                // Flush pending messages queued while connecting
                while (pendingMessagesRef.current.length > 0) {
                    const nextMsg = pendingMessagesRef.current.shift();
                    if (nextMsg && clientRef.current) {
                        clientRef.current.publish(channel, JSON.stringify(nextMsg)).catch((e: unknown) => {
                            console.error("[RTM] Failed to flush queued message:", e);
                        });
                    }
                }
            } catch (error: unknown) {
                if (isCancelled) return; // Ignore expected cancellation during unmount

                const errStr = error instanceof Error ? error.message : String(error || "");
                if (errStr.includes("-10023") || errStr.includes("canceled by user")) {
                    // Login was cancelled during unmount or transition, safe to ignore
                    return;
                }
                if (errStr.includes("-10015") || errStr.includes("NOT_ENABLE_RTM")) {
                    console.warn("[RTM] Real-time messaging (RTM) is not enabled on this Agora App ID. Cursor sync disabled.");
                    return;
                }
                console.warn("[RTM] Connection attempt failed:", error);
            }
        };

        connect();

        return () => {
            isCancelled = true;
            isConnectedRef.current = false;
            pendingMessagesRef.current = [];
            const cleanup = async () => {
                clientRef.current = null; // Prevent publishes during teardown
                try {
                    if (isLoggedIn) {
                        await client.unsubscribe(channel).catch(() => {});
                        await client.logout().catch(() => {});
                    }
                } catch {
                    // Safe cleanup ignore
                }
            };
            cleanup();
        };
    }, [appId, channel, uid, token, enabled]);

    const sendCursorPosition = useCallback(
        (msg: Omit<CursorMessage, "type">) => {
            if (!enabled || !clientRef.current || !isConnectedRef.current) return;
            const payload = JSON.stringify({ type: "cursor", ...msg });
            
            clientRef.current.publish(channel, payload).catch((e: unknown) => {
                console.error("[RTM] Publish failed:", e);
            });
        },
        [enabled, channel]
    );

    const sendCustomMessage = useCallback(
        (msg: RTMMessage) => {
            if (!enabled) return;
            if (clientRef.current && isConnectedRef.current) {
                const payload = JSON.stringify(msg);
                clientRef.current.publish(channel, payload).catch((e: unknown) => {
                    console.error("[RTM] Publish failed:", e);
                });
            } else {
                pendingMessagesRef.current.push(msg);
            }
        },
        [enabled, channel]
    );

    return { sendCursorPosition, sendCustomMessage };
}
