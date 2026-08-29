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
    backgroundColor: "rgba(24, 32, 48, 0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 20,
  },
  settingsCard: {
    backgroundColor: "#f6efe9",
    border: "1px solid rgba(24, 32, 48, 0.16)",
    borderRadius: 16,
    padding: 28,
    maxWidth: 480,
    width: "100%",
    boxShadow: "0 20px 60px -15px rgba(24, 32, 48, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
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
    color: "#182030",
    letterSpacing: -0.3,
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#687a94",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  settingsSubtitle: {
    color: "#35455e",
    fontSize: 12.5,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    display: "block",
    color: "#182030",
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
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.14)",
    color: "#35455e",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  providerPillActive: {
    backgroundColor: "#182030",
    borderColor: "#182030",
    color: "#f8fafc",
    boxShadow: "0 2px 6px rgba(24, 32, 48, 0.2)",
  },
  input: {
    width: "100%",
    backgroundColor: "#d4e0ea",
    border: "1px solid rgba(24, 32, 48, 0.18)",
    borderRadius: 7,
    padding: "8px 12px",
    color: "#182030",
    fontSize: 13,
    fontWeight: 600,
    outline: "none",
  },
  inputWithBtn: {
    display: "flex",
    gap: 6,
  },
  toggleKeyBtn: {
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.16)",
    color: "#182030",
    padding: "0 12px",
    borderRadius: 7,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  saveSettingsBtn: {
    width: "100%",
    backgroundColor: "#182030",
    color: "#f8fafc",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "10px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
    boxShadow: "0 2px 8px rgba(24, 32, 48, 0.25)",
    transition: "all 0.15s ease",
  },
};
