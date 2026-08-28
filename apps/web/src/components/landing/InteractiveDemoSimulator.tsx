"use client";

import React, { useState, useEffect } from "react";
import type { SimStep } from "../../types";

export function InteractiveDemoSimulator() {
  const [simStep, setSimStep] = useState<SimStep>("pending_approval");
  const [simCountdown, setSimCountdown] = useState<number>(180);
  const [simThoughtExpanded, setSimThoughtExpanded] = useState<boolean>(false);

  const handleApproveSim = () => {
    setSimStep("approved_executing");
    setTimeout(() => {
      setSimStep("completed");
    }, 2200);
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
        {/* Terminal Header */}
        <div style={styles.terminalHeader}>
          <div style={styles.terminalDots}>
            <span style={{ ...styles.dot, backgroundColor: "#ef4444" }} />
            <span style={{ ...styles.dot, backgroundColor: "#f59e0b" }} />
            <span style={{ ...styles.dot, backgroundColor: "#22c55e" }} />
          </div>
          <span style={styles.terminalTitle}>
            LIVE DUAL-SURFACE SIMULATOR: WORKSTATION & REMOTE
          </span>
          <div style={styles.sessionPill}>
            <span style={styles.statusLiveDot} />
            <span>PIN: 834-192</span>
          </div>
        </div>

        {/* Live Feed Container */}
        <div style={styles.terminalBody}>
          {/* User Prompt */}
          <div style={styles.feedRow}>
            <span style={styles.roleTagUser}>[Remote @ Phone]</span>
            <span style={styles.feedText}>
              Fix the memory leak in relay rate-limiter and run tests
            </span>
          </div>

          {/* Collapsible Thought Card */}
          <div style={styles.thoughtBox}>
            <div
              style={styles.thoughtHeader}
              onClick={() => setSimThoughtExpanded(!simThoughtExpanded)}
            >
              <div style={styles.thoughtTitleRow}>
                <span style={styles.thoughtBadge}>Thinking Process</span>
                <span style={styles.thoughtSummary}>
                  Analyzing ring-buffer eviction and sliding-window timestamp cleanup...
                </span>
              </div>
              <button style={styles.thoughtToggleBtn}>
                {simThoughtExpanded ? "Collapse" : "Expand"}
              </button>
            </div>
            {simThoughtExpanded && (
              <div style={styles.thoughtBody}>
                1. Inspect `apps/relay/src/rate-limiter.ts` sliding window buckets.
                <br />
                2. Add interval purge for expired window records to prevent Map growth.
                <br />
                3. Execute vitest suite to verify 0 regressions.
              </div>
            )}
          </div>

          {/* Unified Diff Card */}
          <div style={styles.diffCard}>
            <div style={styles.diffHeader}>
              <span style={styles.diffFilePath}>apps/relay/src/rate-limiter.ts</span>
              <span style={styles.diffStats}>+4 -1</span>
            </div>
            <div style={styles.diffContent}>
              <div style={styles.diffLineContext}>
                @@ -42,7 +42,10 @@ export class RateLimiter &#123;
              </div>
              <div style={styles.diffLineDelete}>- setInterval(() =&gt; &#123;&#125;, 60000);</div>
              <div style={styles.diffLineAdd}>+ private purgeExpiredBuckets(): void &#123;</div>
              <div style={styles.diffLineAdd}>+ const now = Date.now();</div>
              <div style={styles.diffLineAdd}>
                + for (const [k, v] of this.buckets) if (now &gt; v.expires) this.buckets.delete(k);
              </div>
              <div style={styles.diffLineAdd}>+ &#125;</div>
            </div>
          </div>

          {/* Approval Gate / Execution Flow */}
          {simStep === "pending_approval" && (
            <div style={styles.approvalBanner}>
              <div style={styles.approvalTop}>
                <div style={styles.approvalAlert}>
                  <span style={styles.warnIcon}>!</span>
                  <span style={styles.approvalHeading}>
                    Human-in-the-Loop Approval Required (Medium Risk)
                  </span>
                </div>
                <div style={styles.countdownBadge}>Auto-denies in: {simCountdown}s</div>
              </div>
              <p style={styles.approvalDesc}>
                Agent is requesting permission to execute:{" "}
                <code style={styles.inlineCode}>pnpm --filter @agent-remote/relay test</code>
              </p>
              <div style={styles.approvalButtons}>
                <button style={styles.approveButton} onClick={handleApproveSim}>
                  Approve on Device
                </button>
                <button
                  style={styles.denyButton}
                  onClick={() => alert("Simulation: Action denied by developer.")}
                >
                  Deny Action
                </button>
              </div>
            </div>
          )}

          {simStep === "approved_executing" && (
            <div style={styles.executingBox}>
              <div style={styles.executingHeader}>
                <span style={styles.spinner} />
                <span>Approved on phone. Running `pnpm test` on workstation...</span>
              </div>
              <div style={styles.streamingTokens}>
                <span>RUN v2.1.9 C:/Users/agent-harness</span>
                <br />
                <span>✓ apps/relay/tests/rate-limiter.test.ts (7 tests) [12ms]</span>
              </div>
            </div>
          )}

          {simStep === "completed" && (
            <div style={styles.completedBox}>
              <div style={styles.completedHeader}>
                <span style={styles.checkIcon}>[OK]</span>
                <span style={styles.completedTitle}>
                  Turn Completed Successfully (216/216 tests passing)
                </span>
              </div>
              <button style={styles.resetSimBtn} onClick={handleResetSim}>
                Reset Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  demoSection: {
    maxWidth: 960,
    margin: "0 auto 100px",
    padding: "0 24px",
  },
  demoCard: {
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
  },
  terminalHeader: {
    backgroundColor: "#0f172a",
    borderBottom: "1px solid #1e293b",
    padding: "12px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  terminalDots: {
    display: "flex",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  terminalTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    letterSpacing: 1,
  },
  sessionPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
    color: "#22c55e",
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#22c55e",
  },
  terminalBody: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  feedRow: {
    display: "flex",
    gap: 10,
    alignItems: "baseline",
    fontSize: 14,
    lineHeight: 1.5,
  },
  roleTagUser: {
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  feedText: {
    color: "#f8fafc",
  },
  thoughtBox: {
    backgroundColor: "#090d16",
    border: "1px solid #1e293b",
    borderRadius: 8,
    overflow: "hidden",
  },
  thoughtHeader: {
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  thoughtTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  thoughtBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.1)",
    border: "1px solid rgba(168, 85, 247, 0.3)",
    color: "#c084fc",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  thoughtSummary: {
    color: "#94a3b8",
    fontSize: 12,
    fontStyle: "italic",
  },
  thoughtToggleBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: 11,
    cursor: "pointer",
  },
  thoughtBody: {
    padding: "10px 14px",
    borderTop: "1px solid #1e293b",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: "var(--font-mono)",
  },
  diffCard: {
    backgroundColor: "#090d16",
    border: "1px solid #1e293b",
    borderRadius: 8,
    overflow: "hidden",
  },
  diffHeader: {
    backgroundColor: "#0f172a",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    borderBottom: "1px solid #1e293b",
  },
  diffFilePath: {
    color: "#cbd5e1",
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
  },
  diffStats: {
    color: "#22c55e",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  diffContent: {
    padding: "10px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.6,
  },
  diffLineContext: {
    color: "#64748b",
  },
  diffLineDelete: {
    color: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: "1px 4px",
    borderRadius: 2,
  },
  diffLineAdd: {
    color: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: "1px 4px",
    borderRadius: 2,
  },
  approvalBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    border: "1px solid #f59e0b",
    borderRadius: 8,
    padding: 16,
  },
  approvalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  approvalAlert: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  warnIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "#f59e0b",
    color: "#090d16",
    fontSize: 11,
    fontWeight: 900,
  },
  approvalHeading: {
    color: "#f59e0b",
    fontWeight: 700,
    fontSize: 13,
  },
  countdownBadge: {
    color: "#f59e0b",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    fontWeight: 700,
  },
  approvalDesc: {
    color: "#cbd5e1",
    fontSize: 13,
    marginBottom: 14,
  },
  inlineCode: {
    backgroundColor: "#0f172a",
    padding: "2px 6px",
    borderRadius: 4,
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
  },
  approvalButtons: {
    display: "flex",
    gap: 10,
  },
  approveButton: {
    backgroundColor: "#22c55e",
    color: "#090d16",
    border: "none",
    padding: "8px 18px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  denyButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "8px 18px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  executingBox: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 14,
  },
  executingHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#38bdf8",
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 10,
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(56, 189, 248, 0.2)",
    borderTopColor: "#38bdf8",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
  streamingTokens: {
    color: "#94a3b8",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    lineHeight: 1.6,
  },
  completedBox: {
    backgroundColor: "rgba(34, 197, 94, 0.05)",
    border: "1px solid #22c55e",
    borderRadius: 8,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completedHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    color: "#22c55e",
    fontWeight: 700,
    fontSize: 12,
  },
  completedTitle: {
    color: "#22c55e",
    fontWeight: 700,
    fontSize: 13,
  },
  resetSimBtn: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    padding: "4px 10px",
    borderRadius: 4,
    fontSize: 12,
    cursor: "pointer",
  },
};
