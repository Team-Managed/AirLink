"use client";

import React from "react";

interface PairingCardProps {
  pin: string;
  relayUrl: string;
  isConnecting: boolean;
  onPinChange: (pin: string) => void;
  onRelayUrlChange: (url: string) => void;
  onConnect: (pin: string) => void;
}

export function PairingCard({
  pin,
  relayUrl,
  isConnecting,
  onPinChange,
  onRelayUrlChange,
  onConnect,
}: PairingCardProps) {
  return (
    <div style={styles.pairingContainer}>
      <div style={styles.pairingCard}>
        <div style={styles.pairingIconBadge}>PIN</div>
        <h2 style={styles.pairingTitle}>Pair with Workstation Host</h2>
        <p style={styles.pairingSubtitle}>
          Enter the 6-digit PIN displayed on your terminal or VS Code extension.
        </p>

        <div style={styles.pinInputWrapper}>
          <input
            type="text"
            maxLength={6}
            style={styles.pinInput}
            value={pin}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/\D/g, "").slice(0, 6);
              onPinChange(sanitized);
              if (sanitized.length === 6) {
                onConnect(sanitized);
              }
            }}
            placeholder="------"
            autoFocus
          />
        </div>

        <button
          style={{
            ...styles.connectBtn,
            ...(pin.length === 6 ? styles.connectBtnActive : {}),
          }}
          disabled={pin.length !== 6 || isConnecting}
          onClick={() => onConnect(pin)}
        >
          {isConnecting ? "Connecting to Relay..." : "Connect to PC"}
        </button>

        <div style={styles.relayRow}>
          <label style={styles.relayLabel}>Relay URL:</label>
          <input
            type="text"
            style={styles.relayInput}
            value={relayUrl}
            onChange={(e) => onRelayUrlChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pairingContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  pairingCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: 36,
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  },
  pairingIconBadge: {
    display: "inline-block",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontWeight: 800,
    fontSize: 14,
    padding: "4px 12px",
    borderRadius: 6,
    marginBottom: 16,
    border: "1px solid rgba(56, 189, 248, 0.3)",
  },
  pairingTitle: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 8,
    color: "#f8fafc",
  },
  pairingSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 24,
  },
  pinInputWrapper: {
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: 8,
    textAlign: "center",
    width: "100%",
    outline: "none",
  },
  connectBtn: {
    width: "100%",
    backgroundColor: "#1e293b",
    color: "#64748b",
    border: "none",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: "not-allowed",
    marginBottom: 20,
  },
  connectBtnActive: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    cursor: "pointer",
  },
  relayRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    color: "#64748b",
  },
  relayLabel: { whiteSpace: "nowrap" },
  relayInput: {
    flex: 1,
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    color: "#94a3b8",
    fontSize: 11,
    padding: "4px 8px",
    borderRadius: 4,
    outline: "none",
  },
};
