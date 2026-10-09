"use client";

import React, { useState } from "react";
import type { InstallTab } from "../../types";

export function InstallCommandBar() {
  const [activeTab, setActiveTab] = useState<InstallTab>("windows");
  const [copied, setCopied] = useState<boolean>(false);

  const installCommands: Record<InstallTab, string> = {
    windows: "irm https://airlink-green.vercel.app/install.ps1 | iex",
    posix: "curl -fsSL https://airlink-green.vercel.app/install.sh | bash",
    npx: "npx @airlink/cli",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" style={styles.installSection}>
      <div className="install-box-responsive" style={styles.installBox}>
        <div className="install-top-responsive" style={styles.installTop}>
          <div className="install-tabs-responsive" style={styles.installTabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "windows" ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab("windows")}
            >
              PowerShell (Windows)
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "posix" ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab("posix")}
            >
              curl (macOS / Linux)
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "npx" ? styles.tabButtonActive : {}),
              }}
              onClick={() => setActiveTab("npx")}
            >
              npx Instant Run
            </button>
          </div>

          <div style={styles.hintWrapper}>
            <span style={styles.liveIndicatorDot} />
            <span style={styles.installHint}>Zero-config local daemon</span>
          </div>
        </div>

        <div className="install-command-row-responsive" style={styles.commandRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, overflowX: "auto" }}>
            <span style={styles.promptSymbol}>$</span>
            <code style={styles.commandCode}>{installCommands[activeTab]}</code>
          </div>
          <button
            className="install-copy-btn-responsive"
            style={{
              ...styles.copyButton,
              ...(copied ? styles.copyButtonActive : {}),
            }}
            onClick={handleCopy}
          >
            {copied ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "#ffffff", fontWeight: 800 }}>✓</span> Copied!
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copy Command
              </span>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  installSection: {
    maxWidth: 960,
    margin: "0 auto",
    padding: 0,
    position: "relative",
    zIndex: 10,
  },
  installBox: {
    padding: "20px 24px",
    backgroundColor: "#090d16",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 18,
    boxShadow: "0 24px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)",
  },
  installTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: 14,
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  installTabs: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
  },
  tabButton: {
    backgroundColor: "transparent",
    border: "1px solid transparent",
    color: "#94a3b8",
    fontSize: 12.5,
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 8,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  tabButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.22)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
  },
  hintWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },
  installHint: {
    color: "#94a3b8",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
  },
  commandRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#000000",
    border: "1px solid rgba(255, 255, 255, 0.09)",
    borderRadius: 12,
    padding: "12px 16px",
    gap: 14,
  },
  promptSymbol: {
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 14,
  },
  commandCode: {
    flex: 1,
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    fontSize: 13.5,
    overflowX: "auto",
    whiteSpace: "nowrap",
  },
  copyButton: {
    background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 10px rgba(2, 132, 199, 0.35)",
    transition: "all 0.15s ease",
  },
  copyButtonActive: {
    background: "#10b981",
    borderColor: "#10b981",
    color: "#ffffff",
    boxShadow: "0 2px 10px rgba(16, 185, 129, 0.4)",
  },
};
