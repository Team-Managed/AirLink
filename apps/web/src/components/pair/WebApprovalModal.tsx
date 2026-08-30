"use client";

import React, { useState, useEffect } from "react";
import type { ApprovalRequest } from "@airlink/protocol";

interface WebApprovalModalProps {
  activeApproval: ApprovalRequest;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string, reason?: string) => void;
}

export function WebApprovalModal({ activeApproval, onApprove, onDeny }: WebApprovalModalProps) {
  const timeoutMs = activeApproval.timeoutMs || 180000;
  const createdAt = activeApproval.createdAt || Date.now();
  const expiresAt = createdAt + timeoutMs;

  const calculateRemainingSeconds = () => {
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    return remaining;
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemainingSeconds();
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        onDeny(activeApproval.approvalId, "Approval timed out on web client");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeApproval.approvalId, expiresAt, onDeny]);

  const isExpired = remainingSeconds <= 0;

  // 3-band countdown color: emerald green >60s, amber 20s-60s, crimson <=20s
  const getCountdownColor = () => {
    if (remainingSeconds > 60) return "#22c55e";
    if (remainingSeconds > 20) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={styles.approvalOverlay}>
      <div style={styles.approvalCard}>
        <div style={styles.approvalHeader}>
          <span style={{ ...styles.warnDot, backgroundColor: getCountdownColor() }} />
          <h3 style={styles.approvalTitle}>Human-in-the-Loop Approval Required</h3>
          <span style={styles.riskBadge}>
            {(activeApproval.riskLevel || "MEDIUM").toUpperCase()} RISK
          </span>
        </div>

        <div style={styles.approvalMetaRow}>
          <div style={styles.approvalToolRow}>
            <span style={styles.toolLabel}>Tool:</span>
            <span style={styles.toolBadge}>{activeApproval.toolName}</span>
          </div>
          <div style={{ ...styles.countdownBadge, color: getCountdownColor() }}>
            {isExpired ? "EXPIRED" : `Auto-denies in: ${remainingSeconds}s`}
          </div>
        </div>

        <div style={styles.commandPreview}>
          <pre style={styles.commandCode}>{activeApproval.commandOrDiff}</pre>
        </div>

        <div style={styles.approvalActions}>
          <button style={styles.denyBtn} onClick={() => onDeny(activeApproval.approvalId)}>
            Deny Action
          </button>
          <button
            style={{
              ...styles.approveBtn,
              ...(isExpired ? styles.approveBtnDisabled : {}),
            }}
            disabled={isExpired}
            onClick={() => onApprove(activeApproval.approvalId)}
          >
            Approve on PC
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  approvalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  approvalCard: {
    backgroundColor: "#0c1322",
    border: "1px solid rgba(234, 88, 12, 0.3)",
    borderRadius: 16,
    padding: 26,
    maxWidth: 540,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
  },
  approvalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  warnDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
  },
  approvalTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    fontWeight: 800,
    flex: 1,
    color: "#ea580c",
    letterSpacing: -0.3,
  },
  riskBadge: {
    backgroundColor: "rgba(234, 88, 12, 0.15)",
    border: "1px solid rgba(234, 88, 12, 0.35)",
    color: "#fb923c",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  approvalMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  approvalToolRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
  },
  toolLabel: { color: "#94a3b8", fontWeight: 600 },
  toolBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.14)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
  },
  countdownBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 11.5,
    fontWeight: 700,
  },
  commandPreview: {
    backgroundColor: "#030712",
    border: "1px solid rgba(234, 88, 12, 0.25)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    maxHeight: 180,
    overflowY: "auto",
  },
  commandCode: {
    color: "#fdba74",
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
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    color: "#f87171",
    padding: "10px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  approveBtn: {
    flex: 2,
    backgroundColor: "#16a34a",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    padding: "10px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(22, 163, 74, 0.4)",
    transition: "all 0.15s ease",
  },
  approveBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#64748b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "none",
    cursor: "not-allowed",
  },
};
