"use client";

import React from "react";
import Link from "next/link";
import type { SessionConnected } from "@agent-remote/protocol";

interface PairHeaderProps {
  isConnected: boolean;
  sessionData: SessionConnected | null;
  showSettings: boolean;
  onToggleSettings: () => void;
  onDisconnect: () => void;
}

export function PairHeader({
  isConnected,
  sessionData,
  showSettings,
  onToggleSettings,
  onDisconnect,
}: PairHeaderProps) {
  return (
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
        <button style={styles.settingsBtn} onClick={onToggleSettings}>
          {showSettings ? "Close Settings" : "BYOK Settings"}
        </button>
        {isConnected && (
          <button style={styles.disconnectBtn} onClick={onDisconnect}>
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
};
