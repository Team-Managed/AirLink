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
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  settingsCard: {
    backgroundColor: "#0c1322",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 28,
    maxWidth: 480,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
  },
  settingsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  settingsTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 18,
    fontWeight: 800,
    color: "#f8fafc",
    letterSpacing: -0.3,
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  settingsSubtitle: {
    color: "#94a3b8",
    fontSize: 12.5,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  pillRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  providerPill: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#94a3b8",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  providerPillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#38bdf8",
    color: "#ffffff",
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
  },
  input: {
    width: "100%",
    backgroundColor: "#0a101f",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 7,
    padding: "8px 12px",
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: 600,
    outline: "none",
  },
  inputWithBtn: {
    display: "flex",
    gap: 6,
  },
  toggleKeyBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#38bdf8",
    padding: "0 12px",
    borderRadius: 7,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  saveSettingsBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    padding: "10px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
    transition: "all 0.15s ease",
  },
};
