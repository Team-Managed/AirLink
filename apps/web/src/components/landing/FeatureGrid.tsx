"use client";

import React from "react";

export function FeatureGrid() {
  const features = [
    {
      title: "Zero-Config PIN Pairing",
      desc: "Connect phone to PC in seconds via temporary 6-digit code. No port forwarding, SSH keys, or public IP needed.",
      tag: "CORE TRANSPORT",
    },
    {
      title: "Real-Time Token & Tool Stream",
      desc: "Live character-by-character output from local AI models (TrueForge, DeepSeek, Claude) with tool execution logs.",
      tag: "STREAMING ENGINE",
    },
    {
      title: "Dual-Surface HITL Approvals",
      desc: "Destructive actions (bash scripts, file edits, git reset) pause and require one-tap approval with a 180s countdown.",
      tag: "SECURITY GATE",
    },
    {
      title: "Reconnection Resilience",
      desc: "Seamlessly handles subway drops, phone lock screens, and network switches with monotonic sequence replay.",
      tag: "FAILOVER SYNC",
    },
  ];

  return (
    <section id="features" style={styles.featuresSection}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Engineered for Local Agent Workflows</h2>
        <p style={styles.sectionSubtitle}>
          Built specifically to eliminate context bloat and keep execution on your machine.
        </p>
      </div>

      <div style={styles.featuresGrid}>
        {features.map((f) => (
          <div key={f.title} style={styles.featureCard}>
            <span style={styles.featureTag}>{f.tag}</span>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  featuresSection: {
    maxWidth: 1100,
    margin: "0 auto 120px",
    padding: "0 24px",
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: "clamp(24px, 3vw, 36px)",
    fontWeight: 800,
    color: "#f8fafc",
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: "#94a3b8",
    fontSize: 15,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
  },
  featureCard: {
    backgroundColor: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },
  featureTag: {
    color: "#38bdf8",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 8,
  },
  featureDesc: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.6,
  },
};
