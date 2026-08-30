"use client";

import React from "react";
import { InstallCommandBar } from "./InstallCommandBar";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Launch Workstation Host",
      desc: "Run one instant command in your terminal or start the VS Code extension. The bridge connects to your local Git repository and establishes an end-to-end encrypted WebSocket relay.",
      command: "npx agent-remote host",
    },
    {
      step: "02",
      title: "Pair via 6-Digit Session PIN",
      desc: "Open AirLink on your phone, tablet, or web browser. Type the ephemeral 6-digit PIN shown in your terminal. Zero port-forwarding or ngrok setup required.",
      command: "PIN: 849-204",
    },
    {
      step: "03",
      title: "Supervise & Approve Anywhere",
      desc: "Watch agent tokens stream in real time. When the agent attempts critical operations, review AST diffs and tap to approve directly from your pocket.",
      command: "180s HITL Interception Gate",
    },
  ];

  return (
    <section id="how-it-works" style={styles.section}>
      <div style={styles.header}>
        <h2 style={styles.sectionTitle}>Up and Running in 30 Seconds</h2>
        <p style={styles.sectionDesc}>
          AirLink connects your local development harness to your pocket with three simple steps.
        </p>
      </div>

      {/* Step Cards Grid */}
      <div style={styles.stepsGrid}>
        {steps.map((s) => (
          <div key={s.step} className="saas-card" style={styles.stepCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>{s.step}</span>
              <span style={styles.stepCodeLabel}>{s.command}</span>
            </div>
            <h3 style={styles.stepTitle}>{s.title}</h3>
            <p style={styles.stepDesc}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Terminal Install Command Bar */}
      <div style={styles.terminalContainer}>
        <InstallCommandBar />
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
    fontSize: "clamp(28px, 3.5vw, 40px)",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: -1,
    marginBottom: 10,
  },
  sectionDesc: {
    color: "#475569",
    fontSize: 15.5,
    maxWidth: 600,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 24,
    marginBottom: 36,
  },
  stepCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.04)",
    padding: 26,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  stepHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  stepNumber: {
    fontFamily: "var(--font-mono)",
    fontSize: 18,
    fontWeight: 800,
    color: "#2563eb",
  },
  stepCodeLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },
  stepTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  stepDesc: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.6,
  },
  terminalContainer: {
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 30px -5px rgba(15, 23, 42, 0.08)",
  },
};
