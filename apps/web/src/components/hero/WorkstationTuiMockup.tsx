"use client";

import React, { useState, useEffect } from "react";

interface WorkstationTuiProps {
  activeIndex: number;
  typedPin?: string;
  isPairedSuccess?: boolean;
  isApproved?: boolean;
  countdown?: number;
}

interface FeatureData {
  reasoning: string;
  fileDiff?: {
    file: string;
    addCount: number;
    delCount: number;
    lines: Array<{ num: number; type: "neutral" | "del" | "add"; code: string }>;
  };
  commands: string[];
  safetyGate?: string;
  streamingSummary: string;
  nextStep: string;
  prompt: string;
}

const FEATURE_DATA: Record<number, FeatureData> = {
  // Screen 0: 6-Digit PIN Pairing
  0: {
    reasoning:
      "I'm initializing the AirLink workstation daemon. I'll establish a secure WebSocket relay bridge and generate an ephemeral 6-digit session PIN (834-192) so you can pair securely from your phone in 3 seconds with zero port-forwarding.",
    commands: [
      "airlink host",
      "relay.airlink.dev [Connected]",
    ],
    streamingSummary:
      "Workstation daemon is live and paired via WebSocket Relay. Inbound WebSocket connections from your phone authenticate with PIN 834-192.",
    nextStep: "Awaiting 6-digit PIN entry on mobile remote...",
    prompt: "airlink host",
  },

  // Screen 1: BYOK Key Vault
  1: {
    reasoning:
      "I'm synchronizing your client-side model API credentials in local secure memory. Keys for Anthropic Claude 3.7, DeepSeek R1, OpenAI o3-mini, and Gemini 2.0 are decrypted on-demand with AES-256-GCM. No credentials or prompts ever leave your machine.",
    commands: [
      "airlink vault sync --aes-256",
      "Loaded 4 model providers into memory",
    ],
    streamingSummary:
      "4 provider credentials synchronized in local RAM. Zero keys persisted to cloud or disk. Active engine set to DeepSeek R1 / V3.",
    nextStep: "Ready to route instructions to configured model providers.",
    prompt: "airlink vault --status",
  },

  // Screen 2: Real-Time Token Telemetry
  2: {
    reasoning:
      "I'm focusing on refactoring the auth middleware in src/server/routes/v1/session.ts to enforce WebSocket heartbeats and instant reconnects. I'll verify AST export nodes, apply code patches, and stream all ANSI terminal tokens directly to your mobile remote.",
    fileDiff: {
      file: "src/server/websocket-relay.ts",
      addCount: 38,
      delCount: 14,
      lines: [
        { num: 33, type: "neutral", code: "  const ws = new WebSocket(url);" },
        { num: 34, type: "del", code: "  ws.timeout = 30000;" },
        { num: 34, type: "add", code: "  ws.setHeartbeatInterval(15_000);" },
        { num: 35, type: "add", code: "  ws.enableBinaryWebSocketRelay();" },
        { num: 36, type: "neutral", code: "  return ws;" },
      ],
    },
    commands: [
      "pnpm --filter @airlink/web test",
      "git status -sb",
    ],
    streamingSummary:
      "Session router now enforces end-to-end WebSocket relay and automatic socket reconnects. All 12 automated security rules verified clean.",
    nextStep: "Streaming token buffer at 64.2 tok/s to mobile phone.",
    prompt: "Refactor auth middleware to enforce WebSocket heartbeats",
  },

  // Screen 3: 1-Tap Safety Gate / Human Approvals
  3: {
    reasoning:
      "I've detected a high-risk destructive terminal execution ('rm -rf dist/ && pnpm build:prod'). Pausing execution at the 180s Safety Gate and dispatching an instant push notification to your phone for explicit 1-tap mobile authorization.",
    safetyGate: "rm -rf dist/ && pnpm build:prod",
    commands: [
      "airlink intercept --safety-gate",
      "Pushed 1-tap notification to mobile",
    ],
    streamingSummary:
      "Command execution is intercepted and frozen on local workstation. Awaiting your 1-tap mobile approval before touching filesystem build artifacts.",
    nextStep: "Execution paused. Tap [Approve] on phone to authorize.",
    prompt: "rm -rf dist/ && pnpm build:prod",
  },

  // Screen 4: Visual Git Diff & AST Viewer (Matches User Screenshot 100%)
  4: {
    reasoning:
      "I'm updating the hero display headline to solid black (#0f172a) and implementing a cinematic GSAP word blur-reveal animation (.hero-word stagger 0.065s) in PanoramicLandscapeHero.tsx as requested from the phone.",
    fileDiff: {
      file: "src/components/hero/PanoramicLandscapeHero.tsx",
      addCount: 92,
      delCount: 35,
      lines: [
        { num: 42, type: "del", code: "  color: \"transparent\", backgroundClip: \"text\"," },
        { num: 42, type: "add", code: "  color: \"#0f172a\", fontWeight: 900," },
        { num: 43, type: "add", code: "  gsap.fromTo(\".hero-word\", { filter: \"blur(12px)\", y: 48 }," },
        { num: 44, type: "add", code: "    { filter: \"blur(0px)\", y: 0, stagger: 0.065 });" },
        { num: 45, type: "add", code: "  emitTelemetry(\"gsap_reveal_completed\");" },
      ],
    },
    commands: [
      "pnpm --filter @airlink/web test",
      "git status -sb",
    ],
    streamingSummary:
      "Hero text styled in bold solid obsidian (#0f172a) with smooth GSAP blur-to-focus reveal. 2 files modified (+92 -35). AST validated clean.",
    nextStep: "Potential next step: Tap [Review] on phone or commit to main.",
    prompt: "also the hero text let us have it all black and i have some gsap effect sort of",
  },
};

