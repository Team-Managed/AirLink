"use client";

import React from "react";
import { InstallCommandBar } from "./InstallCommandBar";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Launch Workstation Host",
      desc: "Run one instant command in your terminal or start the VS Code extension. The bridge connects to your local Git repository and establishes an end-to-end encrypted WebSocket relay.",
    },
    {
      step: "02",
      title: "Pair via 6-Digit Session PIN",
      desc: "Open AirLink on your phone, tablet, or web browser. Type the ephemeral 6-digit PIN shown in your terminal. Zero port-forwarding or ngrok setup required.",
    },
    {
      step: "03",
      title: "Supervise & Approve Anywhere",
      desc: "Watch agent tokens stream in real time. When the agent attempts critical operations, review AST diffs and tap to approve directly from your pocket.",
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section-responsive" style={styles.section}>
      {/* Hero Panoramic Background Artwork Layer */}
      <div style={styles.backgroundArtwork} />
      <div style={styles.ambientOverlay} />

      <div style={styles.contentContainer}>
        {/* Section Header */}
        <div style={styles.header}>
          <h2 style={styles.sectionTitle}>Up and Running in 30 Seconds</h2>
          <p style={styles.sectionDesc}>
            AirLink connects your local development harness to your pocket with three simple steps.
          </p>
        </div>

        {/* Clean, Crisp Glassmorphism Cascade Grid */}
        <div className="how-it-works-grid-responsive cascade-grid-responsive" style={styles.cascadeGrid}>
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className={`cascade-step-card cascade-step-${idx + 1}`}
              style={{
                ...styles.stepCard,
                ...(idx === 0 ? styles.cascadeCard1 : {}),
                ...(idx === 1 ? styles.cascadeCard2 : {}),
                ...(idx === 2 ? styles.cascadeCard3 : {}),
              }}
            >
              <div style={styles.stepNumberRow}>
                <span style={styles.stepNumber}>{s.step}</span>
                <span style={styles.stepAccentBar} />
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
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    padding: "90px 24px 100px",
    margin: "40px auto 70px",
  },
  backgroundArtwork: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('/screenshot-hero.png')",
    backgroundSize: "cover",
    backgroundPosition: "center 50%",
    backgroundRepeat: "no-repeat",
    filter: "contrast(1.22) saturate(1.2) brightness(0.97)",
    zIndex: 0,
  },
  ambientOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, #ffffff 0%, rgba(255, 255, 255, 0.45) 20%, rgba(255, 255, 255, 0.55) 75%, #ffffff 100%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  contentContainer: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1240,
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 56,
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(30px, 3.8vw, 44px)",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: -1.2,
    marginBottom: 12,
  },
  sectionDesc: {
    color: "#334155",
    fontSize: "clamp(15px, 1.3vw, 17px)",
    maxWidth: 620,
    margin: "0 auto",
    lineHeight: 1.6,
    fontWeight: 500,
  },
  cascadeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 28,
    marginBottom: 56,
    alignItems: "start",
  },
  stepCard: {
    backgroundColor: "rgba(255, 255, 255, 0.68)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.9)",
    borderRadius: 22,
    boxShadow: "0 16px 40px -8px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.65)",
    padding: "36px 30px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    position: "relative",
  },
  cascadeCard1: {
    transform: "translateY(0px)",
  },
  cascadeCard2: {
    transform: "translateY(18px)",
  },
  cascadeCard3: {
    transform: "translateY(36px)",
  },
  stepNumberRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  stepNumber: {
    fontFamily: "var(--font-mono)",
    fontSize: 26,
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.04em",
  },
  stepAccentBar: {
    width: 32,
    height: 2,
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    borderRadius: 1,
  },
  stepTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: -0.4,
    margin: 0,
  },
  stepDesc: {
    color: "#334155",
    fontSize: 14.5,
    lineHeight: 1.65,
    margin: 0,
    fontWeight: 450,
  },
  terminalContainer: {
    marginTop: 48,
  },
};
