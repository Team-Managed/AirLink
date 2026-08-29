"use client";

import React, { useState, useEffect } from "react";
import type { SimStep } from "../../types";

export function InteractiveDemoSimulator() {
  const [simStep, setSimStep] = useState<SimStep>("pending_approval");
  const [simCountdown, setSimCountdown] = useState<number>(180);
  const [simThoughtExpanded, setSimThoughtExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"session" | "diff" | "logs">("session");

  const handleApproveSim = () => {
    setSimStep("approved_executing");
    setTimeout(() => {
      setSimStep("completed");
    }, 2400);
  };

  const handleResetSim = () => {
    setSimStep("pending_approval");
    setSimCountdown(180);
  };

  useEffect(() => {
    if (simStep !== "pending_approval") return;
    const interval = setInterval(() => {
      setSimCountdown((prev) => (prev > 1 ? prev - 1 : 180));
    }, 1000);
    return () => clearInterval(interval);
  }, [simStep]);

  return (
    <section style={styles.demoSection}>
      <div style={styles.demoCard}>
        {/* Terminal Title Bar */}
        <div style={styles.terminalHeader}>
          <div style={styles.terminalLeft}>
            <div style={styles.terminalDots}>
              <span style={{ ...styles.dot, backgroundColor: "#ef4444" }} />
              <span style={{ ...styles.dot, backgroundColor: "#f59e0b" }} />
              <span style={{ ...styles.dot, backgroundColor: "#10b981" }} />
            </div>
            <span style={styles.terminalTitle}>AIRLINK TELEOPERATION SIMULATOR</span>
          </div>

          <div style={styles.headerRight}>
            {/* View Mode Switcher */}
            <div style={styles.tabSwitcher}>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "session" ? styles.tabBtnActive : {}),
                }}
                onClick={() => setActiveTab("session")}
              >
                Live Session
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "diff" ? styles.tabBtnActive : {}),
                }}
                onClick={() => setActiveTab("diff")}
              >
                Git Diff (+4 -1)
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "logs" ? styles.tabBtnActive : {}),
                }}
                onClick={() => setActiveTab("logs")}
              >
                Logs
              </button>
            </div>

            <div style={styles.sessionPill}>
              <span style={styles.statusLiveDot} />
              <span>PIN: 834-192</span>
            </div>
          </div>
        </div>

        {/* Terminal Body Feed */}
        <div style={styles.terminalBody}>
          {activeTab === "session" && (
            <>
              {/* User Prompt from Mobile Device */}
              <div style={styles.feedRow}>
                <div style={styles.userBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                    <path d="M12 18h.01" />
                  </svg>
                  <span>Remote Mobile Client</span>
                </div>
                <span style={styles.feedPromptText}>
                  Fix the memory leak in relay rate-limiter and run tests
                </span>
              </div>

              {/* Collapsible AI Thought Block */}
              <div style={styles.thoughtBox}>
                <div
                  style={styles.thoughtHeader}
                  onClick={() => setSimThoughtExpanded(!simThoughtExpanded)}
                >
                  <div style={styles.thoughtTitleRow}>
                    <span style={styles.thoughtBadge}>TrueForge DeepSeek-R1</span>
                    <span style={styles.thoughtSummary}>
                      Analyzing sliding window buckets and ring-buffer monotonic sequences...
                    </span>
                  </div>
                  <button style={styles.thoughtToggleBtn}>
                    {simThoughtExpanded ? "Collapse ▲" : "Expand ▼"}
                  </button>
                </div>
                {simThoughtExpanded && (
                  <div style={styles.thoughtBody}>
                    1. Inspect `apps/relay/src/rate-limiter.ts` sliding window buckets.
                    <br />
                    2. Add interval purge for expired window records to prevent Map growth.
                    <br />
                    3. Execute Vitest suite to verify 0 regressions across 223 tests.
                  </div>
                )}
              </div>

              {/* Compact Unified Diff Inline */}
              <div style={styles.diffCard}>
                <div style={styles.diffHeader}>
                  <div style={styles.diffFileTitle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6347" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>apps/relay/src/rate-limiter.ts</span>
                  </div>
                  <span style={styles.diffStats}>+4 -1</span>
                </div>
                <div style={styles.diffContent}>
                  <div style={styles.diffLineContext}>@@ -42,7 +42,10 @@ export class RateLimiter &#123;</div>
                  <div style={styles.diffLineDelete}>- setInterval(() =&gt; &#123;&#125;, 60000);</div>
                  <div style={styles.diffLineAdd}>+ private purgeExpiredBuckets(): void &#123;</div>
                  <div style={styles.diffLineAdd}>+ const now = Date.now();</div>
                  <div style={styles.diffLineAdd}>
                    + for (const [k, v] of this.buckets) if (now &gt; v.expires) this.buckets.delete(k);
                  </div>
                  <div style={styles.diffLineAdd}>+ &#125;</div>
                </div>
              </div>

              {/* Human In The Loop Gate Banner */}
              {simStep === "pending_approval" && (
                <div style={styles.approvalBanner}>
                  <div style={styles.approvalTop}>
                    <div style={styles.approvalAlert}>
                      <span style={styles.warnIcon}>!</span>
                      <div>
                        <span style={styles.approvalHeading}>
                          Human-in-the-Loop Approval Required (Medium Risk)
                        </span>
                        <div style={styles.approvalSub}>
                          Interception gate on PC workstation — approve on your phone to continue.
                        </div>
                      </div>
                    </div>
                    <div style={styles.countdownBadge}>
                      <span style={styles.timerIcon}>⏱</span>
                      <span>Auto-denies in: {simCountdown}s</span>
                    </div>
                  </div>

                  <p style={styles.approvalDesc}>
                    Agent requested execution of shell command:{" "}
                    <code style={styles.inlineCode}>pnpm --filter @airlink/relay test</code>
                  </p>

                  <div style={styles.approvalButtons}>
                    <button style={styles.approveButton} onClick={handleApproveSim}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Approve on Device</span>
                    </button>
                    <button
                      style={styles.denyButton}
                      onClick={() => alert("Action denied by developer.")}
                    >
                      <span>Deny Action</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Approved Execution Feedback */}
              {simStep === "approved_executing" && (
                <div style={styles.executingBox}>
                  <div style={styles.executingHeader}>
                    <span style={styles.spinner} />
                    <span>Approved on mobile phone. Running test suite on PC workstation...</span>
                  </div>
                  <div style={styles.streamingTokens}>
                    <span>RUN v2.1.9 C:/Users/Tyra/agent-harness</span>
                    <br />
                    <span>✓ apps/relay/tests/rate-limiter.test.ts (7 tests) [12ms]</span>
                    <br />
                    <span>✓ packages/bridge-core/tests/approval.test.ts (9 tests) [14ms]</span>
                  </div>
                </div>
              )}

              {/* Completed Step */}
              {simStep === "completed" && (
                <div style={styles.completedBox}>
                  <div style={styles.completedHeader}>
                    <div style={styles.checkIconBadge}>✓</div>
                    <div>
                      <span style={styles.completedTitle}>
                        Turn Completed Successfully (223/223 tests passing)
                      </span>
                      <div style={styles.completedSub}>
                        Diff applied to local workspace disk &middot; 0 tokens stored in cloud relay
                      </div>
                    </div>
                  </div>
                  <button style={styles.resetSimBtn} onClick={handleResetSim}>
                    Reset Simulator
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "diff" && (
            <div style={styles.diffFullView}>
              <div style={styles.diffHeader}>
                <span style={styles.diffFilePath}>
                  packages/bridge-core/src/rate-limiter.ts &bull; Full Diff View
                </span>
                <span style={styles.diffStats}>+14 -3</span>
              </div>
              <div style={styles.diffContent}>
                <div style={styles.diffLineContext}>@@ -12,6 +12,17 @@</div>
                <div style={styles.diffLineDelete}>- const cleanupInterval = setInterval(() =&gt; purge(), 60000);</div>
                <div style={styles.diffLineAdd}>
                  + export class SlidingWindowLimiter implements RateLimiterContract &#123;
                </div>
                <div style={styles.diffLineAdd}>+ private readonly ringBuffer = new Map&lt;string, number[]&gt;();</div>
                <div style={styles.diffLineAdd}>+ public checkLimit(key: string, limit = 3): boolean &#123;</div>
                <div style={styles.diffLineAdd}>+ const timestamps = this.ringBuffer.get(key);</div>
                <div style={styles.diffLineAdd}>+ return (timestamps?.length ?? 0) &lt; limit;</div>
                <div style={styles.diffLineAdd}>+ &#125;</div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div style={styles.logsView}>
              <div style={styles.logLine}>[AirLink Relay] Host connected &amp; PIN room generated: 834-192</div>
              <div style={styles.logLine}>[AirLink Relay] Client paired from Mobile (iOS Safari)</div>
              <div style={styles.logLine}>[Workstation] TrueForge turn initialized with DeepSeek R1 (1M ctx)</div>
              <div style={styles.logLine}>[Workstation] MCP Tool `execute_bash` intercepted by HITL gate</div>
              <div style={styles.logLine}>[Workstation] Stream seq_id: 482..500 written to in-memory ring buffer</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  demoSection: {
    maxWidth: 1040,
    margin: "0 auto 100px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  demoCard: {
    backgroundColor: "#f6efe9",
    border: "1px solid rgba(24, 32, 48, 0.14)",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 12px 40px -10px rgba(24, 32, 48, 0.1), 0 2px 8px rgba(24, 32, 48, 0.04)",
  },
  terminalHeader: {
    backgroundColor: "#ebe3d9",
    borderBottom: "1px solid rgba(24, 32, 48, 0.1)",
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  terminalLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  terminalDots: {
    display: "flex",
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
  },
  terminalTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
    color: "#182030",
    letterSpacing: 0.6,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  tabSwitcher: {
    display: "flex",
    gap: 2,
    backgroundColor: "#f6efe9",
    padding: 3,
    borderRadius: 7,
    border: "1px solid rgba(24, 32, 48, 0.12)",
  },
  tabBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#35455e",
    padding: "4px 10px",
    borderRadius: 5,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabBtnActive: {
    backgroundColor: "#182030",
    color: "#f8fafc",
    boxShadow: "0 1px 3px rgba(24, 32, 48, 0.2)",
  },
  sessionPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 138, 122, 0.15)",
    border: "1px solid #228a7a",
    color: "#228a7a",
    padding: "3px 10px",
    borderRadius: 9999,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#228a7a",
    boxShadow: "0 0 6px #228a7a",
  },
  terminalBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  feedRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  userBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.15)",
    color: "#182030",
    padding: "4px 10px",
    borderRadius: 6,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 11,
  },
  feedPromptText: {
    color: "#182030",
    fontSize: 14,
    fontWeight: 700,
  },
  thoughtBox: {
    backgroundColor: "#eef3f7",
    border: "1px solid #c5d4e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  thoughtHeader: {
    padding: "10px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  thoughtTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  thoughtBadge: {
    backgroundColor: "#556885",
    color: "#ffffff",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  thoughtSummary: {
    color: "#35455e",
    fontSize: 12,
  },
  thoughtToggleBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#556885",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  thoughtBody: {
    padding: "12px 16px",
    borderTop: "1px solid #c5d4e0",
    color: "#2a374f",
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: "var(--font-mono)",
  },
  diffCard: {
    backgroundColor: "#161e2e",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
  },
  diffHeader: {
    backgroundColor: "#1b2538",
    padding: "8px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  diffFileTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 600,
  },
  diffFilePath: {
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    fontSize: 12,
  },
  diffStats: {
    color: "#228a7a",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 11,
  },
  diffContent: {
    padding: "12px 14px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.6,
  },
  diffLineContext: {
    color: "#94a3b8",
  },
  diffLineDelete: {
    color: "#c74444",
    backgroundColor: "rgba(199, 68, 68, 0.18)",
    padding: "2px 6px",
    borderRadius: 4,
    margin: "2px 0",
  },
  diffLineAdd: {
    color: "#228a7a",
    backgroundColor: "rgba(34, 138, 122, 0.18)",
    padding: "2px 6px",
    borderRadius: 4,
    margin: "2px 0",
  },
  approvalBanner: {
    backgroundColor: "#fdf8ee",
    border: "1px solid #e5b771",
    borderRadius: 10,
    padding: 18,
  },
  approvalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 10,
  },
  approvalAlert: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  warnIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: "50%",
    backgroundColor: "#e5b771",
    color: "#182030",
    fontSize: 12,
    fontWeight: 900,
  },
  approvalHeading: {
    color: "#854d0e",
    fontWeight: 800,
    fontSize: 14,
  },
  approvalSub: {
    color: "#a16207",
    fontSize: 12,
    marginTop: 2,
  },
  countdownBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f6efe9",
    border: "1px solid #e5b771",
    color: "#854d0e",
    padding: "4px 10px",
    borderRadius: 9999,
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
  },
  timerIcon: {
    fontSize: 12,
  },
  approvalDesc: {
    color: "#713f12",
    fontSize: 13,
    marginBottom: 16,
  },
  inlineCode: {
    backgroundColor: "#f6efe9",
    border: "1px solid #e5b771",
    padding: "3px 8px",
    borderRadius: 6,
    color: "#854d0e",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
  },
  approvalButtons: {
    display: "flex",
    gap: 12,
  },
  approveButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#182030",
    color: "#f8fafc",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "9px 18px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(24, 32, 48, 0.2)",
  },
  denyButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f6efe9",
    border: "1px solid #c74444",
    color: "#c74444",
    padding: "9px 16px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  executingBox: {
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.15)",
    borderRadius: 10,
    padding: 16,
  },
  executingHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#182030",
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 12,
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid rgba(24, 32, 48, 0.2)",
    borderTopColor: "#182030",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  streamingTokens: {
    color: "#35455e",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.6,
  },
  completedBox: {
    backgroundColor: "rgba(34, 138, 122, 0.12)",
    border: "1px solid #228a7a",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  completedHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  checkIconBadge: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    backgroundColor: "#228a7a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 13,
  },
  completedTitle: {
    color: "#1b5e52",
    fontWeight: 800,
    fontSize: 14,
  },
  completedSub: {
    color: "#228a7a",
    fontSize: 12,
    marginTop: 2,
  },
  resetSimBtn: {
    backgroundColor: "#f6efe9",
    border: "1px solid #228a7a",
    color: "#1b5e52",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  diffFullView: {
    backgroundColor: "#161e2e",
    borderRadius: 10,
    overflow: "hidden",
  },
  logsView: {
    backgroundColor: "#161e2e",
    padding: 16,
    borderRadius: 10,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 1.8,
  },
  logLine: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    paddingBottom: 4,
    marginBottom: 4,
  },
};
