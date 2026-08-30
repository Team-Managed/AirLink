"use client";

import React from "react";

export function EcosystemShowcase() {
  const surfaces = [
    {
      name: "AirLink Mobile (PWA / iOS / Android)",
      role: "Pocket Teleoperation",
      desc: "Instant pairing via 6-digit PIN. Real-time token feeds, haptic alerts for approval requests, and BYOK encrypted vault.",
      tag: "Mobile",
      color: "#e08a5b",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e08a5b" strokeWidth="2.2">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      ),
    },
    {
      name: "AirLink Web Remote",
      role: "Browser Control Hub",
      desc: "Full browser pairing client running on any device with zero software install. Instant approvals and AST diff inspector.",
      tag: "Web",
      color: "#e5b771",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e5b771" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      name: "AirLink Workstation CLI",
      role: "Terminal Host Daemon",
      desc: "One-line local bridge with terminal user interface (TUI). Spawns and supervises TrueForge, Claude, or DeepSeek R1 agents.",
      tag: "Terminal",
      color: "#228a7a",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#228a7a" strokeWidth="2.2">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      ),
    },
    {
      name: "AirLink VS Code Extension",
      role: "Editor Sidecar Panel",
      desc: "Embeds live teleoperation directly in your editor sidebar. Pairs with mobile to hand off coding turns on the fly.",
      tag: "VS Code",
      color: "#556885",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#556885" strokeWidth="2.2">
          <path d="m18 16 4-2V8l-4-2" />
          <path d="m6 8-4 2v6l4 2" />
          <path d="m14.5 4-5 16" />
        </svg>
      ),
    },
  ];

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <div style={styles.tagWrapper}>
          <span style={styles.sectionTag}>Multiplatform Surfaces</span>
        </div>
        <h2 style={styles.sectionTitle}>Any Device. Anywhere.</h2>
        <p style={styles.sectionDesc}>
          Access your workstation coding harness whether you are at your desk, on your couch, or on the train.
        </p>
      </div>

      <div style={styles.grid}>
        {surfaces.map((s) => (
          <div key={s.name} className="saas-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.iconWell}>{s.icon}</div>
              <span
                style={{
                  ...styles.tag,
                  color: s.color,
                  backgroundColor: `${s.color}15`,
                  borderColor: `${s.color}40`,
                }}
              >
                {s.tag}
              </span>
            </div>
            <h3 style={styles.title}>{s.name}</h3>
            <span style={styles.role}>{s.role}</span>
            <p style={styles.desc}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    maxWidth: 1240,
    margin: "0 auto 100px",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 48,
  },
  tagWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  sectionTag: {
    color: "#228a7a",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    backgroundColor: "rgba(34, 138, 122, 0.12)",
    border: "1px solid rgba(34, 138, 122, 0.25)",
    padding: "3px 10px",
    borderRadius: 9999,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(28px, 3.5vw, 42px)",
    fontWeight: 900,
    color: "#182030",
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionDesc: {
    color: "#35455e",
    fontSize: 15.5,
    maxWidth: 620,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
    gap: 24,
  },
  card: {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#f6efe9",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 6,
    border: "1px solid",
  },
  role: {
    fontSize: 11.5,
    color: "#687a94",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 800,
    color: "#182030",
    letterSpacing: -0.3,
  },
  desc: {
    color: "#35455e",
    fontSize: 13.5,
    lineHeight: 1.6,
  },
};