export function WorkstationTuiMockup({
  activeIndex,
  isPairedSuccess = false,
  isApproved = false,
  countdown = 178,
}: WorkstationTuiProps) {
  const current = FEATURE_DATA[activeIndex] || FEATURE_DATA[4];
  const [streamCount, setStreamCount] = useState<number>(0);

  // Live word-by-word streaming effect
  const words = current.streamingSummary.split(" ");

  useEffect(() => {
    setStreamCount(0);
    const interval = setInterval(() => {
      setStreamCount((prev) => {
        if (prev < words.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 55);
    return () => clearInterval(interval);
  }, [activeIndex, words.length]);

  return (
    <div style={styles.tuiContainer}>
      {/* MacOS Terminal Window Header */}
      <div style={styles.tuiHeader}>
        <div style={styles.tuiDots}>
          <span style={{ ...styles.dot, backgroundColor: "#ef4444" }} />
          <span style={{ ...styles.dot, backgroundColor: "#f59e0b" }} />
          <span style={{ ...styles.dot, backgroundColor: "#22c55e" }} />
        </div>
        <span style={styles.tuiTitle}>airlink host &middot; workstation ~ zsh</span>
        <div style={styles.tuiLivePill}>
          <span style={styles.greenPulse} />
          <span>WS RELAY</span>
        </div>
      </div>

      {/* Terminal Content (Exact Developer TUI Aesthetics) */}
      <div style={styles.tuiBody}>
        {/* Top Reasoning Prose */}
        <p style={styles.reasoningProse}>{current.reasoning}</p>

        {/* Tool Execution Bullet List */}
        <div style={styles.toolList}>
          {/* File Diff Block if present */}
          {current.fileDiff && (
            <div style={styles.toolItem}>
              <div style={styles.toolBulletLine}>
                <span style={styles.bulletDot}>●</span>
                <strong style={styles.toolVerb}>Edited</strong>
                <span style={styles.toolTarget}>{current.fileDiff.file}</span>
                <span style={styles.toolDiffBadge}>
                  (+{current.fileDiff.addCount} -{current.fileDiff.delCount})
                </span>
              </div>

              {/* Embedded Code Diff Snippet */}
              <div style={styles.inlineDiffBox}>
                {current.fileDiff.lines.map((line, lIdx) => (
                  <div
                    key={lIdx}
                    style={
                      line.type === "del"
                        ? styles.diffRowDel
                        : line.type === "add"
                        ? styles.diffRowAdd
                        : styles.diffRowNeutral
                    }
                  >
                    <span style={styles.lineNum}>{line.num}</span>
                    {line.type === "del" && <span style={styles.diffSymbol}>-</span>}
                    {line.type === "add" && <span style={styles.diffSymbol}>+</span>}
                    {line.type === "neutral" && <span style={styles.diffSymbol}> </span>}
                    <span style={styles.diffCode}>{line.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Gate Alert if present */}
          {current.safetyGate && (
            <div style={styles.toolItem}>
              <div style={styles.toolBulletLine}>
                <span style={{ ...styles.bulletDot, color: "#fbbf24" }}>●</span>
                <strong style={{ ...styles.toolVerb, color: "#fbbf24" }}>Safety Gate</strong>
                <span style={styles.commandCode}>{current.safetyGate}</span>
              </div>
            </div>
          )}

          {/* Ran Commands */}
          {current.commands.map((cmd, cIdx) => (
            <div key={cIdx} style={styles.toolItem}>
              <div style={styles.toolBulletLine}>
                <span style={styles.bulletDot}>●</span>
                <strong style={styles.toolVerb}>Ran</strong>
                <span style={styles.commandCode}>{cmd}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live Streaming Explanation / Summary Text */}
        <div style={styles.streamingExplanationBox}>
          <span style={styles.streamArrow}>&gt;</span>
          <div style={styles.streamTextInner}>
            {words.slice(0, streamCount).map((word, i) => (
              <span key={i} style={styles.wordSpan}>
                {word}{" "}
              </span>
            ))}
            {streamCount < words.length && (
              <span style={styles.blinkingBlockCursor}>█</span>
            )}
          </div>
        </div>

        {/* Potential Next Step Hint */}
        <div style={styles.nextStepHint}>
          {activeIndex === 0 && isPairedSuccess
            ? "✔ Remote device authenticated. Session paired (0.04s)."
            : activeIndex === 3 && isApproved
            ? "✔ 1-tap mobile authorization received. Executing command..."
            : activeIndex === 3
            ? `⚠️ Execution paused (${countdown}s). Awaiting 1-tap mobile approval...`
            : current.nextStep}
        </div>

        {/* Interactive CLI Input Line (Matches Phone User Prompt) */}
        <div style={styles.promptInputLine}>
          <span style={styles.promptSymbol}>airlink &gt;</span>
          <span style={styles.promptPlaceholder}>
            {activeIndex === 0 && isPairedSuccess
              ? "✓ Workstation paired with remote. Ready for instructions."
              : current.prompt}
          </span>
          <span style={styles.blinkingBlockCursor}>█</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tuiContainer: {
    width: "100%",
    maxWidth: 395,
    backgroundColor: "#000000",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "-16px 28px 70px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "var(--font-mono)",
  },
  tuiHeader: {
    backgroundColor: "#0d1117",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tuiDots: {
    display: "flex",
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  tuiTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: "#8b949e",
    letterSpacing: 0.4,
  },
  tuiLivePill: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.35)",
    color: "#4ade80",
    padding: "1px 5px",
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 800,
  },
  greenPulse: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    backgroundColor: "#4ade80",
    boxShadow: "0 0 4px #4ade80",
  },
  tuiBody: {
    padding: "12px 14px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 9,
    lineHeight: 1.45,
    backgroundColor: "#000000",
    color: "#e6edf3",
  },
  reasoningProse: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: "#8b949e",
    margin: 0,
    fontWeight: 400,
  },
  toolList: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    margin: "2px 0",
  },
  toolItem: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  toolBulletLine: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 9,
  },
  bulletDot: {
    color: "#e6edf3",
    fontSize: 8,
  },
  toolVerb: {
    color: "#ffffff",
    fontWeight: 700,
  },
  toolTarget: {
    color: "#cbd5e1",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 220,
  },
  toolDiffBadge: {
    color: "#8b949e",
    fontSize: 8,
    marginLeft: 2,
    flexShrink: 0,
  },
  commandCode: {
    color: "#7ee787",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  inlineDiffBox: {
    backgroundColor: "#0a0c10",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 6,
    padding: "4px 6px",
    marginLeft: 12,
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
    fontSize: 8,
    lineHeight: 1.35,
  },
  diffRowNeutral: {
    display: "flex",
    gap: 5,
    color: "#8b949e",
  },
  diffRowDel: {
    display: "flex",
    gap: 5,
    color: "#f87171",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: "0.5px 2px",
    borderRadius: 2,
  },
  diffRowAdd: {
    display: "flex",
    gap: 5,
    color: "#4ade80",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    padding: "0.5px 2px",
    borderRadius: 2,
  },
  lineNum: {
    color: "#484f58",
    width: 14,
    textAlign: "right",
    userSelect: "none",
  },
  diffSymbol: {
    width: 6,
    fontWeight: 700,
  },
  diffCode: {
    whiteSpace: "pre",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  streamingExplanationBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 5,
    fontSize: 8.5,
    lineHeight: 1.45,
    color: "#e6edf3",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  streamArrow: {
    color: "#38bdf8",
    fontWeight: 800,
    marginTop: 0.5,
  },
  streamTextInner: {
    flex: 1,
  },
  wordSpan: {
    display: "inline",
  },
  blinkingBlockCursor: {
    color: "#38bdf8",
    display: "inline-block",
    marginLeft: 2,
    animation: "fade-in 200ms ease-out infinite alternate",
  },
  nextStepHint: {
    fontSize: 8,
    color: "#8b949e",
    lineHeight: 1.35,
    paddingLeft: 2,
  },
  promptInputLine: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0a0c10",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    padding: "5px 8px",
    marginTop: 2,
  },
  promptSymbol: {
    color: "#38bdf8",
    fontSize: 8.5,
    fontWeight: 700,
    flexShrink: 0,
  },
  promptPlaceholder: {
    color: "#6e7681",
    fontSize: 8.5,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  tuiFooter: {
    backgroundColor: "#0a0c10",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "5px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 7.5,
    color: "#6e7681",
  },
  footerShortcuts: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  kbd: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: 3,
    padding: "0.5px 3px",
    color: "#8b949e",
    fontSize: 7,
  },
  footerTelemetry: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  tokensUsed: {
    color: "#8b949e",
  },
  contextLeft: {
    color: "#4ade80",
    fontWeight: 600,
  },
};
