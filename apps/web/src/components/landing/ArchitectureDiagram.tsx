"use client";

import React from "react";

export function ArchitectureDiagram() {
  const steps = [
    {
      num: "01",
      title: "Local Bridge Daemon",
      subtitle: "Workstation Host",
      desc: "Connects to your local Git workspace and agent process via MCP. Intercepts bash commands and streams ring buffer logs.",
      color: "#e08a5b",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e08a5b" strokeWidth="2.2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      num: "02",
      title: "Ephemeral Relay",
      subtitle: "Zero-Retention Tunnel",
      desc: "Routes bidirectional events between workstation and client using 6-digit session PINs. Never persists tokens or code to disk.",
      color: "#e5b771",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e5b771" strokeWidth="2.2">
          <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
          <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
          <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
        </svg>
      ),
    },
    {
      num: "03",
      title: "Mobile & Web Surface",
      subtitle: "Client Remote",
      desc: "Displays live tokens, allows typing remote directives, and presents 180s interactive approval drawers with haptic alerts.",
      color: "#228a7a",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#228a7a" strokeWidth="2.2">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      ),
    },
  ];

  return (
    <section id="architecture" style={styles.section}>
      <div style={styles.header}>
        <span style={styles.sectionTag}>Architecture Pipeline</span>
        <h2 style={styles.sectionTitle}>Zero Retention. Total Control.</h2>
        <p style={styles.sectionDesc}>
          How AirLink bridges your workstation agent securely to your pocket in under 50 milliseconds.
        </p>
      </div>

      <div style={styles.pipeline}>
        {steps.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="saas-card" style={styles.stepCard}>
              <div style={styles.stepHeader}>
                <div style={styles.iconCircle}>{s.icon}</div>
                <span style={{ ...styles.stepNum, color: s.color }}>{s.num}</span>
                <span style={styles.stepSubtitle}>{s.subtitle}</span>
              </div>
              <h3 style={styles.stepTitle}>{s.title}</h3>
              <p style={styles.stepDesc}>{s.desc}</p>
            </div>
            {idx < steps.length - 1 && (
              <div style={styles.arrowBetween}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#687a94" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </React.Fragment>
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
  pipeline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  stepCard: {
    flex: "1 1 300px",
    maxWidth: 360,
    padding: "24px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#f6efe9",
  },
  stepHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ebe3d9",
    border: "1px solid rgba(24, 32, 48, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    fontWeight: 800,
  },
  stepSubtitle: {
    fontSize: 11,
    color: "#687a94",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  stepTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 17,
    fontWeight: 800,
    color: "#182030",
    letterSpacing: -0.3,
  },
  stepDesc: {
    color: "#35455e",
    fontSize: 13.5,
    lineHeight: 1.6,
  },
  arrowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#687a94",
    padding: "0 4px",
  },
};
