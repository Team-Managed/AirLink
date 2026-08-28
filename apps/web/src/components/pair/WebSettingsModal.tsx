"use client";

import React from "react";

interface WebSettingsModalProps {
  provider: string;
  model: string;
  apiKey: string;
  showApiKey: boolean;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  onToggleShowApiKey: () => void;
  onClose: () => void;
}

export function WebSettingsModal({
  provider,
  model,
  apiKey,
  showApiKey,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onToggleShowApiKey,
  onClose,
}: WebSettingsModalProps) {
  const providers = ["openrouter", "gemini", "anthropic", "openai", "groq", "custom"];

  return (
    <div style={styles.settingsOverlay}>
      <div style={styles.settingsCard}>
        <div style={styles.settingsHeader}>
          <h3 style={styles.settingsTitle}>BYOK Model Configuration</h3>
          <button style={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
        <p style={styles.settingsSubtitle}>
          Bring Your Own Key credentials are kept strictly in-browser memory and sent per turn.
        </p>

        <div style={styles.formGroup}>
          <label style={styles.label}>AI Provider</label>
          <div style={styles.pillRow}>
            {providers.map((p) => (
              <button
                key={p}
                style={{
                  ...styles.providerPill,
                  ...(provider === p ? styles.providerPillActive : {}),
                }}
                onClick={() => onProviderChange(p)}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Active Model Identifier</label>
          <input
            type="text"
            style={styles.input}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="e.g. 0x-alpha, deepseek/deepseek-r1, claude-3-5-sonnet"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>API Key</label>
          <div style={styles.inputWithBtn}>
            <input
              type={showApiKey ? "text" : "password"}
              style={styles.input}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-or-... or provider key"
            />
            <button type="button" style={styles.toggleKeyBtn} onClick={onToggleShowApiKey}>
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button style={styles.saveSettingsBtn} onClick={onClose}>
          Save Configuration
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  settingsOverlay: {
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
  settingsCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 24,
    maxWidth: 480,
    width: "100%",
  },
  settingsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f8fafc",
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 13,
    cursor: "pointer",
  },
  settingsSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 6,
  },
  pillRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  providerPill: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "4px 8px",
    borderRadius: 4,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    cursor: "pointer",
  },
  providerPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid #38bdf8",
    color: "#38bdf8",
  },
  input: {
    width: "100%",
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 6,
    padding: "8px 12px",
    color: "#f8fafc",
    fontSize: 13,
    outline: "none",
  },
  inputWithBtn: {
    display: "flex",
    gap: 6,
  },
  toggleKeyBtn: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#cbd5e1",
    padding: "0 10px",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
  },
  saveSettingsBtn: {
    width: "100%",
    backgroundColor: "#38bdf8",
    color: "#090d16",
    border: "none",
    padding: "10px",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
  },
};
