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
    backgroundColor: "rgba(24, 32, 48, 0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  approvalCard: {
    backgroundColor: "#f6efe9",
    border: "1px solid rgba(24, 32, 48, 0.16)",
    borderRadius: 16,
    padding: 26,
    maxWidth: 540,
    width: "100%",
    boxShadow: "0 20px 60px -15px rgba(24, 32, 48, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
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
    color: "#182030",
    letterSpacing: -0.3,
  },
  riskBadge: {
    backgroundColor: "rgba(229, 183, 113, 0.18)",
    border: "1px solid rgba(229, 183, 113, 0.4)",
    color: "#854d0e",
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
  toolLabel: { color: "#687a94", fontWeight: 600 },
  toolBadge: {
    backgroundColor: "rgba(224, 138, 91, 0.14)",
    border: "1px solid rgba(224, 138, 91, 0.3)",
    color: "#e08a5b",
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
    backgroundColor: "#161e2e",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
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
    backgroundColor: "#f6efe9",
    border: "1px solid #c74444",
    color: "#c74444",
    padding: "10px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  approveBtn: {
    flex: 2,
    backgroundColor: "#182030",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#f8fafc",
    padding: "10px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(24, 32, 48, 0.25)",
    transition: "all 0.15s ease",
  },
  approveBtnDisabled: {
    backgroundColor: "#d4e0ea",
    color: "#94a3b8",
    border: "1px solid #94a3b8",
    boxShadow: "none",
    cursor: "not-allowed",
  },
};
