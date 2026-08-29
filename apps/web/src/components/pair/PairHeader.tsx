"use client";

import React from "react";
import Link from "next/link";
import type { SessionConnected } from "@airlink/protocol";
import { AirLinkAgentLogo } from "../ui/AirLinkAgentLogo";

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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Home</span>
        </Link>
        <div style={styles.brandGroup}>
          <AirLinkAgentLogo size={26} />
          <span style={styles.brandTitle}>AIRLINK WEB REMOTE</span>
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
    backgroundColor: "rgba(186, 203, 217, 0.82)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(24, 32, 48, 0.12)",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 20,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color: "#182030",
    fontSize: 12,
    fontWeight: 600,
    padding: "5px 10px",
    borderRadius: 6,
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.15)",
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(224, 138, 91, 0.14)",
    border: "1px solid rgba(224, 138, 91, 0.3)",
  },
  brandTitle: {
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 13.5,
    letterSpacing: 0.8,
    color: "#182030",
  },
  connectedBadge: {
    color: "#228a7a",
    fontSize: 11.5,
    fontFamily: "var(--font-mono)",
    backgroundColor: "rgba(34, 138, 122, 0.12)",
    border: "1px solid rgba(34, 138, 122, 0.3)",
    padding: "3px 10px",
    borderRadius: 9999,
    fontWeight: 700,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  settingsBtn: {
    backgroundColor: "#f6efe9",
    border: "1px solid rgba(24, 32, 48, 0.16)",
    color: "#182030",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(24, 32, 48, 0.06)",
    transition: "all 0.15s ease",
  },
  disconnectBtn: {
    backgroundColor: "rgba(199, 68, 68, 0.12)",
    border: "1px solid rgba(199, 68, 68, 0.3)",
    color: "#c74444",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
};
