"use client";

import React, { useState } from "react";
import type { InstallTab } from "../../types";

export function InstallCommandBar() {
  const [activeTab, setActiveTab] = useState<InstallTab>("windows");
  const [copied, setCopied] = useState<boolean>(false);

  const installCommands: Record<InstallTab, string> = {
    windows: "irm https://airlink.dev/install.ps1 | iex",
    posix: "curl -fsSL https://airlink.dev/install.sh | bash",
    npx: "npx @airlink/cli",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" style={styles.installSection}>
      <div className="saas-card" style={styles.installBox}>
        <div style={styles.installTop}>
          <div style={styles.installTabs}>
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

        <div style={styles.commandRow}>
          <span style={styles.promptSymbol}>$</span>
          <code style={styles.commandCode}>{installCommands[activeTab]}</code>
          <button
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
    maxWidth: 920,
    margin: "0 auto 64px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  installBox: {
    padding: "20px 22px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
  },
  installTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 14,
    marginBottom: 14,
    flexWrap: "wrap",
    gap: 10,
  },
  installTabs: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
  },
  tabButton: {
    backgroundColor: "transparent",
    border: "1px solid transparent",
    color: "#475569",
    fontSize: 12.5,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 7,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  tabButtonActive: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
    boxShadow: "0 2px 6px rgba(15, 23, 42, 0.15)",
  },
  hintWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#228a7a",
    boxShadow: "0 0 6px #228a7a",
  },
  installHint: {
    color: "#687a94",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
  },
  commandRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#161e2e",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    gap: 12,
  },
  promptSymbol: {
    color: "#e08a5b",
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 14,
  },
  commandCode: {
    flex: 1,
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    overflowX: "auto",
    whiteSpace: "nowrap",
  },
  copyButton: {
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    color: "#ffffff",
    padding: "7px 15px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(62, 130, 197, 0.35)",
    transition: "all 0.15s ease",
  },
  copyButtonActive: {
    background: "#0d9488",
    borderColor: "#0d9488",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(13, 148, 136, 0.3)",
  },
};
