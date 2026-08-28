"use client";

import React from "react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section style={styles.heroSection}>
      <div style={styles.heroTagContainer}>
        <span style={styles.heroTag}>OPEN-SOURCE CODING AGENT REMOTE HARNESS</span>
      </div>

      <h1 style={styles.heroTitle}>
        Control Your Local Coding Agent <br />
        <span style={styles.heroGradient}>From Anywhere</span>
      </h1>

      <p style={styles.heroSubtitle}>
        Zero port-forwarding remote harness for TrueForge, DeepSeek R1, 0x Alpha, and Claude. Stream
        tokens in real time, review unified Git diffs, and approve sensitive bash commands directly
        from your phone or browser.
      </p>

      <div style={styles.heroCtaRow}>
        <Link href="/pair" style={styles.primaryCta}>
          Launch Web Remote
        </Link>
        <a href="#install" style={styles.secondaryCta}>
          Install Local CLI
        </a>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroSection: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "80px 24px 40px",
    textAlign: "center",
  },
  heroTagContainer: {
    marginBottom: 20,
  },
  heroTag: {
    display: "inline-block",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: "var(--font-mono)",
  },
  heroTitle: {
    fontSize: "clamp(32px, 5vw, 56px)",
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: -1,
    color: "#f8fafc",
    marginBottom: 24,
  },
  heroGradient: {
    background: "linear-gradient(135deg, #38bdf8 0%, #a855f7 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    fontSize: "clamp(15px, 2vw, 18px)",
    lineHeight: 1.6,
    color: "#94a3b8",
    maxWidth: 720,
    margin: "0 auto 36px",
  },
  heroCtaRow: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  primaryCta: {
    backgroundColor: "#38bdf8",
    color: "#090d16",
    padding: "12px 28px",
    borderRadius: 8,
    fontWeight: 800,
    fontSize: 15,
  },
  secondaryCta: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    color: "#f8fafc",
    padding: "12px 28px",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
  },
};
