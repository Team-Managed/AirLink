"use client";

import React from "react";

export function HeroSection() {
  return (
    <section style={styles.heroSection}>
      {/* Dynamic Pill Badge */}
      <div style={styles.badgeWrapper}>
        <div style={styles.pillBadge} className="gradient-badge">
          <span style={styles.livePulseDot} />
          <span style={styles.badgeText}>
            AIRLINK v0.1.0 &bull; OVER-THE-AIR AGENT TELEOPERATION
          </span>
        </div>
      </div>

      {/* Main Hero Headline */}
      <h1 style={styles.heroTitle}>
        Pilot Your Local Coding Agent <br />
        <span className="gradient-text">From Your Pocket</span>
      </h1>

      {/* Subtitle */}
      <p style={styles.heroSubtitle}>
        Zero-configuration, zero-port-forwarding wireless harness for{" "}
        <strong style={{ color: "#f8fafc" }}>TrueForge</strong>,{" "}
        <strong style={{ color: "#f8fafc" }}>DeepSeek R1</strong>,{" "}
        <strong style={{ color: "#f8fafc" }}>0x Alpha</strong>, and{" "}
        <strong style={{ color: "#f8fafc" }}>Claude</strong>. Stream live tokens, review unified
        Git diffs, and approve or reject sensitive terminal actions with a 180s Human-in-the-Loop
        gate.
      </p>

      {/* Action Buttons */}
      <div style={styles.ctaRow}>
        <a
          href="https://expo.dev/accounts/tyraaa19/projects/airlink-monorepo/builds/6f4f8f2a-a760-469c-93e0-4f32bedf3e61"
          target="_blank"
          rel="noreferrer"
          className="primary-glowing-btn"
          style={styles.primaryCta}
        >
          <span>Download Android App (.APK)</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
        </a>
        <a href="#install" className="secondary-glowing-btn" style={styles.secondaryCta}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.8 }}
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span>Install Local CLI</span>
        </a>
      </div>

      {/* Trust & Metric Highlights Bar */}
      <div style={styles.metricsBar} className="glass-panel">
        <div style={styles.metricItem}>
          <span style={styles.metricValue}>0ms</span>
          <span style={styles.metricLabel}>Port Forwarding</span>
        </div>
        <div style={styles.metricDivider} />
        <div style={styles.metricItem}>
          <span style={styles.metricValue}>100%</span>
          <span style={styles.metricLabel}>Local Execution</span>
        </div>
        <div style={styles.metricDivider} />
        <div style={styles.metricItem}>
          <span style={styles.metricValue}>180s</span>
          <span style={styles.metricLabel}>HITL Safety Gate</span>
        </div>
        <div style={styles.metricDivider} />
        <div style={styles.metricItem}>
          <span style={styles.metricValue}>500 Ev</span>
          <span style={styles.metricLabel}>Offline Ring Buffer</span>
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroSection: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "90px 24px 40px",
    textAlign: "center",
    position: "relative",
    zIndex: 10,
  },
  badgeWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 24,
  },
  pillBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 16px",
    borderRadius: 9999,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#38bdf8",
    boxShadow: "0 0 10px #38bdf8",
    animation: "blinkCursor 1.5s infinite",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    fontFamily: "var(--font-mono)",
  },
  heroTitle: {
    fontSize: "clamp(36px, 5.5vw, 64px)",
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: -1.5,
    color: "#f8fafc",
    marginBottom: 24,
  },
  heroSubtitle: {
    fontSize: "clamp(15px, 2vw, 18px)",
    lineHeight: 1.65,
    color: "#94a3b8",
    maxWidth: 740,
    margin: "0 auto 38px",
  },
  ctaRow: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 50,
  },
  primaryCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 32px",
    borderRadius: 10,
    fontSize: 15,
    cursor: "pointer",
  },
  secondaryCta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 28px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  metricsBar: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    maxWidth: 780,
    margin: "0 auto",
    padding: "16px 24px",
    borderRadius: 14,
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 800,
    color: "#f8fafc",
    fontFamily: "var(--font-mono)",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
};
