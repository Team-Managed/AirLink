"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  SessionConnectedSchema,
  AgentStreamSchema,
  ApprovalRequestSchema,
  StreamBatchSchema,
  StandardErrorSchema,
  type SessionConnected,
  type ApprovalRequest,
  type BYOKConfig,
} from "@airlink/protocol";
import type { WebFeedItem, UseWebSessionOptions, UseWebSessionReturn } from "../types";

/**
 * Pure helper to append or merge stream chunks into feed items.
 * Can be tested in isolation.
 */
export function aggregateFeedItem(prevItems: WebFeedItem[], incoming: WebFeedItem): WebFeedItem[] {
  const lastItem = prevItems[prevItems.length - 1];
  if (
    incoming.type === "token" &&
    lastItem &&
    lastItem.type === "token" &&
    lastItem.role !== "user" &&
    incoming.role !== "user"
  ) {
    const updated = [...prevItems];
    updated[updated.length - 1] = {
      ...lastItem,
      content: lastItem.content + incoming.content,
      timestamp: incoming.timestamp,
    };
    return updated;
  }

  return [...prevItems, incoming];
}

/**
 * Pure helper to integrate a replayed batch of missed events.
 */
export function mergeBatchEvents(
  prevItems: WebFeedItem[],
  batchEvents: Array<{
    seqId: number;
    type: WebFeedItem["type"];
    content: string;
    metadata?: WebFeedItem["metadata"];
    timestamp: number;
  }>,
): WebFeedItem[] {
  const existingSeqs = new Set(prevItems.map((i) => i.seqId).filter((s) => s > 0));
  const newItems: WebFeedItem[] = [];

  for (const event of batchEvents) {
    if (!existingSeqs.has(event.seqId)) {
      newItems.push({
        id: `batch_${event.seqId}_${event.timestamp}`,
        seqId: event.seqId,
        type: event.type,
        content: event.content,
        role: "agent",
        metadata: event.metadata,
        timestamp: event.timestamp,
      });
    }
  }

  return [...prevItems, ...newItems];
}

/**
 * Custom hook encapsulating real-time Socket.io communication,
 * stream aggregation, human-in-the-loop approvals, and BYOK routing for the Web client.
 */
