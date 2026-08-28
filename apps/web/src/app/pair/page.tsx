"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
  type ToolMetadata,
  type StreamEventType,
} from "@agent-remote/protocol";

interface WebFeedItem {
  id: string;
  seqId: number;
  type: StreamEventType;
  content: string;
  role?: "user" | "agent" | undefined;
  metadata?: ToolMetadata | undefined;
  timestamp: number;
}

function WebPairClient() {
  const searchParams = useSearchParams();
  const initialPin = searchParams.get("pin") || "";
  const initialRelay = searchParams.get("relay") || "http://localhost:3001";

  const [pin, setPin] = useState<string>(initialPin);
  const [relayUrl, setRelayUrl] = useState<string>(initialRelay);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [reconnectToast, setReconnectToast] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<SessionConnected | null>(null);
  const [feedItems, setFeedItems] = useState<WebFeedItem[]>([]);
  const [activeApproval, setActiveApproval] = useState<ApprovalRequest | null>(null);
  const [promptInput, setPromptInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // BYOK Settings
  const [provider, setProvider] = useState<string>("openrouter");
  const [model, setModel] = useState<string>("0x-alpha");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const lastSeqIdRef = useRef<number>(0);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll feed
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feedItems, isStreaming]);

  // Connect via Socket.io
  const handleConnect = (pinToUse: string) => {
    const cleanPin = pinToUse.trim();
    if (cleanPin.length !== 6) return;

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
        pin: cleanPin,
        clientName: "Agent Remote Web Client",
      });
    });

    socket.on("session:connected", (rawPayload: unknown) => {
      const parsed = SessionConnectedSchema.safeParse(rawPayload);
      if (parsed.success) {
        setIsConnecting(false);
        setIsConnected(true);
        setSessionData(parsed.data);
        setReconnectToast("Paired with Workstation Bridge!");
        setTimeout(() => setReconnectToast(null), 2500);
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

      setFeedItems((prev) => {
        const lastItem = prev[prev.length - 1];
        if (
          payload.type === "token" &&
          lastItem &&
          lastItem.type === "token" &&
          lastItem.role !== "user"
        ) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastItem,
            content: lastItem.content + payload.content,
            timestamp: payload.timestamp,
          };
          return updated;
        }

        return [
          ...prev,
          {
            id: `stream_${payload.seqId}_${Date.now()}`,
            seqId: payload.seqId,
            type: payload.type,
            content: payload.content,
            role: "agent",
            metadata: payload.metadata,
            timestamp: payload.timestamp,
          },
        ];
      });
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

      setFeedItems((prev) => {
        const existingSeqs = new Set(prev.map((i) => i.seqId).filter((s) => s > 0));
        const newItems: WebFeedItem[] = [];
        for (const event of parsed.data.events) {
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
            lastSeqIdRef.current = Math.max(lastSeqIdRef.current, event.seqId);
          }
        }
        return [...prev, ...newItems];
      });
    });

    socket.on("session:error", (rawPayload: unknown) => {
      const parsed = StandardErrorSchema.safeParse(rawPayload);
      const msg = parsed.success ? parsed.data.message : "Relay connection error";
      setErrorBanner(`Error: ${msg}`);
      setIsConnecting(false);
    });

    socket.on("disconnect", () => {
      setIsStreaming(false);
      setIsConnected(false);
      setErrorBanner("Disconnected from Relay server.");
    });
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsConnected(false);
    setIsConnecting(false);
    setSessionData(null);
    setFeedItems([]);
  };

  const handleSendPrompt = (customPrompt?: string) => {
    const textToSend = customPrompt || promptInput;
    if (!textToSend.trim() || !socketRef.current) return;

    setErrorBanner(null);
    setIsStreaming(true);

    const userPromptItem: WebFeedItem = {
      id: `prompt_${Date.now()}`,
      seqId: 0,
      type: "token",
      content: `> ${textToSend}`,
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
      prompt: textToSend,
      byokConfig: byokPayload,
    });

    setPromptInput("");
  };

  const handleApprove = (approvalId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("client:approval_response", {
      approvalId,
      sessionId: sessionData?.sessionId || "active",
      approved: true,
    });
    setActiveApproval(null);
  };

  const handleDeny = (approvalId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit("client:approval_response", {
      approvalId,
      sessionId: sessionData?.sessionId || "active",
      approved: false,
      reason: "Rejected by developer on web client",
    });
    setActiveApproval(null);
  };

  // Quick Action Pills
  const quickActions = [
    {
      label: "Create PR",
      prompt: "Create a descriptive pull request summarizing our recent changes",
    },
    { label: "Import Issue", prompt: "Inspect open GitHub issues and identify top priority tasks" },
    { label: "Run Tests", prompt: "Run all Vitest test suites and report any failures" },
    { label: "Git Status", prompt: "Run git status and report modified or untracked files" },
    { label: "Fix Lint", prompt: "Run eslint and format code with prettier" },
    { label: "Rollback", prompt: "Revert the last uncommitted changes safely" },
  ];

  return (
    <div style={styles.webContainer}>
      {/* Top Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link href="/" style={styles.backLink}>
            [Home]
          </Link>
          <div style={styles.brandGroup}>
            <span style={styles.brandTitle}>AGENT REMOTE WEB</span>
          </div>
          {isConnected && (
            <span style={styles.connectedBadge}>
              Connected: {sessionData?.deviceName || "Workstation"} (
              {sessionData?.workspacePath?.split("/").pop() || "workspace"})
            </span>
          )}
        </div>

        <div style={styles.headerRight}>
          <button style={styles.settingsBtn} onClick={() => setShowSettings(!showSettings)}>
            BYOK Settings
          </button>
          {isConnected && (
            <button style={styles.disconnectBtn} onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* Notifications */}
      {reconnectToast && (
        <div style={styles.toastBanner}>
          <span>{reconnectToast}</span>
        </div>
      )}
      {errorBanner && (
        <div style={styles.errorBanner}>
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.settingsOverlay}>
          <div style={styles.settingsCard}>
            <div style={styles.settingsHeader}>
              <h3>BYOK Model Configuration</h3>
              <button style={styles.closeBtn} onClick={() => setShowSettings(false)}>
                Close
              </button>
            </div>
            <p style={styles.settingsSubtitle}>
              Bring Your Own Key credentials are kept strictly in-browser memory and sent per turn.
            </p>

            <div style={styles.formGroup}>
              <label style={styles.label}>AI Provider</label>
              <div style={styles.pillRow}>
                {["openrouter", "gemini", "anthropic", "openai", "groq", "custom"].map((p) => (
                  <button
                    key={p}
                    style={{
                      ...styles.providerPill,
                      ...(provider === p ? styles.providerPillActive : {}),
                    }}
                    onClick={() => setProvider(p)}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Active Model Identifier</label>
              <input
                type="text"
                style={styles.input}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. 0x-alpha, deepseek/deepseek-r1, claude-3-5-sonnet"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>API Key</label>
              <div style={styles.inputWithBtn}>
                <input
                  type={showApiKey ? "text" : "password"}
                  style={styles.input}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-... or provider key"
                />
                <button
                  type="button"
                  style={styles.toggleKeyBtn}
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button style={styles.saveSettingsBtn} onClick={() => setShowSettings(false)}>
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Pairing View vs Live Session View */}
      {!isConnected ? (
        <div style={styles.pairingContainer}>
          <div style={styles.pairingCard}>
            <div style={styles.pairingIconBadge}>PIN</div>
            <h2 style={styles.pairingTitle}>Pair with Workstation Host</h2>
            <p style={styles.pairingSubtitle}>
              Enter the 6-digit PIN displayed on your terminal or VS Code extension.
            </p>

            <div style={styles.pinInputWrapper}>
              <input
                type="text"
                maxLength={6}
                style={styles.pinInput}
                value={pin}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6);
                  setPin(sanitized);
                  if (sanitized.length === 6) {
                    handleConnect(sanitized);
                  }
                }}
                placeholder="------"
                autoFocus
              />
            </div>

            <button
              style={{
                ...styles.connectBtn,
                ...(pin.length === 6 ? styles.connectBtnActive : {}),
              }}
              disabled={pin.length !== 6 || isConnecting}
              onClick={() => handleConnect(pin)}
            >
              {isConnecting ? "Connecting to Relay..." : "Connect to PC"}
            </button>

            <div style={styles.relayRow}>
              <label style={styles.relayLabel}>Relay URL:</label>
              <input
                type="text"
                style={styles.relayInput}
                value={relayUrl}
                onChange={(e) => setRelayUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.sessionContainer}>
          {/* Terminal Feed */}
          <div style={styles.feedScroll}>
            {feedItems.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.feedRow,
                  ...(item.role === "user" ? styles.userRow : {}),
                }}
              >
                {item.type === "thought" && (
                  <div style={styles.thoughtCard}>
                    <span style={styles.thoughtTitle}>Thinking:</span>
                    <span style={styles.thoughtText}>{item.content}</span>
                  </div>
                )}

                {item.type === "tool_call" && (
                  <div style={styles.toolCard}>
                    <span style={styles.toolBadge}>
                      {(item.metadata?.name as string) || "tool"}
                    </span>
                    <code style={styles.toolCode}>{item.content}</code>
                  </div>
                )}

                {item.type === "tool_result" && (
                  <div style={styles.toolResultCard}>
                    <span style={styles.toolResultTitle}>
                      Output ({(item.metadata?.durationMs as number) || 0}ms):
                    </span>
                    <pre style={styles.toolResultCode}>{item.content}</pre>
                  </div>
                )}

                {item.type === "token" && (
                  <div style={styles.tokenBox}>
                    <span>{item.content}</span>
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div style={styles.streamingIndicator}>
                <span style={styles.streamDot} />
                <span>Agent is working...</span>
                <span className="blinking-cursor" />
              </div>
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActionsBar}>
            {quickActions.map((qa) => (
              <button
                key={qa.label}
                style={styles.quickActionPill}
                onClick={() => handleSendPrompt(qa.prompt)}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Prompt Input Bar */}
          <div style={styles.inputBar}>
            <input
              type="text"
              style={styles.promptInput}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              placeholder="Ask your workstation agent to build, refactor, or test..."
              disabled={isStreaming}
            />
            <button
              style={styles.sendButton}
              onClick={() => handleSendPrompt()}
              disabled={!promptInput.trim() || isStreaming}
            >
              Send Turn
            </button>
          </div>

          {/* Approval Modal */}
          {activeApproval && (
            <div style={styles.approvalOverlay}>
              <div style={styles.approvalCard}>
                <div style={styles.approvalHeader}>
                  <span style={styles.warnDot} />
                  <h3 style={styles.approvalTitle}>Human-in-the-Loop Approval Required</h3>
                  <span style={styles.riskBadge}>
                    {(activeApproval.riskLevel || "MEDIUM").toUpperCase()} RISK
                  </span>
                </div>

                <div style={styles.approvalToolRow}>
                  <span style={styles.toolLabel}>Tool:</span>
                  <span style={styles.toolBadge}>{activeApproval.toolName}</span>
                </div>

                <div style={styles.commandPreview}>
                  <pre style={styles.commandCode}>{activeApproval.commandOrDiff}</pre>
                </div>

                <div style={styles.approvalActions}>
                  <button
                    style={styles.denyBtn}
                    onClick={() => handleDeny(activeApproval.approvalId)}
                  >
                    Deny Action
                  </button>
                  <button
                    style={styles.approveBtn}
                    onClick={() => handleApprove(activeApproval.approvalId)}
                  >
                    Approve on PC
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WebPairPage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 40, color: "#94a3b8" }}>Loading Web Remote Shell...</div>}
    >
      <WebPairClient />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  webContainer: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #1e293b",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  backLink: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: 1,
  },
  connectedBadge: {
    color: "#22c55e",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: "2px 8px",
    borderRadius: 12,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  settingsBtn: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
  },
  disconnectBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
  },
  toastBanner: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderBottom: "1px solid #38bdf8",
    padding: "6px 16px",
    color: "#38bdf8",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "var(--font-mono)",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderBottom: "1px solid #ef4444",
    padding: "6px 16px",
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
  },
  pairingContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pairingCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: 36,
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  },
  pairingIconBadge: {
    display: "inline-block",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 14,
    padding: "4px 12px",
    borderRadius: 6,
    marginBottom: 16,
    border: "1px solid rgba(56, 189, 248, 0.3)",
  },
  pairingTitle: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
  },
  pairingSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 24,
  },
  pinInputWrapper: {
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 8,
    textAlign: "center",
    width: "100%",
    outline: "none",
  },
  connectBtn: {
    width: "100%",
    backgroundColor: "#1e293b",
    color: "#64748b",
    border: "none",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "not-allowed",
    marginBottom: 20,
  },
  connectBtnActive: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    cursor: "pointer",
  },
  relayRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    color: "#64748b",
  },
  relayLabel: { whiteSpace: "nowrap" },
  relayInput: {
    flex: 1,
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 4,
    outline: "none",
  },
  sessionContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: 1000,
    margin: "0 auto",
    width: "100%",
    padding: "16px 20px",
    gap: 12,
  },
  feedScroll: {
    flex: 1,
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: 16,
    overflowY: "auto",
    minHeight: 400,
    maxHeight: "calc(100vh - 240px)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  feedRow: {
    fontSize: 13,
    lineHeight: 1.6,
  },
  userRow: {
    backgroundColor: "#0f172a",
    borderLeft: "3px solid #38bdf8",
    padding: "8px 12px",
    borderRadius: 4,
    color: "#38bdf8",
    fontWeight: 600,
  },
  tokenBox: {
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    whiteSpace: "pre-wrap",
  },
  thoughtCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    padding: 10,
    borderRadius: 6,
    color: "#94a3b8",
    fontStyle: "italic",
    fontSize: 12,
  },
  thoughtTitle: {
    color: "#38bdf8",
    fontWeight: 600,
    marginRight: 6,
  },
  thoughtText: { color: "#94a3b8" },
  toolCard: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0f172a",
    padding: "6px 10px",
    borderRadius: 6,
  },
  toolBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  toolCode: {
    color: "#cbd5e1",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  toolResultCard: {
    backgroundColor: "#090d16",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: 10,
  },
  toolResultTitle: {
    color: "#64748b",
    fontSize: 11,
    display: "block",
    marginBottom: 4,
  },
  toolResultCode: {
    color: "#94a3b8",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  streamingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#38bdf8",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38bdf8",
  },
  quickActionsBar: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
  },
  quickActionPill: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    color: "#cbd5e1",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  inputBar: {
    display: "flex",
    gap: 10,
  },
  promptInput: {
    flex: 1,
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#f8fafc",
    fontSize: 14,
    outline: "none",
  },
  sendButton: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    border: "none",
    padding: "0 20px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  approvalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  approvalCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #f59e0b",
    borderRadius: 12,
    padding: 24,
    maxWidth: 540,
    width: "100%",
    boxShadow: "0 0 30px rgba(245, 158, 11, 0.2)",
  },
  approvalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  warnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: 700,
    flex: 1,
  },
  riskBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    border: "1px solid #f59e0b",
    color: "#f59e0b",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  approvalToolRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    fontSize: 12,
  },
  toolLabel: { color: "#94a3b8" },
  commandPreview: {
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    maxHeight: 180,
    overflowY: "auto",
  },
  commandCode: {
    color: "#f8fafc",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  approvalActions: {
    display: "flex",
    gap: 12,
  },
  denyBtn: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "10px",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer",
  },
  approveBtn: {
    flex: 2,
    backgroundColor: "#22c55e",
    border: "none",
    color: "#090d16",
    padding: "10px",
    borderRadius: 6,
    fontWeight: 700,
    cursor: "pointer",
  },
  settingsOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  settingsCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 24,
    maxWidth: 480,
    width: "100%",
  },
  settingsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
  },
  settingsSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
  },
  pillRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  providerPill: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    cursor: "pointer",
  },
  providerPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
  },
  input: {
    width: "100%",
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#f8fafc",
    fontSize: 13,
    outline: "none",
  },
  inputWithBtn: {
    display: "flex",
    gap: 6,
  },
  toggleKeyBtn: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    padding: "0 10px",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
  },
  saveSettingsBtn: {
    width: "100%",
    backgroundColor: "#38bdf8",
    color: "#090d16",
    border: "none",
    padding: "10px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
  },
};
