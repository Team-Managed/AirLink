"use client";

import React, { useState, useEffect } from "react";
import { DitheredWaveSky } from "./DitheredWaveSky";

export function HeroPhoneShowcase() {
  const [approvedState, setApprovedState] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(180);

  useEffect(() => {
    if (approvedState) return;
    const interval = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [approvedState]);

  const handleApprove = () => {
    setApprovedState(true);
    setTimeout(() => setApprovedState(false), 3500);
  };

  return (
    <section style={styles.showcaseSection}>
      {/* 1. Header Section (Matching Image 2 Layout) */}
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <div style={styles.tagRow}>
            <span style={styles.tagLine}>|</span>
            <span style={styles.tagText}>Over-The-Air Teleoperation &rarr;</span>
          </div>
          <h2 style={styles.title}>
            Local Agent Power, <br />
            Simple Experience.
          </h2>
          <p style={styles.subtitle}>
            Prompt your local workstation agent, view character token streams, inspect visual Git diffs,
            and approve sensitive bash commands straight from your pocket.
          </p>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.featurePillCard}>
            <div style={styles.pillIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h4 style={styles.pillTitle}>Granular HITL Approvals</h4>
              <p style={styles.pillDesc}>
                Define exactly what shell and tool operations pause for your one-tap authorization.
              </p>
            </div>
          </div>

          <div style={styles.featurePillCard}>
            <div style={styles.pillIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
            <div>
              <h4 style={styles.pillTitle}>Zero-Retention AirLink WebSocket Relay</h4>
              <p style={styles.pillDesc}>
                Ephemeral 6-digit PIN pairing. Your code and tokens never touch a cloud database.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Visual Canvas Card with Dithered Wave Sky Backdrop & Phone Mockup */}
      <div style={styles.canvasWrapper} className="glass-panel">
        <DitheredWaveSky />

        <div style={styles.floatingContainer}>
          {/* Left Floating Node Card (Workstation Core) */}
          <div style={styles.floatingCardLeft} className="glass-panel">
            <div style={styles.cardHeaderSmall}>
              <div style={styles.greenDot} />
              <span style={styles.cardHeaderTitle}>Workstation Host</span>
              <span style={styles.pinTag}>PIN: 834-192</span>
            </div>

            <div style={styles.hostDetails}>
              <div style={styles.hostRow}>
                <span style={styles.hostKey}>Device:</span>
                <span style={styles.hostVal}>MacBook Pro M3 Max</span>
              </div>
              <div style={styles.hostRow}>
                <span style={styles.hostKey}>WebSocket Latency:</span>
                <span style={styles.hostValHighlight}>12ms (Relay)</span>
              </div>
              <div style={styles.hostRow}>
                <span style={styles.hostKey}>Active Agent:</span>
                <span style={styles.hostVal}>TrueForge DeepSeek-R1</span>
              </div>
              <div style={styles.hostRow}>
                <span style={styles.hostKey}>Sandbox Mode:</span>
                <span style={styles.hostVal}>100% Local Filesystem</span>
              </div>
            </div>

            <div style={styles.astStatusRow}>
              <span style={styles.astBadge}>AST Cache Active</span>
              <span style={styles.seqBadge}>seq: #500</span>
            </div>
          </div>

          {/* Centerphone: High-Fidelity Mobile Phone Mockup */}
          <div style={styles.phoneFrame}>
            {/* Phone Bezel & Outer Hardware */}
            <div style={styles.phoneDynamicIsland} />

            <div style={styles.phoneScreen}>
              {/* Status Bar */}
              <div style={styles.phoneStatusBar}>
                <span style={styles.phoneTime}>9:41</span>
                <div style={styles.phoneSignals}>
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Mobile App Header */}
              <div style={styles.phoneAppHeader}>
                <div style={styles.phoneBrandRow}>
                  <div style={styles.phoneLogoDot} />
                  <span style={styles.phoneAppName}>AirLink Mobile</span>
                </div>
                <span style={styles.phonePinBadge}>PIN: 834-192</span>
              </div>

              {/* Feed Content */}
              <div style={styles.phoneFeed}>
                {/* User Prompt */}
                <div style={styles.phonePromptBubble}>
                  <span style={styles.phonePromptRole}>You @ Phone</span>
                  <span style={styles.phonePromptText}>Fix memory leak in relay rate-limiter & run tests</span>
                </div>

                {/* AI Reasoning Card */}
                <div style={styles.phoneAiReasoning}>
                  <div style={styles.phoneReasonHeader}>
                    <span style={styles.aiTag}>TrueForge AI</span>
                    <span style={styles.aiSub}>Analyzing rate-limiter.ts...</span>
                  </div>
                  <p style={styles.reasonText}>
                    1. Purging sliding window timestamps. <br />
                    2. Intercepting test command for HITL check.
                  </p>
                </div>

                {/* Git Diff Card */}
                <div style={styles.phoneDiffBox}>
                  <div style={styles.phoneDiffHead}>
                    <span>rate-limiter.ts</span>
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>+4 -1</span>
                  </div>
                  <div style={styles.phoneDiffContent}>
                    <span style={styles.diffDel}>- setInterval(() =&gt; &#123;&#125;, 60000);</span>
                    <span style={styles.diffAdd}>+ private purgeExpiredBuckets(): void &#123;</span>
                    <span style={styles.diffAdd}>+ const now = Date.now();</span>
                    <span style={styles.diffAdd}>+ for (const [k, v] of this.buckets) ...</span>
                  </div>
                </div>

                {/* Floating Approval Drawer */}
                <div style={styles.phoneApprovalDrawer}>
                  {!approvedState ? (
                    <>
                      <div style={styles.drawerTop}>
                        <span style={styles.drawerWarn}>! APPROVAL REQUIRED</span>
                        <span style={styles.drawerTimer}>{countdown}s</span>
                      </div>
                      <div style={styles.drawerCmdBox}>
                        <code>bash: pnpm test</code>
                      </div>
                      <div style={styles.drawerBtnRow}>
                        <button style={styles.drawerApproveBtn} onClick={handleApprove}>
                          Approve
                        </button>
                        <button style={styles.drawerDenyBtn}>Deny</button>
                      </div>
                    </>
                  ) : (
                    <div style={styles.drawerSuccessBox}>
                      <span style={{ color: "#22c55e", fontWeight: 800 }}>✓ Action Approved</span>
                      <span style={{ color: "#94a3b8", fontSize: 10 }}>Executing pnpm test on PC...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Floating Node Card (HITL Workflow) */}
          <div style={styles.floatingCardRight} className="glass-panel">
            <div style={styles.cardHeaderSmall}>
              <div style={{ ...styles.greenDot, backgroundColor: "#f59e0b" }} />
              <span style={styles.cardHeaderTitle}>HITL Pipeline Flow</span>
              <span style={{ ...styles.pinTag, color: "#f59e0b", borderColor: "#f59e0b44", backgroundColor: "#f59e0b15" }}>
                180s Safety
              </span>
            </div>

            <div style={styles.workflowSteps}>
              <div style={styles.stepItem}>
                <span style={styles.stepNum}>01</span>
                <div style={styles.stepText}>
                  <strong>Prompt Dispatched</strong>
                  <span>Forwarded over WebSocket</span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <span style={styles.stepNum}>02</span>
                <div style={styles.stepText}>
                  <strong>Tool Interception Gate</strong>
                  <span>`execute_bash` quarantined</span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <span style={{ ...styles.stepNum, color: "#22c55e", borderColor: "#22c55e" }}>03</span>
                <div style={styles.stepText}>
                  <strong>Mobile Touch Approval</strong>
                  <span>One-tap cryptographic signal</span>
                </div>
              </div>

              <div style={styles.stepItem}>
                <span style={styles.stepNum}>04</span>
                <div style={styles.stepText}>
                  <strong>Workspace Checkpoint</strong>
                  <span>Git diff committed to local disk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  showcaseSection: {
    maxWidth: 1200,
    margin: "0 auto 100px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 32,
    marginBottom: 40,
    flexWrap: "wrap",
  },
  headerLeft: {
    flex: "1 1 500px",
  },
  tagRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tagLine: {
    color: "#22c55e",
    fontWeight: 900,
    fontSize: 16,
  },
  tagText: {
    color: "#22c55e",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: "clamp(32px, 4.5vw, 52px)",
    fontWeight: 900,
    color: "#f8fafc",
    lineHeight: 1.1,
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 520,
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    flex: "1 1 380px",
  },
  featurePillCard: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 16,
  },
  pillIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pillTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 4,
  },
  pillDesc: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
  },
  canvasWrapper: {
    position: "relative",
    borderRadius: 24,
    minHeight: 640,
    overflow: "hidden",
    padding: "48px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  },
  floatingContainer: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    width: "100%",
    flexWrap: "wrap",
  },
  floatingCardLeft: {
    flex: "0 1 290px",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  },
  floatingCardRight: {
    flex: "0 1 290px",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  },
  cardHeaderSmall: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 10,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    boxShadow: "0 0 8px #22c55e",
  },
  cardHeaderTitle: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: 800,
    flex: 1,
  },
  pinTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 800,
    color: "#38bdf8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  hostDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
  },
  hostRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
  },
  hostKey: {
    color: "#64748b",
  },
  hostVal: {
    color: "#cbd5e1",
    fontWeight: 600,
  },
  hostValHighlight: {
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  astStatusRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  astBadge: {
    color: "#a855f7",
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  seqBadge: {
    color: "#64748b",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
  },
  phoneFrame: {
    width: 320,
    height: 580,
    backgroundColor: "#05080f",
    border: "4px solid #334155",
    borderRadius: 36,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.15)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flexShrink: 0,
  },
  phoneDynamicIsland: {
    width: 90,
    height: 18,
    backgroundColor: "#000",
    borderRadius: 12,
    position: "absolute",
    top: 8,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#090d16",
    color: "#f8fafc",
    padding: "8px 12px 14px",
  },
  phoneStatusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2px 10px",
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "var(--font-mono)",
    marginBottom: 8,
  },
  phoneTime: {
    fontWeight: 700,
  },
  phoneSignals: {
    display: "flex",
    gap: 6,
    fontSize: 10,
  },
  phoneAppHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 8px",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 8,
    marginBottom: 10,
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  phoneBrandRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  phoneLogoDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#38bdf8",
  },
  phoneAppName: {
    fontSize: 12,
    fontWeight: 800,
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
  },
  phonePinBadge: {
    fontSize: 10,
    color: "#22c55e",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  phoneFeed: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "hidden",
  },
  phonePromptBubble: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    borderRadius: 8,
    padding: "6px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  phonePromptRole: {
    color: "#38bdf8",
    fontSize: 9,
    fontWeight: 800,
    fontFamily: "var(--font-mono)",
  },
  phonePromptText: {
    color: "#f8fafc",
    fontSize: 11,
    lineHeight: 1.4,
  },
  phoneAiReasoning: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    border: "1px solid rgba(168, 85, 247, 0.25)",
    borderRadius: 8,
    padding: "6px 10px",
  },
  phoneReasonHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  aiTag: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: 800,
    fontFamily: "var(--font-mono)",
  },
  aiSub: {
    color: "#94a3b8",
    fontSize: 9,
    fontStyle: "italic",
  },
  reasonText: {
    color: "#cbd5e1",
    fontSize: 10,
    lineHeight: 1.4,
    fontFamily: "var(--font-mono)",
  },
  phoneDiffBox: {
    backgroundColor: "rgba(5, 8, 15, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 9,
    fontFamily: "var(--font-mono)",
  },
  phoneDiffHead: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
    color: "#94a3b8",
    fontWeight: 700,
  },
  phoneDiffContent: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  diffDel: {
    color: "#ef4444",
    backgroundColor: "rgba(239,68,68,0.1)",
    padding: "1px 3px",
    borderRadius: 2,
  },
  diffAdd: {
    color: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.1)",
    padding: "1px 3px",
    borderRadius: 2,
  },
  phoneApprovalDrawer: {
    marginTop: "auto",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    borderRadius: 10,
    padding: "8px 10px",
    boxShadow: "0 0 15px rgba(245, 158, 11, 0.15)",
  },
  drawerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  drawerWarn: {
    color: "#f59e0b",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  drawerTimer: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: 800,
    fontFamily: "var(--font-mono)",
  },
  drawerCmdBox: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: "3px 6px",
    borderRadius: 4,
    color: "#38bdf8",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    marginBottom: 8,
  },
  drawerBtnRow: {
    display: "flex",
    gap: 6,
  },
  drawerApproveBtn: {
    flex: 1,
    backgroundColor: "#22c55e",
    color: "#090d16",
    border: "none",
    padding: "6px 0",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  drawerDenyBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  drawerSuccessBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "4px 0",
  },
  workflowSteps: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  stepItem: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#94a3b8",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    display: "flex",
    flexDirection: "column",
    fontSize: 11,
    color: "#f8fafc",
  },
};
