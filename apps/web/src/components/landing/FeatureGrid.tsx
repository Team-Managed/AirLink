"use client";

import React from "react";

export function FeatureGrid() {
  const features = [
    {
      title: "Real-Time Token Streaming",
      desc: "Watch your workstation coding agent think, reason, and write code chunk by chunk with sub-50ms latency.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      title: "Human-in-the-Loop Interception",
      desc: "Intercept terminal commands, file writes, and critical tool calls before execution with mobile approvals.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: "Zero-Retention Tunnel",
      desc: "Your code and credentials never touch cloud disks. Ephemeral peer-routed WebSocket relay with BYOK.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
    },
    {
      title: "Multi-Model BYOK Vault",
      desc: "Seamlessly route turns between TrueForge, DeepSeek R1, Claude 3.7 Sonnet, and OpenAI o3-mini.",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        </svg>
      ),
    },
  ];

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Engineered for Autonomous Reliability</h2>
        <p style={styles.sectionDesc}>
          Everything you need to step away from your desk while your agent continues hacking on complex refactors.
        </p>
      </div>

      <div style={styles.grid}>
        {features.map((f) => (
          <div key={f.title} className="saas-card" style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.iconWell}>{f.icon}</div>
            </div>
            <h3 style={styles.cardTitle}>{f.title}</h3>
            <p style={styles.cardDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1240,
    margin: "0 auto 90px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 44,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(26px, 3.2vw, 36px)",
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 10,
    letterSpacing: -0.8,
  },
  sectionDesc: {
    color: "#475569",
    fontSize: "clamp(14.5px, 1.2vw, 16px)",
    maxWidth: 580,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 24,
  },
  card: {
    padding: 26,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.04)",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
  },
  iconWell: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17.5,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  cardDesc: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.6,
  },
};
