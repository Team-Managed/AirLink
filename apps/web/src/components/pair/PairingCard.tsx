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
      <div style={styles.pairingCard} className="saas-card">
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
            "Connect to Workstation"
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
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: "36px 32px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 16px 40px -10px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)",
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
    backgroundColor: "rgba(234, 88, 12, 0.1)",
    border: "1px solid rgba(234, 88, 12, 0.25)",
    color: "#ea580c",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#ea580c",
  },
  pairingTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 900,
    marginBottom: 8,
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  pairingSubtitle: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.55,
    marginBottom: 24,
  },
  pinInputWrapper: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    boxShadow: "inset 0 2px 4px rgba(15, 23, 42, 0.04)",
  },
  pinInput: {
    backgroundColor: "transparent",
    border: "none",
    color: "#0f172a",
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
    backgroundColor: "#ebe3d9",
    color: "#687a94",
    border: "1px solid rgba(24, 32, 48, 0.15)",
    padding: "12px 18px",
    borderRadius: 8,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "not-allowed",
    marginBottom: 18,
    transition: "all 0.15s ease",
  },
  connectBtnActive: {
    background: "linear-gradient(135deg, #5b9bd5 0%, #3e82c5 100%)",
    color: "#ffffff",
    border: "1px solid rgba(255, 255, 255, 0.35)",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(62, 130, 197, 0.4)",
    fontWeight: 700,
  },
  spinner: {
    width: 14,
    height: 14,
    border: "2px solid rgba(24, 32, 48, 0.3)",
    borderTopColor: "#182030",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  relayRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11,
    color: "#35455e",
  },
  relayLabel: { whiteSpace: "nowrap", fontWeight: 600 },
  relayInput: {
    flex: 1,
    backgroundColor: "#d4e0ea",
    border: "1px solid rgba(24, 32, 48, 0.15)",
    color: "#182030",
    fontSize: 11,
    padding: "6px 10px",
    borderRadius: 6,
    outline: "none",
  },
};
