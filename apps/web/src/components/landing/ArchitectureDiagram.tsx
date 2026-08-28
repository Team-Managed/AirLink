"use client";

import React from "react";

export function ArchitectureDiagram() {
  const steps = [
    {
      title: "1. Client Layer (Phone / Web)",
      desc: "Mobile Expo app or Next.js browser client sends typed prompts and receives character tokens, diff hunks, and approval gates.",
      tag: "UI / UX",
    },
    {
      title: "2. Cloud Relay (Ephemeral Tunnel)",
      desc: "Zero-retention Socket.io relay server manages rooms by 6-digit PIN. Never stores code, tokens, or persistent session state.",
      tag: "TRANSPORT",
    },
    {
      title: "3. Workstation Bridge (Local Core)",
      desc: "CLI host or VS Code extension runs locally. Executes bash tools, resolves Git diffs, applies 5-layer prompt cache, and routes turns.",
      tag: "EXECUTION",
    },
  ];

  return (
    <section id="architecture" style={styles.archSection}>
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Zero-Retention 3-Tier Architecture</h2>
        <p style={styles.sectionSubtitle}>
          Your workspace code and file contents never leave your workstation.
        </p>
      </div>

      <div style={styles.archGrid}>
        {steps.map((s) => (
          <div key={s.title} style={styles.archCard}>
            <span style={styles.archTag}>{s.tag}</span>
            <h3 style={styles.archCardTitle}>{s.title}</h3>
            <p style={styles.archCardDesc}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  archSection: {
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
  archGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
  },
  archCard: {
    backgroundColor: "#05080f",
    border: "1px solid #1e293b",
    borderRadius: 12,
    padding: 24,
    display: "flex",
    flexDirection: "column",
  },
  archTag: {
    color: "#a855f7",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 12,
  },
  archCardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#f8fafc",
    marginBottom: 8,
  },
  archCardDesc: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.6,
  },
};
