"use client";

import React, { useState } from "react";
import type { InstallTab } from "../../types";

export function InstallCommandBar() {
  const [activeTab, setActiveTab] = useState<InstallTab>("windows");
  const [copied, setCopied] = useState<boolean>(false);

  const installCommands: Record<InstallTab, string> = {
    windows: "irm https://agent-remote.dev/install.ps1 | iex",
    posix: "curl -fsSL https://agent-remote.dev/install.sh | bash",
    npx: "npx @agent-remote/cli",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommands[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" style={styles.installSection}>
      <div style={styles.installBox}>
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
            curl (macOS/Linux)
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

        <div style={styles.commandRow}>
          <span style={styles.promptSymbol}>$</span>
          <code style={styles.commandCode}>{installCommands[activeTab]}</code>
          <button style={styles.copyButton} onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Command"}
          </button>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  installSection: {
    maxWidth: 820,
    margin: "0 auto 60px",
    padding: "0 24px",
  },
  installBox: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  },
  installTabs: {
    display: "flex",
    gap: 8,
    borderBottom: "1px solid #1e293b",
    paddingBottom: 12,
    marginBottom: 12,
    overflowX: "auto",
  },
  tabButton: {
    backgroundColor: "transparent",
    border: "none",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tabButtonActive: {
    backgroundColor: "#1e293b",
    color: "#38bdf8",
  },
  commandRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: "10px 16px",
    gap: 12,
  },
  promptSymbol: {
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
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
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    padding: "6px 14px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
