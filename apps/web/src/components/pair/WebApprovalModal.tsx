"use client";

import React from "react";
import type { ApprovalRequest } from "@agent-remote/protocol";

interface WebApprovalModalProps {
  activeApproval: ApprovalRequest;
  onApprove: (approvalId: string) => void;
  onDeny: (approvalId: string) => void;
}

export function WebApprovalModal({ activeApproval, onApprove, onDeny }: WebApprovalModalProps) {
  return (
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
          <button style={styles.denyBtn} onClick={() => onDeny(activeApproval.approvalId)}>
            Deny Action
          </button>
          <button style={styles.approveBtn} onClick={() => onApprove(activeApproval.approvalId)}>
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
    color: "#f8fafc",
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
};