export function useWebSession(options: UseWebSessionOptions = {}): UseWebSessionReturn {
  const defaultRelay =
    options.initialRelayUrl ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_RELAY_URL : undefined) ||
    "http://localhost:3001";

  const [pin, setPin] = useState<string>(options.initialPin || "");
  const [relayUrl, setRelayUrl] = useState<string>(defaultRelay);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [reconnectToast, setReconnectToast] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<SessionConnected | null>(null);
  const [feedItems, setFeedItems] = useState<WebFeedItem[]>([]);
  const [activeApproval, setActiveApproval] = useState<ApprovalRequest | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // BYOK state
  const [provider, setProvider] = useState<string>("openrouter");
  const [model, setModel] = useState<string>("0x-alpha");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const lastSeqIdRef = useRef<number>(0);
  const activeSessionPinRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setErrorBanner(null);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsStreaming(false);
    setSessionData(null);
    setActiveApproval(null);
    setFeedItems([]);
    lastSeqIdRef.current = 0;
    activeSessionPinRef.current = null;
  }, []);

  const connect = useCallback(
    (pinToUse?: string) => {
      const targetPin = (pinToUse || pin).trim();
      if (targetPin.length !== 6) return;

      // If pairing with a different PIN or starting fresh, reset feed and sequence cursor
      if (activeSessionPinRef.current !== targetPin) {
        setFeedItems([]);
        lastSeqIdRef.current = 0;
        activeSessionPinRef.current = targetPin;
      }

      setIsConnecting(true);
      setErrorBanner(null);

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io(relayUrl, {
        transports: ["websocket", "polling"],
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("client:join", {
          pin: targetPin,
          clientName: "Agent Remote Web Client",
        });
      });

      socket.on("connect_error", (err: Error) => {
        setIsConnecting(false);
        setErrorBanner(`Relay connection failed: ${err.message || "Transport error"}`);
      });

      socket.on("session:connected", (rawPayload: unknown) => {
        const parsed = SessionConnectedSchema.safeParse(rawPayload);
        if (parsed.success) {
          if (parsed.data.status === "disconnected") {
            setIsConnected(false);
            setIsStreaming(false);
            setSessionData(null);
            setErrorBanner("Workstation host disconnected from session.");
            return;
          }

          setIsConnecting(false);
          setIsConnected(true);
          setSessionData(parsed.data);
          setReconnectToast("Paired with Workstation Bridge!");
          setTimeout(() => setReconnectToast(null), 2500);

          // Catch up missed stream events since lastSeenSeq
          socket.emit("client:sync", {
            sessionId: parsed.data.sessionId,
            lastSeenSeq: lastSeqIdRef.current,
          });
        }
      });

      socket.on("agent:stream", (rawPayload: unknown) => {
        const parsed = AgentStreamSchema.safeParse(rawPayload);
        if (!parsed.success) return;

        const payload = parsed.data;
        lastSeqIdRef.current = Math.max(lastSeqIdRef.current, payload.seqId);
        setIsStreaming(true);

        if (payload.type === "done") {
          setIsStreaming(false);
        }

        const incomingItem: WebFeedItem = {
          id: `stream_${payload.seqId}_${Date.now()}`,
          seqId: payload.seqId,
          type: payload.type,
          content: payload.content,
          role: "agent",
          metadata: payload.metadata,
          timestamp: payload.timestamp,
        };

        setFeedItems((prev) => aggregateFeedItem(prev, incomingItem));
      });

      socket.on("agent:approval_required", (rawPayload: unknown) => {
        const parsed = ApprovalRequestSchema.safeParse(rawPayload);
        if (parsed.success) {
          setActiveApproval(parsed.data);
        }
      });

      socket.on("agent:stream_batch", (rawPayload: unknown) => {
        const parsed = StreamBatchSchema.safeParse(rawPayload);
        if (!parsed.success) return;

        for (const ev of parsed.data.events) {
          lastSeqIdRef.current = Math.max(lastSeqIdRef.current, ev.seqId);
        }

        setFeedItems((prev) => mergeBatchEvents(prev, parsed.data.events));
      });

      socket.on("session:error", (rawPayload: unknown) => {
        const parsed = StandardErrorSchema.safeParse(rawPayload);
        const msg = parsed.success ? parsed.data.message : "Relay connection error";
        setErrorBanner(`[Error]: ${msg}`);
        setIsConnecting(false);
      });

      socket.on("disconnect", () => {
        setIsStreaming(false);
        setIsConnected(false);
        setErrorBanner("Disconnected from Relay server.");
      });
    },
    [pin, relayUrl],
  );

  const sendPrompt = useCallback(
    (promptText: string) => {
      const text = promptText.trim();
      if (!text || isStreaming || !socketRef.current) return;

      setErrorBanner(null);
      setIsStreaming(true);

      const userPromptItem: WebFeedItem = {
        id: `prompt_${Date.now()}`,
        seqId: 0,
        type: "token",
        content: `> ${text}`,
        role: "user",
        timestamp: Date.now(),
      };
      setFeedItems((prev) => [...prev, userPromptItem]);

      const byokPayload: BYOKConfig | undefined = apiKey
        ? {
            provider: provider as BYOKConfig["provider"],
            model,
            apiKey,
          }
        : undefined;

      socketRef.current.emit("client:prompt", {
        sessionId: sessionData?.sessionId || "active",
        prompt: text,
        byokConfig: byokPayload,
      });
    },
    [apiKey, provider, model, sessionData],
  );

  const approve = useCallback(
    (approvalId: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit("client:approval_response", {
        approvalId,
        sessionId: sessionData?.sessionId || "active",
        approved: true,
      });
      setActiveApproval(null);
    },
    [sessionData],
  );

  const deny = useCallback(
    (approvalId: string, reason = "Rejected by developer on web client") => {
      if (!socketRef.current) return;
      socketRef.current.emit("client:approval_response", {
        approvalId,
        sessionId: sessionData?.sessionId || "active",
        approved: false,
        reason,
      });
      setActiveApproval(null);
    },
    [sessionData],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    pin,
    relayUrl,
    isConnecting,
    isConnected,
    errorBanner,
    reconnectToast,
    sessionData,
    feedItems,
    activeApproval,
    isStreaming,
    provider,
    model,
    apiKey,
    showApiKey,
    setPin,
    setRelayUrl,
    setProvider,
    setModel,
    setApiKey,
    setShowApiKey,
    connect,
    disconnect,
    sendPrompt,
    approve,
    deny,
    clearError,
  };
}
