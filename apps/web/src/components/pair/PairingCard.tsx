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
        <div style={styles.badgeRow}>
          <div style={styles.pairingIconBadge}>
            <span style={styles.pulseDot} />
            <span>SESSION PIN PAIRING</span>
          </div>
        </div>

        <h2 style={styles.pairingTitle}>Pair with Local Workstation</h2>
        <p style={styles.pairingSubtitle}>
          Enter the 6-digit PIN displayed on your terminal host or VS Code extension panel.
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
          {isConnecting ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="spinner" style={styles.spinner} />
              Connecting to AirLink Relay...
            </span>
          ) : (
            "Connect to Workstation →"
          )}
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
    position: "relative",
    zIndex: 10,
  },
  pairingCard: {
    backgroundColor: "#0c1322",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: "36px 32px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
  },
  badgeRow: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 16,
  },
  pairingIconBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 11,
    padding: "3px 12px",
    borderRadius: 9999,
    letterSpacing: 1,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#38bdf8",
  },
  pairingTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 8,
    color: "#f8fafc",
    letterSpacing: -0.5,
  },
  pairingSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.55,
    marginBottom: 24,
  },
  pinInputWrapper: {
    backgroundColor: "#0a101f",
    border: "1.5px solid rgba(59, 130, 246, 0.65)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    boxShadow: "0 0 20px rgba(37, 99, 235, 0.25) inset",
  },
  pinInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ffffff",
    fontFamily: "var(--font-mono)",
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: 10,
    textAlign: "center",
    width: "100%",
    outline: "none",
  },
  connectBtn: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#64748b",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "12px 18px",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "not-allowed",
    marginBottom: 18,
    transition: "all 0.15s ease",
  },
  connectBtnActive: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.25)",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.5)",
    fontWeight: 700,
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  relayRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    color: "#94a3b8",
  },
  relayLabel: { whiteSpace: "nowrap", fontWeight: 600 },
  relayInput: {
    flex: 1,
    backgroundColor: "#0a101f",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#f8fafc",
    fontSize: 11,
    padding: "6px 10px",
    borderRadius: 6,
    outline: "none",
  },
};
